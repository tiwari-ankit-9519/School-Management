import {
  Admin,
  DocumentOwnerType,
  DocumentType,
  Role,
  TeacherApplication,
} from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  CreateModeratorInput,
  ModeratorWithDetails,
  TeacherApplicationInput,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { hashPassword } from "../utils/password";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  sendModeratorInformation,
  sendTeacherApplicationEmail,
  sendTeacherApplicationResubmissionEmail,
} from "./email.service";
import {
  CloudinaryUploadResult,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config";

const log = createModuleLogger("UserManagement");

// Moderator Creation
export async function createModeratorService(
  data: CreateModeratorInput,
  schoolId: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<ModeratorWithDetails> {
  try {
    log.info("Modeartor creation service start", {
      ipAddress: context.ipAddress,
      schoolId,
      adminId,
      data,
    });

    const [moderatorExists, school] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      }),
      prisma.school.findUniqueOrThrow({
        where: { id: schoolId },
        select: { name: true },
      }),
    ]);

    if (moderatorExists) {
      log.warn("Moderator already exists with the email address", {
        email: data.email,
      });
      throw new Error("Moderator already exists with the email address");
    }

    const result = await prisma.$transaction(async (tx) => {
      const [{ generate_registration_number: regNumber }] = await tx.$queryRaw<
        [{ generate_registration_number: string }]
      >`
  SELECT generate_registration_number(${schoolId}, ${Role.MODERATOR})
`;

      const tempPassword = `Moderator@${Math.random().toString(36).slice(-8)}`;
      const hasedPassword = await hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          schoolId,
          regNumber: regNumber,
          email: data.email,
          phone: data.phone,
          passwordHash: hasedPassword,
          isActive: true,
          isVerified: false,
          role: "MODERATOR",
        },
      });

      const adminUser = await tx.admin.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          department: data.department,
          designation: data.designation,
          permissions: {
            createMany: {
              data: data.permissions.map((p) => ({
                module: p.module,
                canCreate: p.canCreate,
                canRead: p.canRead,
                canUpdate: p.canUpdate,
                canDelete: p.canDelete,
                canApprove: p.canApprove,
                canExport: p.canExport,
              })),
            },
          },
        },
      });

      log.info("User created successfully", {
        userName: `${adminUser.firstName} ${adminUser.lastName}`,
        userRegNumber: user.regNumber,
      });

      return {
        moderator: await tx.admin.findUniqueOrThrow({
          where: { userId: user.id },
          include: {
            user: {
              select: {
                id: true,
                regNumber: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
              },
            },
            permissions: true,
          },
        }),
        tempPassword,
      };
    });

    await createSystemLog({
      level: "INFO",
      module: "ModeratorCreation",
      message: "Moderator created",
      context,
      statusCode,
      metadata: {
        schoolId,
        adminId,
        regNumber: result.moderator.user.regNumber,
        userFirstName: result.moderator.firstName,
        userLastName: result.moderator.lastName,
        userDOB: result.moderator.dateOfBirth,
        email: result.moderator.user.email,
        userDesignation: result.moderator.designation,
        userDepartment: result.moderator.department,
      },
    });

    await createAuditLog({
      schoolId,
      performedById: adminId,
      action: "CREATE",
      module: "User",
      resourceId: result.moderator.user?.regNumber,
      resourceType: "ModeratorCreation",
      newValues: {
        regNumber: result.moderator.user?.regNumber,
        userFirstName: result.moderator.firstName,
        userLastName: result.moderator.lastName,
        userDOB: result.moderator.dateOfBirth,
        email: result.moderator.user.email,
        userDesignation: result.moderator.designation,
        userDepartment: result.moderator.department,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await sendModeratorInformation({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      regNumber: result.moderator.user.regNumber,
      tempPassword: result.tempPassword,
      designation: result.moderator.designation ?? "",
      department: result.moderator.department ?? "",
      schoolName: school.name,
    });
    return result.moderator;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create moderator", {
      schoolId,
      adminId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

// Teacher application
export async function teacherApplicationService(
  data: TeacherApplicationInput,
  schoolId: string,
  files: Express.Multer.File[],
  context: AuditContext,
  statusCode: number,
): Promise<TeacherApplication> {
  try {
    log.info("Teacher Application service starting", {
      teacherEmail: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const applicationExists = await prisma.teacherApplication.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    const school = await prisma.school.findUnique({
      where: {
        id: schoolId,
      },
    });

    if (applicationExists) {
      if (applicationExists.status === "REJECTED") {
        log.info("Resubmitting reject teacher application", {
          existingApplicationId: applicationExists.id,
          email: data.email,
          phone: data.phone,
        });

        const uploadedFiles: Array<{
          uploadResult: CloudinaryUploadResult;
          documentType: DocumentType;
          title: string;
        }> = [];

        if (files.length > 0) {
          log.info("Uploading documents to cloudinary", {
            fileCount: files.length,
          });

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const documentMeta = data.documents?.[i];
            const uploadResult = await uploadToCloudinary(
              file,
              "teacher-applications",
            );
            uploadedFiles.push({
              uploadResult,
              documentType: documentMeta?.documentType ?? "OTHER",
              title: documentMeta?.title ?? file.originalname,
            });
            log.info("Documents uploaded successfully", {
              publicId: uploadResult.publicId,
              documentType: documentMeta?.documentType,
              title: documentMeta?.title,
            });
          }
        }

        const resubmittedApplication = await prisma.$transaction(async (tx) => {
          const updated = await tx.teacherApplication.update({
            where: { id: applicationExists.id },
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              gender: data.gender,
              dateOfBirth: data.dateOfBirth,
              address: data.address,
              city: data.city,
              state: data.state,
              pincode: data.pincode,
              qualification: data.qualification,
              experience: data.experience,
              specialization: data.specialization,
              schoolId,
            },
          });

          if (uploadedFiles.length > 0) {
            const existingDocs = await tx.document.findMany({
              where: {
                ownerId: updated.id,
                ownerType: "TEACHER_APPLICATION",
              },
              select: {
                cloudinaryId: true,
              },
            });

            existingDocs.forEach(({ cloudinaryId }) => {
              deleteFromCloudinary(cloudinaryId).catch((err) => {
                log.warn("Failed to delete old document from Cloudinary", {
                  cloudinaryId,
                  error: (err as Error).message,
                });
              });
            });

            await tx.document.createMany({
              data: uploadedFiles.map(
                ({ uploadResult, documentType, title }) => ({
                  ownerId: updated.id,
                  ownerType: "TEACHER_APPLICATION" as DocumentOwnerType,
                  teacherAppId: updated.id,
                  documentType,
                  title,
                  originalFileName: uploadResult.originalFileName,
                  cloudinaryId: uploadResult.publicId,
                  cloudinaryUrl: uploadResult.cloudinaryUrl,
                  secureUrl: uploadResult.secureUrl,
                  resourceType: uploadResult.resourceType,
                  format: uploadResult.format,
                  sizeBytes: uploadResult.sizeBytes,
                  width: uploadResult.width,
                  height: uploadResult.height,
                  folder: uploadResult.folder,
                  uploadedBy: "APPLICANT",
                }),
              ),
            });

            log.info("Documents saved to database", {
              applicationId: updated.id,
              documentCount: uploadedFiles.length,
            });
          }

          return updated;
        });

        await createSystemLog({
          level: "INFO",
          message: "Teacher Application resubmitted",
          module: "TeacherApplication",
          metadata: {
            teacherApplicationId: resubmittedApplication.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            documentCount: uploadedFiles.length,
          },
          context,
          statusCode,
        });

        log.info("Teacher application resubmitted successfully", {
          applicationId: resubmittedApplication.id,
          email: data.email,
          documentCount: uploadedFiles.length,
        });

        await sendTeacherApplicationResubmissionEmail({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          qualification: data.qualification,
          experience: data.experience,
          specialization: data.specialization,
          schoolName: school?.name ?? "",
          applicationId: applicationExists.id,
        });

        return resubmittedApplication;
      }

      log.warn("Teacher application already exists", {
        existingApplicationId: applicationExists.id,
        existingStatus: applicationExists.status,
        email: data.email,
        adminEmail: data.email,
      });

      throw new Error(
        "A teacher application with this email or phone already exists",
      );
    }

    const uploadedFiles: Array<{
      uploadResult: CloudinaryUploadResult;
      documentType: DocumentType;
      title: string;
    }> = [];

    if (files.length > 0) {
      log.info("Uploading documents to Cloudinary", {
        fileCount: files.length,
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentMeta = data.documents?.[i];
        const uploadResult = await uploadToCloudinary(
          file,
          "teacher-application",
        );
        uploadedFiles.push({
          uploadResult,
          documentType: documentMeta?.documentType ?? "OTHER",
          title: documentMeta?.title ?? file.originalname,
        });
        log.info("Documents uploaded successfully", {
          publicId: uploadResult.publicId,
          documentType: documentMeta?.documentType,
          title: documentMeta?.title,
        });
      }
    }

    const newApplication = await prisma.$transaction(async (tx) => {
      const application = await tx.teacherApplication.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          qualification: data.qualification,
          experience: data.experience,
          specialization: data.specialization,
          schoolId,
        },
      });

      if (uploadedFiles.length > 0) {
        const existingDocs = await tx.document.findMany({
          where: {
            ownerId: application.id,
            ownerType: "TEACHER_APPLICATION",
          },
          select: {
            cloudinaryId: true,
          },
        });

        existingDocs.forEach(({ cloudinaryId }) => {
          deleteFromCloudinary(cloudinaryId).catch((err) => {
            log.warn("Failed to delete old document from Cloudinary", {
              cloudinaryId,
              error: (err as Error).message,
            });
          });
        });

        await tx.document.createMany({
          data: uploadedFiles.map(({ uploadResult, documentType, title }) => ({
            ownerId: application.id,
            ownerType: "TEACHER_APPLICATION" as DocumentOwnerType,
            teacherAppId: application.id,
            documentType,
            title,
            originalFileName: uploadResult.originalFileName,
            cloudinaryId: uploadResult.publicId,
            cloudinaryUrl: uploadResult.cloudinaryUrl,
            secureUrl: uploadResult.secureUrl,
            resourceType: uploadResult.resourceType,
            format: uploadResult.format,
            sizeBytes: uploadResult.sizeBytes,
            width: uploadResult.width,
            height: uploadResult.height,
            folder: uploadResult.folder,
            uploadedBy: "APPLICANT",
          })),
        });

        log.info("Documents saved to database", {
          applicationId: application.id,
          documentCount: uploadedFiles.length,
        });
      }
      return application;
    });

    await createSystemLog({
      level: "INFO",
      message: "Teacher application submitted succesfully",
      module: "TeacherApplication",
      metadata: {
        applicationId: newApplication.id,
        firstName: newApplication.firstName,
        lastName: newApplication.lastName,
        email: newApplication.email,
      },
      context,
      statusCode,
    });

    log.info("Teacher application created successfully", {
      applicationId: newApplication.id,
      firstName: newApplication.firstName,
      lastName: newApplication.lastName,
      email: newApplication.email,
    });

    await sendTeacherApplicationEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      qualification: data.qualification,
      experience: data.experience,
      specialization: data.specialization,
      schoolName: school?.name ?? "",
      applicationId: newApplication.id,
    });

    return newApplication;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create teacher application", {
      error: err.message,
      ipAddress: context.ipAddress,
      teacherEmail: data.email,
    });
    throw err;
  }
}
