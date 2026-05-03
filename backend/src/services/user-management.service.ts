import {
  ApplicationStatus,
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
  ResubmitTeacherApplicationInput,
  TeacherApplicationInput,
  TeacherWithDetails,
  UpdateUserPermissionInput,
  UserPermissionWithDetails,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { hashPassword } from "../utils/password";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  sendModeratorInformation,
  sendTeacherApplicationEmail,
  sendTeacherApplicationRejectedEmailService,
  sendTeacherApplicationResubmissionEmail,
  sendTeacherApprovedEmailService,
} from "./email.service";
import {
  CloudinaryUploadResult,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config";
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCache,
  getCache,
  setCache,
} from "../utils/cache.util";
import {
  DEFAULT_TEACHER_PERMISSIONS,
  mergePermissions,
} from "../utils/permission.util";

const log = createModuleLogger("UserManagement");

export async function createModeratorService(
  data: CreateModeratorInput,
  schoolId: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<ModeratorWithDetails> {
  try {
    log.info("Moderator creation service start", {
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
      log.warn("Moderator already exists with the same email or phone", {
        email: data.email,
      });
      throw new Error("Moderator already exists with the same email or phone");
    }

    const result = await prisma.$transaction(async (tx) => {
      const [{ generate_registration_number: regNumber }] = await tx.$queryRaw<
        [{ generate_registration_number: string }]
      >`
        SELECT generate_registration_number(${schoolId}, ${Role.MODERATOR})
      `;

      const tempPassword = `Moderator@${Math.random().toString(36).slice(-8)}`;
      const hashedPassword = await hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          schoolId,
          regNumber,
          email: data.email,
          phone: data.phone,
          passwordHash: hashedPassword,
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
        },
      });

      if (data.isTeacher) {
        await tx.teacher.create({
          data: {
            userId: user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            address: data.address!,
            city: data.city!,
            state: data.state!,
            pincode: data.pincode!,
            qualification: data.qualification!,
            experience: data.experience ?? 0,
            specialization: data.specialization,
            joiningDate: new Date(data.joiningDate!),
          },
        });

        log.info("Teacher record created for moderator", {
          userName: `${data.firstName} ${data.lastName}`,
          userRegNumber: user.regNumber,
        });

        await tx.userPermission.createMany({
          data: mergePermissions(
            DEFAULT_TEACHER_PERMISSIONS,
            data.permissions,
          ).map((p) => ({
            ...p,
            userId: user.id,
          })),
        });
      } else {
        await tx.userPermission.createMany({
          data: data.permissions.map((p) => ({
            ...p,
            userId: user.id,
          })),
        });
      }

      log.info("Admin user created successfully", {
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
                userPermission: true,
              },
            },
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
        isTeacher: data.isTeacher,
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
        isTeacher: data.isTeacher,
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

    log.info("Moderator created successfully", {
      regNumber: result.moderator.user.regNumber,
      isTeacher: data.isTeacher,
    });

    return result.moderator;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create moderator", {
      schoolId,
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

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

export async function getAllTeachersApplicationService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  schoolId: string,
  status?: ApplicationStatus,
): Promise<{
  data: TeacherApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Fetching all teacher applications", {
      page,
      limit,
      status: status ?? "ALL",
      schoolId,
      ipAddress: context.ipAddress,
    });

    const where = status ? { schoolId, status } : { schoolId };
    const cacheKey = CACHE_KEYS.teacherApplications(
      schoolId,
      status ?? "ALL",
      page,
      limit,
    );

    const cached = await getCache<{
      data: TeacherApplication[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning cached teacher applications", { cacheKey });
      return cached;
    }

    const [applications, total] = await prisma.$transaction([
      prisma.teacherApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          appliedAt: "desc",
        },
        include: {
          documents: true,
        },
      }),
      prisma.teacherApplication.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      message: "Fetched teacher applications",
      module: "TeacherApplication",
      context,
      metadata: {
        page,
        limit,
        total,
        status: status ?? "ALL",
      },
      statusCode,
    });

    const response = {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);

    log.info("Fetched all school applications successfully", {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      status: status ?? "ALL",
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to get teacher applications", {
      error: err.message,
      ipAddress: context.ipAddress,
      page,
      limit,
    });
    throw err;
  }
}

