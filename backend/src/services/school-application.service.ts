import {
  DocumentOwnerType,
  DocumentType,
  School,
  SchoolApplication,
  SchoolApplicationStatus,
} from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  ResubmitApplicationInput,
  SchoolApplicationInput,
} from "../validations/input.validations";
import {
  CloudinaryUploadResult,
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { hashPassword } from "../utils/password";
import {
  sendApplicationIdEmail,
  sendMoreInfoEmail,
  sendRejectionEmail,
  sendWelcomeEmail,
} from "./email.service";

const log = createModuleLogger("SchoolApplicationServiceLogger");

export async function schoolApplicationRegistration(
  data: SchoolApplicationInput,
  files: Express.Multer.File[],
  context: AuditContext,
  statusCode: number,
): Promise<SchoolApplication> {
  try {
    log.info("School application process started", {
      schoolName: data.schoolName,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pinCode: data.pincode,
      schoolPhoneNumber: data.phone,
      schoolEmail: data.email,
      schoolWebsite: data.website,
      establishedIn: data.establishedYear,
      affiliationNumber: data.affiliationNumber,
      boardType: data.boardType,
      adminFullName: `${data.adminFirstName} ${data.adminLastName}`,
      adminEmail: data.adminEmail,
      adminPhoneNumber: data.adminPhone,
      adminGender: data.adminGender,
      fileCount: files.length,
      ipAddress: context.ipAddress,
    });

    const schoolApplicationExists = await prisma.schoolApplication.findFirst({
      where: {
        OR: [{ email: data.email }, { adminEmail: data.adminEmail }],
      },
    });

    if (schoolApplicationExists) {
      if (schoolApplicationExists.status === "REJECTED") {
        log.info("Resubmitting rejected school application", {
          existingApplicationId: schoolApplicationExists.id,
          email: data.email,
          adminEmail: data.adminEmail,
        });

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
              "school-applications",
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

        const resubmittedApplication = await prisma.$transaction(async (tx) => {
          const updated = await tx.schoolApplication.update({
            where: { id: schoolApplicationExists.id },
            data: {
              schoolName: data.schoolName,
              address: data.address,
              city: data.city,
              state: data.state,
              country: data.country,
              pincode: data.pincode,
              phone: data.phone,
              email: data.email,
              website: data.website,
              establishedYear: data.establishedYear,
              affiliationNumber: data.affiliationNumber,
              boardType: data.boardType,
              adminFirstName: data.adminFirstName,
              adminLastName: data.adminLastName,
              adminEmail: data.adminEmail,
              adminPhone: data.adminPhone,
              adminGender: data.adminGender,
              status: "PENDING",
              appliedAt: new Date(),
              reviewedAt: null,
              reviewedBy: null,
              rejectionReason: null,
              notes: null,
              moreInfoFields: [],
            },
          });

          if (uploadedFiles.length > 0) {
            const existingDocs = await tx.document.findMany({
              where: {
                ownerId: updated.id,
                ownerType: "SCHOOL_APPLICATION",
              },
              select: { cloudinaryId: true },
            });

            await tx.document.deleteMany({
              where: {
                ownerId: updated.id,
                ownerType: "SCHOOL_APPLICATION",
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
                  ownerType: "SCHOOL_APPLICATION" as DocumentOwnerType,
                  schoolApplicationId: updated.id,
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
          message: "School application resubmitted",
          module: "SchoolApplication",
          metadata: {
            applicationId: resubmittedApplication.id,
            schoolName: data.schoolName,
            email: data.email,
            adminEmail: data.adminEmail,
            documentCount: uploadedFiles.length,
          },
          context,
          statusCode,
        });

        log.info("School application resubmitted successfully", {
          applicationId: resubmittedApplication.id,
          email: data.email,
          adminEmail: data.adminEmail,
          documentCount: uploadedFiles.length,
        });

        await sendApplicationIdEmail({
          email: resubmittedApplication.adminEmail,
          firstName: resubmittedApplication.adminFirstName,
          lastName: resubmittedApplication.adminLastName,
          schoolName: resubmittedApplication.schoolName,
          applicationId: resubmittedApplication.id,
          appliedAt: new Date(
            resubmittedApplication.appliedAt,
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        });

        return resubmittedApplication;
      }

      log.warn("School application already exists", {
        existingApplicationId: schoolApplicationExists.id,
        existingStatus: schoolApplicationExists.status,
        email: data.email,
        adminEmail: data.adminEmail,
      });

      throw new Error(
        "A school application with this email or admin email already exists",
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
          "school-applications",
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

    const newSchoolApplication = await prisma.$transaction(async (tx) => {
      const application = await tx.schoolApplication.create({
        data: {
          schoolName: data.schoolName,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
          website: data.website,
          establishedYear: data.establishedYear,
          affiliationNumber: data.affiliationNumber,
          boardType: data.boardType,
          adminFirstName: data.adminFirstName,
          adminLastName: data.adminLastName,
          adminEmail: data.adminEmail,
          adminPhone: data.adminPhone,
          adminGender: data.adminGender,
        },
      });

      if (uploadedFiles.length > 0) {
        await tx.document.createMany({
          data: uploadedFiles.map(({ uploadResult, documentType, title }) => ({
            ownerId: application.id,
            ownerType: "SCHOOL_APPLICATION" as DocumentOwnerType,
            schoolApplicationId: application.id,
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
      message: "School application submitted",
      module: "SchoolApplication",
      metadata: {
        applicationId: newSchoolApplication.id,
        schoolName: data.schoolName,
        email: data.email,
        adminEmail: data.adminEmail,
        documentCount: uploadedFiles.length,
      },
      context,
      statusCode,
    });

    log.info("School application submitted successfully", {
      applicationId: newSchoolApplication.id,
      email: data.email,
      adminEmail: data.adminEmail,
      documentCount: uploadedFiles.length,
    });

    await sendApplicationIdEmail({
      email: newSchoolApplication.adminEmail,
      firstName: newSchoolApplication.adminFirstName,
      lastName: newSchoolApplication.adminLastName,
      schoolName: newSchoolApplication.schoolName,
      applicationId: newSchoolApplication.id,
      appliedAt: new Date(newSchoolApplication.appliedAt).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      ),
    });

    return newSchoolApplication;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to submit school application", {
      error: err.message,
      schoolName: data.schoolName,
      email: data.email,
      adminEmail: data.adminEmail,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function viewSchoolApplicationStatus(
  applicationId: string,
  context: AuditContext,
): Promise<SchoolApplication> {
  try {
    log.info("Viewing application status", {
      applicationId,
      ipAddress: context.ipAddress,
    });

    const applicationExists = await prisma.schoolApplication.findUnique({
      where: {
        id: applicationId,
      },
    });

    if (!applicationExists) {
      log.warn("Application not found", {
        applicationId,
      });
      throw new Error("Application not found");
    }

    await createSystemLog({
      level: "INFO",
      message: "Viewed school application",
      module: "SchoolApplication",
      metadata: {
        applicationId,
        status: applicationExists.status,
      },
      context,
    });

    log.info("Application viewed successfully", {
      applicationId,
      status: applicationExists.status,
    });

    return applicationExists;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to view the status of the application", {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getAllApplications(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  status?: SchoolApplicationStatus,
): Promise<{
  data: SchoolApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Fetching all school applications", {
      page,
      limit,
      status: status ?? "ALL",
      ipAddress: context.ipAddress,
    });

    const where = status ? { status } : {};
    const cacheKey = CACHE_KEYS.schoolApplications(
      status ?? "ALL",
      page,
      limit,
    );

    const cached = await getCache<{
      data: SchoolApplication[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning cached school applications", { cacheKey });
      return cached;
    }

    const [applications, total] = await prisma.$transaction([
      prisma.schoolApplication.findMany({
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
      prisma.schoolApplication.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      message: "Fetched school applications",
      module: "SchoolApplication",
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
    log.error("Failed to fetch school applications", {
      error: err.message,
      page,
      limit,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getSingleApplication(
  applicationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<SchoolApplication> {
  try {
    log.info("Fetching single applicaion", {
      applicationId,
    });
    const applicationExists = await prisma.schoolApplication.findUnique({
      where: {
        id: applicationId,
      },
      include: {
        documents: true,
      },
    });
    if (!applicationExists) {
      log.warn("Application not found", {
        applicationId,
      });
      throw new Error("Selected application not found");
    }
    await createSystemLog({
      level: "INFO",
      message: "Fetched single application",
      module: "SchoolApplication",
      context,
      metadata: {
        applicationId: applicationExists?.id,
        status: applicationExists?.status,
      },
      statusCode,
    });
    log.info("Application fetched successfully", {
      applicationId: applicationExists.id,
      status: applicationExists.status,
    });
    return applicationExists;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch application", {
      ipAddress: context.ipAddress,
      error: err.message,
      applicationId,
    });
    throw err;
  }
}

export async function approveApplication(
  applicationId: string,
  superAdminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<School> {
  try {
    log.info("Starting approve application service", {
      applicationId,
      superAdminId,
      ipAddress: context.ipAddress,
    });

    const application = await prisma.schoolApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      log.warn("Application does not exist", { applicationId });
      throw new Error("Application does not exist");
    }

    if (application.status !== "PENDING") {
      log.warn("Application is not in pending state", {
        applicationId,
        currentStatus: application.status,
      });
      throw new Error(
        `Application cannot be approved as it is already ${application.status}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const schoolCode = await tx.$queryRaw<[{ generate_school_code: string }]>`
        SELECT generate_school_code(${application.schoolName})
      `;

      const school = await tx.school.create({
        data: {
          name: application.schoolName,
          code: schoolCode[0].generate_school_code,
          address: application.address,
          city: application.city,
          state: application.state,
          country: application.country,
          pincode: application.pincode,
          phone: application.phone,
          email: application.email,
          website: application.website ?? undefined,
          establishedYear: application.establishedYear,
          affiliationNumber: application.affiliationNumber ?? undefined,
          boardType: application.boardType,
          isActive: true,
        },
      });

      log.info("School created", {
        schoolId: school.id,
        schoolCode: school.code,
        schoolName: school.name,
      });

      const tempPassword = `Admin@${Math.random().toString(36).slice(-8)}`;
      const passwordHash = await hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          role: "ADMIN",
          email: application.adminEmail,
          phone: application.adminPhone,
          passwordHash,
          regNumber: "PENDING",
          isActive: true,
          isVerified: false,
        },
      });

      const userWithRegNumber = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, regNumber: true },
      });

      log.info("Admin user created", {
        userId: user.id,
        regNumber: userWithRegNumber?.regNumber,
        schoolId: school.id,
      });

      await tx.admin.create({
        data: {
          userId: user.id,
          firstName: application.adminFirstName,
          lastName: application.adminLastName,
          gender: application.adminGender,
          joiningDate: new Date(),
        },
      });

      await tx.schoolApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: superAdminId,
        },
      });

      return { school, user, userWithRegNumber, tempPassword };
    });

    await createAuditLog({
      schoolId: result.school.id,
      performedById: superAdminId,
      action: "APPROVE",
      module: "SchoolApplication",
      resourceId: applicationId,
      resourceType: "SchoolApplication",
      newValues: {
        schoolId: result.school.id,
        schoolCode: result.school.code,
        adminUserId: result.user.id,
        adminRegNumber: result.userWithRegNumber?.regNumber,
        status: "APPROVED",
      },
      statusCode,
      isSuccessful: true,
      context,
    });

    await createSystemLog({
      level: "INFO",
      message: "School application approved",
      module: "SchoolApplication",
      context,
      metadata: {
        applicationId,
        schoolId: result.school.id,
        schoolCode: result.school.code,
        adminUserId: result.user.id,
        adminRegNumber: result.userWithRegNumber?.regNumber,
      },
      statusCode,
    });

    log.info("Application approved successfully", {
      applicationId,
      schoolId: result.school.id,
      schoolCode: result.school.code,
      adminUserId: result.user.id,
      adminRegNumber: result.userWithRegNumber?.regNumber,
    });

    await sendWelcomeEmail({
      email: application.adminEmail,
      firstName: application.adminFirstName,
      lastName: application.adminLastName,
      tempPassword: result.tempPassword,
      schoolName: application.schoolName,
      schoolCode: result.school.code,
      regNumber: result.userWithRegNumber?.regNumber ?? "",
    });

    return result.school;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to approve application", {
      error: err.message,
      applicationId,
      superAdminId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function resubmitApplication(
  applicationId: string,
  data: ResubmitApplicationInput,
  files: Express.Multer.File[],
  context: AuditContext,
  statusCode: number,
): Promise<SchoolApplication> {
  const uploadedFiles: Array<{
    uploadResult: CloudinaryUploadResult;
    documentType: DocumentType;
    title: string;
  }> = [];

  try {
    log.info("Resubmitting school application", {
      applicationId,
      ipAddress: context.ipAddress,
      fileCount: files.length,
    });

    const application = await prisma.schoolApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      log.warn("Application does not exist", { applicationId });
      throw new Error("Application does not exist");
    }

    if (application.status !== "MORE_INFO_REQUIRED") {
      log.warn("Application is not in MORE_INFO_REQUIRED state", {
        applicationId,
        currentStatus: application.status,
      });
      throw new Error(
        `Application cannot be resubmitted as it is ${application.status}`,
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
          "school-applications",
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
      const updated = await tx.schoolApplication.update({
        where: { id: applicationId },
        data: {
          ...(data.affiliationNumber && {
            affiliationNumber: data.affiliationNumber,
          }),
          ...(data.boardType && { boardType: data.boardType }),
          ...(data.establishedYear && {
            establishedYear: data.establishedYear,
          }),
          ...(data.website && { website: data.website }),
          ...(data.phone && { phone: data.phone }),
          ...(data.address && { address: data.address }),
          ...(data.pincode && { pincode: data.pincode }),
          ...(data.adminEmail && { adminEmail: data.adminEmail }),
          ...(data.adminPhone && { adminPhone: data.adminPhone }),
          status: "PENDING",
          moreInfoFields: [],
          notes: null,
          reviewedAt: null,
          reviewedBy: null,
        },
      });

      if (uploadedFiles.length > 0) {
        const existingDocs = await tx.document.findMany({
          where: {
            ownerId: applicationId,
            ownerType: "SCHOOL_APPLICATION",
          },
          select: { cloudinaryId: true },
        });

        await tx.document.deleteMany({
          where: {
            ownerId: applicationId,
            ownerType: "SCHOOL_APPLICATION",
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
            ownerType: "SCHOOL_APPLICATION" as DocumentOwnerType,
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
      message: "School application resubmitted",
      module: "SchoolApplication",
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
    log.error("Failed to resubmit school application", {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });

    throw err;
  }
}

export async function requestMoreInfo(
  applicationId: string,
  superAdminId: string,
  notes: string,
  moreInfoFields: string[],
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Requesting more info for application", {
      applicationId,
      superAdminId,
      moreInfoFields,
      ipAddress: context.ipAddress,
    });

    const application = await prisma.schoolApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      log.warn("Application does not exist", { applicationId });
      throw new Error("Application does not exist");
    }

    if (application.status !== "PENDING") {
      log.warn("Application is not in pending state", {
        applicationId,
        currentStatus: application.status,
      });
      throw new Error(
        `Cannot request more info as application is already ${application.status}`,
      );
    }

    await prisma.schoolApplication.update({
      where: { id: applicationId },
      data: {
        status: "MORE_INFO_REQUIRED",
        reviewedAt: new Date(),
        reviewedBy: superAdminId,
        notes,
        moreInfoFields,
      },
    });

    await createAuditLog({
      performedById: superAdminId,
      action: "UPDATE",
      module: "SchoolApplication",
      resourceId: application.id,
      resourceType: "SchoolApplication",
      oldValues: {
        status: application.status,
        moreInfoFields: application.moreInfoFields,
        notes: application.notes,
      },
      newValues: {
        status: "MORE_INFO_REQUIRED",
        moreInfoFields,
        notes,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "More info requested for school application",
      module: "SchoolApplication",
      context,
      metadata: {
        applicationId,
        reviewedBy: superAdminId,
        notes,
        moreInfoFields,
      },
      statusCode,
    });

    log.info("More info requested successfully", {
      applicationId,
      superAdminId,
      moreInfoFields,
    });

    await sendMoreInfoEmail({
      email: application.email,
      firstName: application.adminFirstName,
      lastName: application.adminLastName,
      schoolName: application.schoolName,
      notes,
      moreInfoFields,
      applicationId,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to request more info", {
      error: err.message,
      applicationId,
      superAdminId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function rejectApplication(
  applicationId: string,
  superAdminId: string,
  rejectionReason: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Starting reject application service", {
      applicationId,
      superAdminId,
      ipAddress: context.ipAddress,
    });

    const application = await prisma.schoolApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      log.warn("Application does not exist", { applicationId });
      throw new Error("Application does not exist");
    }

    if (application.status !== "PENDING") {
      log.warn("Application is not in pending state", {
        applicationId,
        currentStatus: application.status,
      });
      throw new Error(
        `Application cannot be rejected as it is already ${application.status}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.schoolApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: superAdminId,
          rejectionReason,
        },
      });

      await tx.schoolApplicationHistory.create({
        data: {
          applicationId,
          status: "REJECTED",
          rejectionReason,
          notes: application.notes,
          changedBy: superAdminId,
        },
      });
    });

    await createAuditLog({
      performedById: superAdminId,
      action: "REJECT",
      module: "SchoolApplication",
      resourceId: applicationId,
      resourceType: "SchoolApplication",
      oldValues: {
        status: application.status,
      },
      newValues: {
        status: "REJECTED",
        rejectionReason,
      },
      context,
      statusCode,
      isSuccessful: true,
    });

    await createSystemLog({
      level: "INFO",
      message: "School application rejected",
      module: "SchoolApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        rejectionReason,
        reviewedBy: superAdminId,
      },
    });

    log.info("Application rejected successfully", {
      applicationId,
      rejectionReason,
      superAdminId,
    });

    await sendRejectionEmail({
      email: application.email,
      firstName: application.adminFirstName,
      lastName: application.adminLastName,
      schoolName: application.schoolName,
      rejectionReason,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to reject application", {
      error: err.message,
      applicationId,
      superAdminId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
