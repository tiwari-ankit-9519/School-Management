import {
  AdmissionApplication,
  AdmissionStatus,
  DocumentOwnerType,
  DocumentType,
  Role,
} from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  AdmissionApplicationInput,
  ResubmitAdmissionApplicationInput,
  safeUserSelect,
  StudentWithDetails,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import cloudinary, {
  CloudinaryUploadResult,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  sendAdmissionApplicationRejectedEmailService,
  sendAdmissionApplicationResubmittedEmailService,
  sendAdmissionApplicationSubmittedEmailService,
  sendAdmissionApplicationWaitlistedEmailService,
  sendAdmissionApprovedEmailService,
} from "./email.service";
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCache,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";
import { hashPassword } from "../utils/password";
import { generateRegistrationNumber } from "../utils/registration.util";
import { AdmissionApplicationListPayload } from "../types/response-type";

const log = createModuleLogger("AdmissionServiceLogger");

export async function submitAdmissionApplicationService(
  data: AdmissionApplicationInput,
  files: Express.Multer.File[],
  photoUrl: Express.Multer.File | undefined,
  guardianPhotoUrl: Express.Multer.File | undefined,
  context: AuditContext,
  statusCode: number,
): Promise<{ id: string }> {
  try {
    log.info("Starting admission application service", {
      ipAddress: context.ipAddress,
      data,
    });

    const [admissionApplicationExists, school, currentAcademicYear] =
      await Promise.all([
        prisma.admissionApplication.findFirst({
          where: {
            firstName: { equals: data.firstName, mode: "insensitive" },
            lastName: { equals: data.lastName, mode: "insensitive" },
            dateOfBirth: data.dateOfBirth,
            appliedForClass: data.appliedForClass,
            guardianPhone: data.guardianPhone,
            guardianRelation: data.guardianRelation,
          },
        }),
        prisma.schoolConfig.findFirst({
          select: {
            name: true,
          },
        }),
        prisma.academicYear.findFirst({
          where: { isCurrent: true },
        }),
      ]);

    if (!currentAcademicYear) {
      throw new Error(
        "No active academic year found. Cannot accept applications.",
      );
    }

    if (admissionApplicationExists) {
      if (admissionApplicationExists.status === "REJECTED") {
        log.info("Resubmitting student admission application", {
          existingAdmissionApplicationId: admissionApplicationExists.id,
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
          for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const documentMeta = data.documents?.[index];
            const uploadResult = await uploadToCloudinary(
              file,
              "admission-application",
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
        const resubmittedAdmissionApplication = await prisma.$transaction(
          async (tx) => {
            const updated = await tx.admissionApplication.update({
              where: { id: admissionApplicationExists.id },
              data: {
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                previousSchool: data.previousSchool || "",
                previousClass: data.previousClass || "",
                appliedForClass: data.appliedForClass,
                guardianFirstName: data.guardianFirstName,
                guardianLastName: data.guardianLastName,
                guardianRelation: data.guardianRelation,
                guardianPhone: data.guardianPhone,
                guardianEmail: data.guardianEmail,
                status: "PENDING",
                photoUrl: photoUrl
                  ? (
                      await uploadToCloudinary(
                        photoUrl,
                        "admission-application",
                      )
                    ).secureUrl
                  : null,
                guardianPhotoUrl: guardianPhotoUrl
                  ? (
                      await uploadToCloudinary(
                        guardianPhotoUrl,
                        "admission-application",
                      )
                    ).secureUrl
                  : null,
              },
            });
            if (uploadedFiles.length > 0) {
              const existingDocs = await tx.document.findMany({
                where: {
                  ownerId: updated.id,
                  ownerType: "ADMISSION_APPLICATION",
                },
                select: { cloudinaryId: true },
              });
              existingDocs.forEach(({ cloudinaryId }) => {
                deleteFromCloudinary(cloudinaryId).catch((err) => {
                  log.warn("Failed to delete old document from cloudinary", {
                    cloudinaryId,
                    error: (err as Error).message,
                  });
                });
              });
              await tx.document.createMany({
                data: uploadedFiles.map(
                  ({ uploadResult, documentType, title }) => ({
                    ownerId: updated.id,
                    ownerType: "ADMISSION_APPLICATION" as DocumentOwnerType,
                    admissionId: updated.id,
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
          },
        );
        await createSystemLog({
          level: "INFO",
          message: "Admission application resubmitted",
          module: "AdmissionApplication",
          metadata: {
            admissionApplicationId: resubmittedAdmissionApplication.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.guardianEmail,
            documentCount: uploadedFiles.length,
          },
          context,
          statusCode,
        });
        log.info("Admission application resubmitted successfully", {
          applicationId: resubmittedAdmissionApplication.id,
          email: data.guardianEmail,
          documentCount: uploadedFiles.length,
        });
        await sendAdmissionApplicationResubmittedEmailService({
          studentFirstName: data.firstName,
          studentLastName: data.lastName,
          guardianFirstName: data.guardianFirstName,
          guardianLastName: data.guardianLastName,
          guardianEmail: data.guardianEmail ?? "",
          guardianPhone: data.guardianPhone,
          appliedForClass: data.appliedForClass,
          schoolName: school?.name ?? "",
          applicationId: resubmittedAdmissionApplication.id,
        });
        return { id: resubmittedAdmissionApplication.id };
      }
      log.warn("Admission application already exists", {
        existingAdmissionApplicationId: admissionApplicationExists.id,
        existingAdmissionApplicationStatus: admissionApplicationExists.status,
      });
      throw new Error("An admission application already exists");
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
          "admission-application",
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

    const newAdmissionApplication = await prisma.$transaction(async (tx) => {
      const application = await tx.admissionApplication.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          previousSchool: data.previousSchool || "",
          previousClass: data.previousClass || "",
          appliedForClass: data.appliedForClass,
          guardianFirstName: data.guardianFirstName,
          guardianLastName: data.guardianLastName,
          guardianRelation: data.guardianRelation,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail,
          photoUrl: photoUrl
            ? (await uploadToCloudinary(photoUrl, "admission-application"))
                .secureUrl
            : null,
          guardianPhotoUrl: guardianPhotoUrl
            ? (
                await uploadToCloudinary(
                  guardianPhotoUrl,
                  "admission-application",
                )
              ).secureUrl
            : null,
        },
      });
      if (uploadedFiles.length > 0) {
        await tx.document.createMany({
          data: uploadedFiles.map(({ uploadResult, documentType, title }) => ({
            ownerId: application.id,
            ownerType: "ADMISSION_APPLICATION" as DocumentOwnerType,
            admissionId: application.id,
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
      message: "Admission application submitted successfully",
      module: "AdmissionApplication",
      metadata: {
        applicationId: newAdmissionApplication.id,
        firstName: newAdmissionApplication.firstName,
        lastName: newAdmissionApplication.lastName,
        email: newAdmissionApplication.guardianEmail,
      },
      context,
      statusCode,
    });
    log.info("Admission application created successfully", {
      applicationId: newAdmissionApplication.id,
      firstName: newAdmissionApplication.firstName,
      lastName: newAdmissionApplication.lastName,
      email: newAdmissionApplication.guardianEmail,
    });
    await sendAdmissionApplicationSubmittedEmailService({
      studentFirstName: data.firstName,
      studentLastName: data.lastName,
      guardianFirstName: data.guardianFirstName,
      guardianLastName: data.guardianLastName,
      guardianEmail: data.guardianEmail ?? "",
      guardianPhone: data.guardianPhone,
      appliedForClass: data.appliedForClass,
      schoolName: school!.name,
      applicationId: newAdmissionApplication.id,
    });
    return { id: newAdmissionApplication.id };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to submit admission application", {
      error: err.message,
      ipAddress: context.ipAddress,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    throw err;
  }
}

export async function getAllAdmissionApplicationService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  status?: AdmissionStatus,
): Promise<{
  data: AdmissionApplicationListPayload[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Starting service for fetching all admission applications", {
      page,
      limit,
      status: status ?? "ALL",
      ipAddress: context.ipAddress,
    });

    const where = status ? { status } : {};

    const cacheKey = CACHE_KEYS.admissionApplications(
      status ?? "ALL",
      page,
      limit,
    );

    const cached = await getCache<{
      data: AdmissionApplication[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning cached admission applications", { cacheKey });
      return cached;
    }

    const [applications, total] = await prisma.$transaction([
      prisma.admissionApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          appliedForClass: true,
          guardianFirstName: true,
          guardianLastName: true,
          guardianPhone: true,
          status: true,
          appliedAt: true,
          createdAt: true,
        },
      }),
      prisma.admissionApplication.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      message: "Fetched admission applications",
      module: "AdmissionApplication",
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

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);

    log.info("Fetched all admission applications successfully", {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      status: status ?? "ALL",
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch admission applications", {
      error: err.message,
      ipAddress: context.ipAddress,
      page,
      limit,
    });
    throw err;
  }
}

export async function getAdmissionApplicationService(
  applicationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<AdmissionApplication> {
  try {
    log.info(
      `Starting service to fetch admission application with applicationId ${applicationId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const cacheKey = CACHE_KEYS.admissionApplication(applicationId);
    const cached = await getCache<AdmissionApplication>(cacheKey);

    if (cached) {
      log.info("Returning cached teacher application", { cacheKey });
      return cached;
    }

    const application = await prisma.admissionApplication.findUnique({
      where: {
        id: applicationId,
      },
      include: {
        documents: true,
        histories: true,
      },
    });

    if (!application) {
      log.warn(
        `Application does not exists with applicationId ${applicationId}`,
      );
      throw new Error(
        `Application does not exists with applicationId ${applicationId}`,
      );
    }

    await createSystemLog({
      level: "INFO",
      message: "Fetched admission application",
      module: "AdmissionApplication",
      context,
      metadata: {
        applicationId,
      },
      statusCode,
    });

    await setCache(
      cacheKey,
      application,
      CACHE_TTL.ADMISSION_APPLICATION_SINGLE,
    );
    log.info("Fetched admission applicaiton successfully");
    return application;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to fetch admisson application with applicationId ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
      },
    );
    throw err;
  }
}

export async function approveAdmissionApplicationService(
  applicationId: string,
  reviewerId: string,
  context: AuditContext,
  classId: string,
  statusCode: number,
): Promise<{ id: string }> {
  try {
    log.info(
      `Starting service to approve admission application with applicationId ${applicationId}`,
      { ipAddress: context.ipAddress, reviewerId },
    );

    const [admissionApplicationExists, currentAcademicYear] = await Promise.all(
      [
        prisma.admissionApplication.findUnique({
          where: { id: applicationId },
        }),
        prisma.academicYear.findFirst({
          where: { isCurrent: true },
        }),
      ],
    );

    if (!admissionApplicationExists) {
      log.warn(
        `No admission application found with applicationId ${applicationId}`,
      );
      throw new Error(`Application not found`);
    }

    if (!currentAcademicYear) {
      throw new Error(`No active academic year found for this school`);
    }

    if (admissionApplicationExists.status !== "PENDING") {
      log.warn(
        `Application cannot be accepted as it is in ${admissionApplicationExists.status}`,
      );
      throw new Error(
        `Application cannot be accepted as it is in ${admissionApplicationExists.status}`,
      );
    }

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists || classExists.academicYearId !== currentAcademicYear.id) {
      log.warn(`Class not found or does not belong to current academic year`);
      throw new Error(
        `Class not found or does not belong to current academic year`,
      );
    }

    const response = await prisma.$transaction(async (tx) => {
      const studentRegNumber = await generateRegistrationNumber(Role.STUDENT);
      const parentRegNumber = await generateRegistrationNumber(Role.PARENT);
      const studentTempPassword = `STUDENT@${Math.random().toString(36).slice(-8)}`;
      const parentTempPassword = `PARENT@${Math.random().toString(36).slice(-8)}`;
      const hashedPasswordStudent = await hashPassword(studentTempPassword);
      const hashedPasswordParent = await hashPassword(parentTempPassword);

      const enrollmentCount = await tx.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM "Enrollment"
          WHERE "classId" = ${classId}
          AND "academicYearId" = ${currentAcademicYear.id}
          AND status = 'ACTIVE'
          FOR UPDATE
        ) sub
      `;

      if (Number(enrollmentCount[0].count) >= classExists.capacity) {
        log.warn(
          `Class ${classExists.name}-${classExists.section} is at full capacity`,
        );
        throw new Error(
          `Class ${classExists.name}-${classExists.section} is at full capacity`,
        );
      }

      const studentUser = await tx.user.create({
        data: {
          regNumber: studentRegNumber,
          email: null,
          phone: null,
          passwordHash: hashedPasswordStudent,
          isActive: true,
          isVerified: false,
          role: "STUDENT",
        },
      });

      const student = await tx.student.create({
        data: {
          userId: studentUser.id,
          admissionId: applicationId,
          firstName: admissionApplicationExists.firstName,
          lastName: admissionApplicationExists.lastName,
          gender: admissionApplicationExists.gender,
          dateOfBirth: admissionApplicationExists.dateOfBirth,
          address: admissionApplicationExists.address,
          city: admissionApplicationExists.city,
          state: admissionApplicationExists.state,
          pincode: admissionApplicationExists.pincode,
        },
      });

      log.info("Student created successfully", {
        studentName: `${student.firstName} ${student.lastName}`,
        studentRegNumber,
      });

      const parentUser = await tx.user.create({
        data: {
          regNumber: parentRegNumber,
          email: admissionApplicationExists.guardianEmail,
          phone: admissionApplicationExists.guardianPhone,
          passwordHash: hashedPasswordParent,
          isActive: true,
          isVerified: false,
          role: "PARENT",
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: parentUser.id,
          studentId: student.id,
          firstName: admissionApplicationExists.guardianFirstName,
          lastName: admissionApplicationExists.guardianLastName,
          parentType: admissionApplicationExists.guardianRelation,
        },
      });

      log.info("Parent created successfully", {
        parentName: `${parent.firstName} ${parent.lastName}`,
        parentRegNumber,
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: classExists.id,
          academicYearId: currentAcademicYear.id,
          status: "ACTIVE",
        },
      });

      log.info("Enrollment created successfully", {
        enrollmentId: enrollment.id,
        studentId: student.id,
        classId: classExists.id,
        academicYearId: currentAcademicYear.id,
      });

      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.admissonApplicationHistory.create({
        data: {
          applicationId,
          status: "APPROVED",
          previousStatus: admissionApplicationExists.status,
          changedBy: reviewerId,
        },
      });

      const updatedStudent = await tx.student.findUniqueOrThrow({
        where: { id: student.id },
        include: {
          user: { select: safeUserSelect },
          parent: true,
          enrollments: true,
        },
      });

      return {
        student: updatedStudent,
        studentTempPassword,
        parentTempPassword,
        parentRegNumber,
      };
    });

    await deleteCache(CACHE_KEYS.admissionApplication(applicationId));

    await deleteCacheByPattern(`admission-applications:*`);

    await deleteCacheByPattern(`students:*`);

    await createAuditLog({
      performedById: reviewerId,
      action: "APPROVE",
      module: "Admission",
      resourceId: response.student.user.regNumber,
      resourceType: "StudentCreation",
      oldValues: {
        status: admissionApplicationExists.status,
      },
      newValues: {
        regNumber: response.student.user.regNumber,
        studentFirstName: response.student.firstName,
        studentLastName: response.student.lastName,
        studentDOB: response.student.dateOfBirth,
        guardianEmail: admissionApplicationExists.guardianEmail,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      module: "StudentCreation",
      message: "Student Created Successfully",
      context,
      statusCode,
      metadata: {
        regNumber: response.student.user.regNumber,
        studentFirstName: response.student.firstName,
        studentLastName: response.student.lastName,
        studentDOB: response.student.dateOfBirth,
        guardianEmail: admissionApplicationExists.guardianEmail,
      },
    });

    await sendAdmissionApprovedEmailService({
      studentFirstName: admissionApplicationExists.firstName,
      studentLastName: admissionApplicationExists.lastName,
      parentFirstName: admissionApplicationExists.guardianFirstName,
      parentLastName: admissionApplicationExists.guardianLastName,
      guardianEmail: admissionApplicationExists.guardianEmail ?? "",
      guardianPhone: admissionApplicationExists.guardianPhone,
      studentRegNumber: response.student.user.regNumber,
      parentRegNumber: response.parentRegNumber,
      studentTempPassword: response.studentTempPassword,
      parentTempPassword: response.parentTempPassword,
      schoolName: null as unknown as string,
      applicationId: admissionApplicationExists.id,
      appliedForClass: admissionApplicationExists.appliedForClass,
    });

    return { id: response.student.id };
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to approve admission application with applicationId ${applicationId}`,
      { error: err.message, ipAddress: context.ipAddress },
    );
    throw err;
  }
}

export async function rejectAdmissionnApplicationService(
  applicationId: string,
  moderatorId: string,
  rejectionReason: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting Admission Application rejection service`, {
      applicationId,
      ipAddress: context.ipAddress,
    });

    const [admissionApplication] = await Promise.all([
      await prisma.admissionApplication.findUnique({
        where: {
          id: applicationId,
        },
      }),
    ]);

    if (!admissionApplication) {
      log.warn(
        `Admission application not found with applicaitonId ${applicationId}`,
      );
      throw new Error(
        `Admission application not found with applicaitonId ${applicationId}`,
      );
    }

    if (
      admissionApplication.status !== "PENDING" &&
      admissionApplication.status !== "WAITLISTED"
    ) {
      log.warn("Admission application status is not PENDING", {
        applicationId,
        currentStatus: admissionApplication.status,
      });
      throw new Error(
        `Admission application cannot be reject as it is ${admissionApplication.status}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: moderatorId,
          rejectionReason,
        },
      });

      await tx.admissonApplicationHistory.create({
        data: {
          applicationId,
          status: "REJECTED",
          rejectionReason,
          changedBy: moderatorId,
          previousStatus: admissionApplication.status,
        },
      });

      const nextWaitListed = await tx.admissionApplication.findFirst({
        where: {
          appliedForClass: admissionApplication.appliedForClass,
          status: "WAITLISTED",
        },
        orderBy: { waitlistPosition: "asc" },
        select: { waitlistPosition: true, id: true },
      });

      if (nextWaitListed && nextWaitListed.waitlistPosition !== null) {
        const promotedPosition = nextWaitListed.waitlistPosition;

        await tx.admissionApplication.update({
          where: {
            id: nextWaitListed.id,
          },
          data: {
            status: "APPROVED",
            waitlistPosition: null,
            waitlistReason: null,
            reviewedAt: new Date(),
            reviewedBy: moderatorId,
          },
        });

        await tx.admissionApplication.updateMany({
          where: {
            appliedForClass: admissionApplication.appliedForClass,
            status: "WAITLISTED",
            waitlistPosition: { gt: promotedPosition },
          },
          data: {
            waitlistPosition: { decrement: 1 },
          },
        });

        await tx.admissonApplicationHistory.create({
          data: {
            applicationId: nextWaitListed.id,
            status: "APPROVED",
            changedBy: moderatorId,
            previousStatus: "WAITLISTED",
          },
        });
      }
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "REJECT",
      module: "AdmissionApplication",
      resourceId: admissionApplication.id,
      resourceType: "AdmissionApplication",
      oldValues: {
        status: admissionApplication.status,
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
      message: "Admission Application Rejected",
      module: "AdmissionApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        rejectionReason,
        reviewedBy: moderatorId,
        previousStatus: admissionApplication.status,
      },
    });
    await sendAdmissionApplicationRejectedEmailService({
      studentFirstName: admissionApplication.firstName,
      studentLastName: admissionApplication.lastName,
      guardianFirstName: admissionApplication.guardianFirstName,
      guardianLastName: admissionApplication.guardianLastName,
      guardianEmail: admissionApplication.guardianEmail ?? "",
      appliedForClass: admissionApplication.appliedForClass,
      schoolName: null as unknown as string,
      applicationId,
      rejectionReason,
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to reject application with applicationId ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
      },
    );
    throw err;
  }
}

export async function resubmitAdmissionApplicationService(
  applicationId: string,
  data: ResubmitAdmissionApplicationInput,
  files: Express.Multer.File[],
  context: AuditContext,
  statusCode: number,
): Promise<{ id: string }> {
  const uploadedFiles: Array<{
    uploadResult: CloudinaryUploadResult;
    documentType: DocumentType;
    title: string;
  }> = [];
  try {
    log.info("Resubmitting Admission application", {
      applicationId,
      ipAddress: context.ipAddress,
      fileCount: files.length,
    });

    const admissionApplicationExists =
      await prisma.admissionApplication.findUnique({
        where: { id: applicationId },
      });

    if (!admissionApplicationExists) {
      log.warn(`Application not found with applicationId ${applicationId}`);
      throw new Error(
        `Application not found with applicationId ${applicationId}`,
      );
    }

    if (admissionApplicationExists.status !== "REJECTED") {
      log.warn(`Application is not in REJECTED state`, {
        applicationId,
        currentStatus: admissionApplicationExists.status,
      });
      throw new Error(
        `Application cannot be resubmitted as it is ${admissionApplicationExists.status}`,
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
          "admission-applications",
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
      const updated = await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          ...(data.previousClass && { previousClass: data.previousClass }),
          ...(data.previousSchool && { previousSchool: data.previousSchool }),
          ...(data.guardianEmail && { guardianEmail: data.guardianEmail }),
          status: "PENDING",
          reviewedAt: null,
          reviewedBy: null,
        },
        select: { id: true },
      });

      if (uploadedFiles.length > 0) {
        const existingDocs = await tx.document.findMany({
          where: {
            ownerId: applicationId,
            ownerType: "ADMISSION_APPLICATION",
          },
          select: { cloudinaryId: true },
        });

        await tx.document.deleteMany({
          where: {
            ownerId: applicationId,
            ownerType: "ADMISSION_APPLICATION",
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
            ownerType: "ADMISSION_APPLICATION" as DocumentOwnerType,
            admissionId: applicationId,
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

    await Promise.all([
      deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
      deleteCacheByPattern(`admission-applications:*`),
    ]);

    await createSystemLog({
      level: "INFO",
      message: "Admission application resubmitted",
      module: "AdmissionApplication",
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

    await sendAdmissionApplicationResubmittedEmailService({
      studentFirstName: admissionApplicationExists.firstName,
      studentLastName: admissionApplicationExists.lastName,
      guardianFirstName: admissionApplicationExists.guardianFirstName,
      guardianLastName: admissionApplicationExists.guardianLastName,
      guardianEmail: admissionApplicationExists.guardianEmail ?? "",
      guardianPhone: admissionApplicationExists.guardianPhone,
      appliedForClass: admissionApplicationExists.appliedForClass,
      schoolName: null as unknown as string,
      applicationId,
    });

    return { id: updatedApplication.id };
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
    log.error("Failed to resubmit admission application", {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function waitlistAdmissionApplicationService(
  applicationId: string,
  waitlistReason: string,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Statring service to waitlist admission applicaiton with applicationId ${applicationId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const [admissionApplication] = await Promise.all([
      await prisma.admissionApplication.findUnique({
        where: {
          id: applicationId,
        },
      }),
    ]);

    if (!admissionApplication) {
      log.warn(`No application found with applicationId ${applicationId}`);
      throw new Error(
        `No application found wiht applicationId ${applicationId}`,
      );
    }

    if (admissionApplication.status !== "PENDING") {
      log.warn(
        `Applicaiton cannot be marked waitlisted as it is ${admissionApplication.status}`,
      );
      throw new Error(
        `Applicaiton cannot be marked waitlisted as it is ${admissionApplication.status}`,
      );
    }

    const lastWaitlistPosition = await prisma.admissionApplication.findFirst({
      where: {
        appliedForClass: admissionApplication.appliedForClass,
        status: "WAITLISTED",
      },
      orderBy: { waitlistPosition: "desc" },
      select: {
        waitlistPosition: true,
      },
    });

    const nextWaitListPosition =
      (lastWaitlistPosition?.waitlistPosition ?? 0) + 1;

    await prisma.$transaction(async (tx) => {
      await tx.admissionApplication.update({
        where: {
          id: applicationId,
        },
        data: {
          status: "WAITLISTED",
          waitlistPosition: nextWaitListPosition,
          waitlistReason: waitlistReason,
        },
      });

      await tx.admissonApplicationHistory.create({
        data: {
          applicationId,
          status: "WAITLISTED",
          changedBy: moderatorId,
          previousStatus: admissionApplication.status,
        },
      });
    });

    await createSystemLog({
      level: "INFO",
      message: "Admission Application Waitlisted",
      module: "AdmissionApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        waitlistPosition: nextWaitListPosition,
        waitlistReason,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "UPDATE",
      module: "AdmissionApplication",
      resourceId: applicationId,
      resourceType: "AdmissionApplication",
      oldValues: { status: admissionApplication.status },
      newValues: {
        status: "WAITLISTED",
        waitlistPosition: nextWaitListPosition,
        waitlistReason,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await sendAdmissionApplicationWaitlistedEmailService({
      studentFirstName: admissionApplication.firstName,
      studentLastName: admissionApplication.lastName,
      guardianFirstName: admissionApplication.guardianFirstName,
      guardianLastName: admissionApplication.guardianLastName,
      guardianEmail: admissionApplication.guardianEmail ?? "",
      appliedForClass: admissionApplication.appliedForClass,
      schoolName: null as unknown as string,
      applicationId,
      waitlistPosition: nextWaitListPosition,
      waitlistReason,
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to waitlist admission application with ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
      },
    );
    throw err;
  }
}