export async function getTeacherApplicationService(
  applicationId: string,
  schoolId: string,
  context: AuditContext,
  statusCode: number,
): Promise<TeacherApplication> {
  try {
    log.info(
      `Starting the serivce to fetch teacher application with applicationId ${applicationId}`,
      {
        schoolId,
        ipAddress: context.ipAddress,
      },
    );

    const cacheKey = CACHE_KEYS.teacherApplication(schoolId, applicationId);

    const cached = await getCache<TeacherApplication>(cacheKey);

    if (cached) {
      log.info("Returning cached teacher application", { cacheKey });
      return cached;
    }

    const application = await prisma.teacherApplication.findUnique({
      where: {
        id: applicationId,
        schoolId,
      },
    });

    if (!application) {
      log.warn("Application does not exists", {
        applicationId,
      });
      throw new Error("Application does not exists");
    }

    await createSystemLog({
      level: "INFO",
      message: "Fetched teacher application",
      module: "TeacherApplication",
      context,
      metadata: {
        applicationId,
        schoolId,
      },
      statusCode,
    });

    await setCache(cacheKey, application, CACHE_TTL.SCHOOL_APPLICATION_SINGLE);
    log.info("Fetched application successfully");
    return application;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to fetch the application with applicationId ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
      },
    );
    throw err;
  }
}

export async function shortlistApplicationService(
  applicationId: string,
  moderatorId: string,
  schoolId: string,
  context: AuditContext,
  statusCode: number,
): Promise<TeacherApplication> {
  try {
    log.info("Starting Shortlisting application service", {
      schoolId,
      applicationId,
      ipAddress: context.ipAddress,
    });

    const application = await prisma.teacherApplication.findUnique({
      where: {
        schoolId,
        id: applicationId,
      },
    });

    if (!application) {
      log.warn(
        `Application ID ${applicationId} not found for schoolId ${schoolId}`,
      );
      throw new Error("Application ID not found");
    }

    if (application.status !== "PENDING") {
      log.warn("Application is not in pending state");
      throw new Error(
        `Application cannot be shortlisted as it is already ${application.status}`,
      );
    }

    const updatedApplication = await prisma.teacherApplication.update({
      where: {
        id: applicationId,
      },
      data: {
        status: "SHORTLISTED",
        reviewedAt: new Date(),
        reviewedBy: moderatorId,
      },
    });

    await deleteCache(CACHE_KEYS.teacherApplications(schoolId, "ALL", 1, 10));
    await deleteCache(CACHE_KEYS.teacherApplication(schoolId, applicationId));

    await createSystemLog({
      level: "INFO",
      message: "Teacher application shortlisted for admin",
      module: "TeacherApplication",
      context,
      metadata: {
        applicationId,
        schoolId,
        ipAddress: context.ipAddress,
      },
      statusCode,
    });

    await createAuditLog({
      schoolId,
      performedById: moderatorId,
      action: "UPDATE",
      module: "TeacherApplication",
      resourceId: applicationId,
      resourceType: "TeacherApplication",
      oldValues: {
        applicationId,
        status: application.status,
        teacherName: `${application.firstName} ${application.lastName}`,
        teacherEmail: application.email,
      },
      newValues: {
        status: updatedApplication.status,
        reviewedBy: updatedApplication.reviewedBy,
        reviewAt: updatedApplication.reviewedAt,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Application shortlisted for further process", {
      updatedApplication,
    });

    return updatedApplication;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to shortlist teacher application", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      applicationId,
    });
    throw err;
  }
}

export async function approveTeacherApplicationService(
  applicationId: string,
  schoolId: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<TeacherWithDetails> {
  try {
    log.info("Starting service to approve teacher application", {
      ipAddress: context.ipAddress,
      schoolId,
      applicationId,
    });

    const [application, school] = await Promise.all([
      prisma.teacherApplication.findUnique({
        where: {
          schoolId,
          id: applicationId,
        },
      }),
      prisma.school.findUnique({
        where: {
          id: schoolId,
        },
      }),
    ]);

    if (!application) {
      log.warn(`Application not found for applicationId ${applicationId}`);
      throw new Error("Application not found");
    }

    if (application.status !== "SHORTLISTED") {
      log.warn(`Application status is ${application.status}`);
      throw new Error(
        `Application must be SHORTLISTED before approval, current status is ${application.status}`,
      );
    }

    const response = await prisma.$transaction(async (tx) => {
      await tx.teacherApplication.update({
        where: {
          id: applicationId,
        },
        data: {
          status: "SELECTED",
        },
      });

      const [{ generate_registration_number: regNumber }] = await tx.$queryRaw<
        [{ generate_registration_number: string }]
      >`
        SELECT generate_registration_number(${schoolId}, ${Role.TEACHER})
      `;

      const tempPassword = `Teacher@${Math.random().toString(36).slice(-8)}`;
      const hashedPassword = await hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          schoolId,
          regNumber,
          email: application.email,
          phone: application.phone,
          passwordHash: hashedPassword,
          isActive: true,
          isVerified: false,
          role: "TEACHER",
        },
      });

      await tx.teacher.create({
        data: {
          userId: user.id,
          firstName: application.firstName,
          lastName: application.lastName,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          address: application.address,
          city: application.city,
          state: application.state,
          pincode: application.pincode,
          qualification: application.qualification,
          experience: application.experience,
          specialization: application.specialization,
          joiningDate: new Date(),
        },
      });

      await tx.userPermission.createMany({
        data: DEFAULT_TEACHER_PERMISSIONS.map((p) => ({
          ...p,
          userId: user.id,
        })),
      });

      log.info("Teacher created successfully", {
        userName: `${application.firstName} ${application.lastName}`,
        userRegNumber: regNumber,
      });

      return {
        teacher: await tx.teacher.findUniqueOrThrow({
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
                userPermission: true,
              },
            },
          },
        }),
        tempPassword,
      };
    });

    await deleteCache(CACHE_KEYS.teacherApplication(schoolId, applicationId));
    await deleteCache(CACHE_KEYS.teacherApplications(schoolId, "ALL", 1, 10));
    await deleteCache(
      CACHE_KEYS.teacherApplications(schoolId, "SHORTLISTED", 1, 10),
    );

    await createSystemLog({
      level: "INFO",
      module: "TeacherCreation",
      message: "Teacher created",
      context,
      statusCode,
      metadata: {
        schoolId,
        regNumber: response.teacher.user.regNumber,
        userFirstName: response.teacher.firstName,
        userLastName: response.teacher.lastName,
        userDOB: response.teacher.dateOfBirth,
        email: response.teacher.user.email,
      },
    });

    await createAuditLog({
      schoolId,
      performedById: adminId,
      action: "APPROVE",
      module: "User",
      resourceId: response.teacher.user.regNumber,
      resourceType: "TeacherCreation",
      oldValues: {
        status: application.status,
      },
      newValues: {
        regNumber: response.teacher.user.regNumber,
        userFirstName: response.teacher.firstName,
        userLastName: response.teacher.lastName,
        userDOB: response.teacher.dateOfBirth,
        email: response.teacher.user.email,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await sendTeacherApprovedEmailService({
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      phone: application.phone,
      regNumber: response.teacher.user.regNumber,
      tempPassword: response.tempPassword,
      applicationId,
      schoolName: school?.name ?? "",
    });

    return response.teacher;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to approve teacher application", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      applicationId,
    });
    throw err;
  }
}

export async function rejectTeacherApplicaitonService(
  applicationId: string,
  schoolId: string,
  moderatorId: string,
  rejectionReason: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Starting service to reject teacher application with applicationId ${applicationId}`,
      {
        applicationId,
        schoolId,
        ipAddress: context.ipAddress,
      },
    );

    const [teacherApplicationExists, school] = await Promise.all([
      prisma.teacherApplication.findUnique({
        where: {
          schoolId,
          id: applicationId,
        },
      }),
      await prisma.school.findUnique({
        where: {
          id: schoolId,
        },
      }),
    ]);

    if (!teacherApplicationExists) {
      log.warn(`No application found with applicationId ${applicationId}`);
      throw new Error(
        `No application found with applicationId ${applicationId}`,
      );
    }

    if (teacherApplicationExists.status !== "PENDING") {
      log.warn(`Application is not in pending state`, {
        applicationId,
        currentStatus: teacherApplicationExists.status,
      });
      throw new Error(
        `Application cannot be rejected as it is already ${teacherApplicationExists.status}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacherApplication.update({
        where: {
          schoolId,
          id: applicationId,
        },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: moderatorId,
          rejectionReason,
        },
      });

      await tx.teacherApplicationHistory.create({
        data: {
          applicationId,
          status: "REJECTED",
          rejectionReason,
          changedBy: moderatorId,
          previousStatus: teacherApplicationExists.status,
        },
      });
    });

    await createAuditLog({
      schoolId,
      performedById: moderatorId,
      action: "REJECT",
      module: "TeacherApplication",
      resourceId: teacherApplicationExists.id,
      resourceType: "TeacherApplication",
      oldValues: {
        status: teacherApplicationExists.status,
      },
      newValues: {
        status: "REJECTED",
        rejectionReason,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "Teacher Application Rejected",
      module: "TeacherApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        rejectionReason,
        reviewedBy: moderatorId,
        previousStatus: teacherApplicationExists.status,
      },
    });

    await sendTeacherApplicationRejectedEmailService({
      firstName: teacherApplicationExists.firstName,
      lastName: teacherApplicationExists.lastName,
      email: teacherApplicationExists.email,
      phone: teacherApplicationExists.phone,
      qualification: teacherApplicationExists.qualification,
      experience: teacherApplicationExists.experience,
      specialization: teacherApplicationExists.specialization ?? undefined,
      schoolName: school?.name ?? "",
      applicationId: applicationId,
      rejectionReason: rejectionReason,
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to reject teacher application with applicationId ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
        schoolId,
      },
    );
    throw err;
  }
}

export async function resubmitTeacherApplicationService(
  applicationId: string,
  data: ResubmitTeacherApplicationInput,
  files: Express.Multer.File[],
  context: AuditContext,
  statusCode: number,
): Promise<TeacherApplication> {
  const uploadedFiles: Array<{
    uploadResult: CloudinaryUploadResult;
    documentType: DocumentType;
    title: string;
  }> = [];

  try {
    log.info("Resubmitting Teacher application", {
      applicationId,
      ipAddress: context.ipAddress,
      fileCount: files.length,
    });

    const teacherApplication = await prisma.teacherApplication.findUnique({
      where: {
        id: applicationId,
      },
    });

    const school = await prisma.school.findUnique({
      where: {
        id: teacherApplication?.schoolId,
      },
    });

    if (!teacherApplication) {
      log.warn(`Application not found with applicationId ${applicationId}`);
      throw new Error(
        `Application not found with applicationId ${applicationId}`,
      );
    }

    if (teacherApplication.status !== "REJECTED") {
      log.warn(`Application is not in REJECTED state`, {
        applicationId,
        currentStatus: teacherApplication.status,
      });
      throw new Error(
        `Application cannot be resubmitted as it is ${teacherApplication.status}`,
      );
    }

    if (files.length > 0) {
      log.info("Uploading documents to Cloudinary", {
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
        log.info("Document uploaded successfully", {
          publicId: uploadResult.publicId,
          documentType: documentMeta?.documentType,
          title: documentMeta?.title,
        });
      }
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.teacherApplication.update({
        where: { id: applicationId },
        data: {
          ...(data.specialization && {
            specialization: data.specialization,
          }),
          status: "PENDING",
          reviewedAt: null,
          reviewedBy: null,
        },
      });

      if (uploadedFiles.length > 0) {
        const existingDocs = await tx.document.findMany({
          where: {
            ownerId: applicationId,
            ownerType: "TEACHER_APPLICATION",
          },
          select: { cloudinaryId: true },
        });

        await tx.document.deleteMany({
          where: {
            ownerId: applicationId,
            ownerType: "TEACHER_APPLICATION",
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
            ownerId: applicationId,
            ownerType: "TEACHER_APPLICATION" as DocumentOwnerType,
            schoolApplicationId: applicationId,
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
          applicationId,
          documentCount: uploadedFiles.length,
        });
      }

      return updated;
    });

    await createSystemLog({
      level: "INFO",
      message: "Teacher application resubmitted",
      module: "TeacherApplication",
      metadata: {
        applicationId,
        updatedFields: Object.keys(data),
        documentCount: uploadedFiles.length,
      },
      context,
      statusCode,
    });

    log.info("Application resubmitted successfully", {
      applicationId,
      updatedFields: Object.keys(data),
      documentCount: uploadedFiles.length,
    });

    await sendTeacherApplicationResubmissionEmail({
      firstName: teacherApplication.firstName,
      lastName: teacherApplication.lastName,
      email: teacherApplication.email,
      phone: teacherApplication.phone,
      qualification: teacherApplication.qualification,
      experience: teacherApplication.experience,
      specialization: teacherApplication.specialization ?? "",
      schoolName: school?.name ?? "",
      applicationId,
    });
    return updatedApplication;
  } catch (error) {
    if (uploadedFiles.length > 0) {
      log.warn("Cleaning up orphaned Cloudinary uploads", {
        fileCount: uploadedFiles.length,
      });
      await Promise.allSettled(
        uploadedFiles.map(({ uploadResult }) =>
          deleteFromCloudinary(uploadResult.publicId),
        ),
      );
    }

    const err = error as Error;
    log.error("Failed to resubmit teacher application", {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });

    throw err;
  }
}

export async function updateUserPermissionsService(
  data: UpdateUserPermissionInput,
  schoolId: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<UserPermissionWithDetails> {
  try {
    log.info("Starting update user permissions service", {
      ipAddress: context.ipAddress,
      schoolId,
      adminId,
      targetUserId: data.userId,
    });

    const targetUser = await prisma.user.findUnique({
      where: {
        id: data.userId,
        schoolId,
      },
      select: {
        id: true,
        role: true,
        regNumber: true,
        permissions: true,
      },
    });

    if (!targetUser) {
      log.warn("Target user not found", { userId: data.userId, schoolId });
      throw new Error("User not found");
    }

    if (!["ADMIN", "MODERATOR", "TEACHER"].includes(targetUser.role)) {
      log.warn("Permission update not allowed for this role", {
        userId: data.userId,
        role: targetUser.role,
      });
      throw new Error(
        `Permissions cannot be assigned to a user with role ${targetUser.role}`,
      );
    }

    const duplicateModules = data.permissions
      .map((p) => p.module)
      .filter((module, index, arr) => arr.indexOf(module) !== index);

    if (duplicateModules.length > 0) {
      log.warn("Duplicate modules in permission update request", {
        duplicateModules,
      });
      throw new Error(
        `Duplicate modules are not allowed: ${duplicateModules.join(", ")}`,
      );
    }

    const oldPermissions = targetUser.permissions;

    const result = await prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({
        where: { userId: data.userId },
      });

      await tx.userPermission.createMany({
        data: data.permissions.map((p) => ({
          userId: data.userId,
          module: p.module,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
          canApprove: p.canApprove,
          canExport: p.canExport,
        })),
      });

      return await tx.user.findUniqueOrThrow({
        where: { id: data.userId },
        select: {
          id: true,
          regNumber: true,
          role: true,
          email: true,
          phone: true,
          isActive: true,
          userPermission: true,
        },
      });
    });

    await createAuditLog({
      schoolId,
      performedById: adminId,
      action: "PERMISSION_CHANGE",
      module: "UserPermission",
      resourceId: targetUser.regNumber,
      resourceType: "UserPermission",
      oldValues: {
        permissions: oldPermissions,
      },
      newValues: {
        permissions: result.userPermission,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "User permissions updated",
      module: "UserPermission",
      context,
      metadata: {
        schoolId,
        adminId,
        targetUserId: data.userId,
        targetUserRegNumber: targetUser.regNumber,
        targetUserRole: targetUser.role,
        modulesUpdated: data.permissions.map((p) => p.module),
      },
      statusCode,
    });

    log.info("User permissions updated successfully", {
      targetUserId: data.userId,
      targetUserRegNumber: targetUser.regNumber,
      modulesUpdated: data.permissions.map((p) => p.module),
    });

    return result;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to update user permissions", {
      error: err.message,
      schoolId,
      adminId,
      targetUserId: data.userId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
