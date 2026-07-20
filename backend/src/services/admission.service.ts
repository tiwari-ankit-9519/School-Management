import {
  AdmissionApplication,
  AdmissionStatus,
  Class,
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
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import {
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
  sendSlotOfferedEmailService,
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

export async function createStudentFromApprovedApplication(
  applicationId: string,
  reviewerId: string,
  classId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ id: string }> {
  const [admissionApplication, currentAcademicYear, school] = await Promise.all(
    [
      prisma.admissionApplication.findUnique({ where: { id: applicationId } }),
      prisma.academicYear.findFirst({ where: { isCurrent: true } }),
      prisma.schoolConfig.findFirst({ select: { name: true } }),
    ],
  );
  if (!admissionApplication) throw new Error(`Application not found`);
  if (!currentAcademicYear) throw new Error(`No active academic year found`);
  const classExists = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      section: true,
      capacity: true,
      academicYearId: true,
      classGroupId: true,
    },
  });
  if (!classExists || classExists.academicYearId !== currentAcademicYear.id) {
    throw new Error(
      `Class not found or does not belong to current academic year`,
    );
  }
  const response = await prisma.$transaction(async (tx) => {
    const studentRegNumber = await generateRegistrationNumber(Role.STUDENT);
    const studentTempPassword = `STUDENT@${Math.random().toString(36).slice(-8)}`;
    const hashedPasswordStudent = await hashPassword(studentTempPassword);
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
        firstName: admissionApplication.firstName,
        lastName: admissionApplication.lastName,
        gender: admissionApplication.gender,
        dateOfBirth: admissionApplication.dateOfBirth,
        address: admissionApplication.address,
        city: admissionApplication.city,
        state: admissionApplication.state,
        pincode: admissionApplication.pincode,
      },
    });
    let existingParent = admissionApplication.guardianEmail
      ? await tx.parent.findFirst({
          where: { user: { email: admissionApplication.guardianEmail } },
          include: { user: { select: safeUserSelect } },
        })
      : null;
    if (!existingParent && admissionApplication.guardianPhone) {
      existingParent = await tx.parent.findFirst({
        where: { user: { phone: admissionApplication.guardianPhone } },
        include: { user: { select: safeUserSelect } },
      });
    }
    let parentRegNumber: string;
    let parentTempPassword: string | null = null;
    if (existingParent) {
      parentRegNumber = existingParent.user.regNumber;
      await tx.parentStudent.create({
        data: {
          parentId: existingParent.id,
          studentId: student.id,
          parentType: admissionApplication.guardianRelation,
        },
      });
    } else {
      parentRegNumber = await generateRegistrationNumber(Role.PARENT);
      parentTempPassword = `PARENT@${Math.random().toString(36).slice(-8)}`;
      const hashedPasswordParent = await hashPassword(parentTempPassword);
      const parentUser = await tx.user.create({
        data: {
          regNumber: parentRegNumber,
          email: admissionApplication.guardianEmail,
          phone: admissionApplication.guardianPhone,
          passwordHash: hashedPasswordParent,
          isActive: true,
          isVerified: false,
          role: "PARENT",
        },
      });
      const parent = await tx.parent.create({
        data: {
          userId: parentUser.id,
          firstName: admissionApplication.guardianFirstName,
          lastName: admissionApplication.guardianLastName,
          alternatePhone: null,
        },
      });
      await tx.parentStudent.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
          parentType: admissionApplication.guardianRelation,
        },
      });
    }
    await tx.enrollment.create({
      data: {
        studentId: student.id,
        classId: classExists.id,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
      },
    });
    await tx.admissionApplication.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        slotOfferedAt: null,
        slotExpiresAt: null,
        slotOfferedClass: null,
        waitlistPosition: null,
        waitlistReason: null,
      },
    });
    await tx.admissonApplicationHistory.create({
      data: {
        applicationId,
        status: "APPROVED",
        changedBy: reviewerId,
        previousStatus: admissionApplication.status,
      },
    });
    const admissionFeeStructure = await tx.feeStructure.findFirst({
      where: {
        academicYearId: currentAcademicYear.id,
        isActive: true,
        name: { contains: "Admission", mode: "insensitive" },
        OR: [{ classGroupId: classExists.classGroupId }],
      },
      orderBy: { classGroupId: "desc" },
    });
    if (!admissionFeeStructure) {
      log.warn(
        `No Admission Fee structure found for class ${classExists.name}-${classExists.section} in academic year ${currentAcademicYear.id}. Skipping fee payment creation.`,
        {
          classId: classExists.id,
          classGroupId: classExists.classGroupId,
          academicYearId: currentAcademicYear.id,
          applicationId,
        },
      );
    } else {
      const ADMISSION_FEE_GRACE_PERIOD_DAYS = 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + ADMISSION_FEE_GRACE_PERIOD_DAYS);
      await Promise.all([
        tx.feeStructure.update({
          where: { id: admissionFeeStructure.id },
          data: { dueDate },
        }),
        tx.feePayment.create({
          data: {
            studentId: student.id,
            feeStructureId: admissionFeeStructure.id,
            amountPaid: 0,
            status: "PENDING",
            dueDate,
          },
        }),
      ]);
    }
    const [aggregateCapacity, aggregateEnrollments, aggregatePending] =
      await Promise.all([
        tx.class.aggregate({
          where: {
            name: admissionApplication.appliedForClass,
            academicYearId: currentAcademicYear.id,
          },
          _sum: { capacity: true },
        }),
        tx.enrollment.aggregate({
          where: {
            class: { name: admissionApplication.appliedForClass },
            academicYearId: currentAcademicYear.id,
            status: "ACTIVE",
          },
          _count: { studentId: true },
        }),
        tx.admissionApplication.count({
          where: {
            appliedForClass: admissionApplication.appliedForClass,
            status: "PENDING",
          },
        }),
      ]);
    const totalCapacity = aggregateCapacity._sum.capacity ?? 0;
    const totalOccupied =
      aggregateEnrollments._count.studentId + aggregatePending + 1;
    const isNowFull = totalOccupied >= totalCapacity;
    if (isNowFull) {
      const waitlistedApplications = await tx.admissionApplication.findMany({
        where: {
          appliedForClass: admissionApplication.appliedForClass,
          status: "WAITLISTED",
          waitlistReason: "CLASS_FULL",
        },
        select: { id: true },
        orderBy: { waitlistPosition: "asc" },
      });
      log.info(
        `Class ${admissionApplication.appliedForClass} is now full. ${waitlistedApplications.length} applications remain on waitlist.`,
        {
          appliedForClass: admissionApplication.appliedForClass,
          assignedSection: `${classExists.name}-${classExists.section}`,
          waitlistedCount: waitlistedApplications.length,
        },
      );
    }
    const updatedStudent = await tx.student.findUniqueOrThrow({
      where: { id: student.id },
      include: {
        user: { select: safeUserSelect },
        parentLinks: { include: { parent: true } },
        enrollments: true,
      },
    });
    return {
      student: updatedStudent,
      studentTempPassword,
      parentTempPassword,
      parentRegNumber,
      isExistingParent: !!existingParent,
    };
  });
  await Promise.all([
    deleteCacheByPattern(`students:*`),
    deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
    deleteCacheByPattern(`admission-applications:*`),
  ]);
  await createAuditLog({
    performedById: reviewerId,
    action: "APPROVE",
    module: "Admission",
    resourceId: response.student.user.regNumber,
    resourceType: "StudentCreation",
    oldValues: { status: admissionApplication.status },
    newValues: {
      regNumber: response.student.user.regNumber,
      studentFirstName: response.student.firstName,
      studentLastName: response.student.lastName,
      assignedClass: classExists.name,
      assignedSection: classExists.section,
      linkedExistingParent: response.isExistingParent,
    },
    context,
    isSuccessful: true,
    statusCode,
  });
  await sendAdmissionApprovedEmailService({
    studentFirstName: admissionApplication.firstName,
    studentLastName: admissionApplication.lastName,
    parentFirstName: admissionApplication.guardianFirstName,
    parentLastName: admissionApplication.guardianLastName,
    guardianEmail: admissionApplication.guardianEmail ?? "",
    guardianPhone: admissionApplication.guardianPhone,
    studentRegNumber: response.student.user.regNumber,
    parentRegNumber: response.parentRegNumber,
    studentTempPassword: response.studentTempPassword,
    parentTempPassword:
      response.parentTempPassword ?? "Use your existing password",
    schoolName: school!.name,
    applicationId: admissionApplication.id,
    appliedForClass: admissionApplication.appliedForClass,
  });
  return { id: response.student.id };
}

export async function withdrawStudentService(
  enrollmentId: string,
  moderatorId: string,
  withdrawalReason: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting student withdrawal service`, {
      enrollmentId,
      ipAddress: context.ipAddress,
    });

    const [enrollment, school, currentAcademicYear] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          class: true,
          student: {
            include: {
              user: { select: safeUserSelect },
            },
          },
        },
      }),
      prisma.schoolConfig.findFirst({ select: { name: true } }),
      prisma.academicYear.findFirst({ where: { isCurrent: true } }),
    ]);

    if (!enrollment) {
      throw new Error(`Enrollment not found with enrollmentId ${enrollmentId}`);
    }
    if (enrollment.status !== "ACTIVE") {
      throw new Error(`Enrollment is already ${enrollment.status}`);
    }
    if (!currentAcademicYear) {
      throw new Error(`No active academic year found`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "WITHDRAWN",
          withdrawalReason,
          withdrawnAt: new Date(),
          withdrawnBy: moderatorId,
        },
      });
    });

    await deleteCacheByPattern(`students:*`);

    const nextWaitlisted = await prisma.admissionApplication.findFirst({
      where: {
        appliedForClass: enrollment.class.name,
        status: "WAITLISTED",
        waitlistReason: "CLASS_FULL",
      },
      orderBy: { waitlistPosition: "asc" },
    });

    if (nextWaitlisted) {
      await offerSlotToNextWaitlistedService(
        enrollment.class.name,
        enrollment.classId,
        moderatorId,
        school!.name,
      );
    }

    await createAuditLog({
      performedById: moderatorId,
      action: "UPDATE",
      module: "Enrollment",
      resourceId: enrollmentId,
      resourceType: "Enrollment",
      oldValues: { status: "ACTIVE" },
      newValues: { status: "WITHDRAWN", withdrawalReason },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "Student withdrawn successfully",
      module: "Enrollment",
      context,
      statusCode,
      metadata: {
        enrollmentId,
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        className: enrollment.class.name,
        section: enrollment.class.section,
        withdrawalReason,
        slotOfferedTo: nextWaitlisted?.id ?? null,
      },
    });

    log.info(`Student withdrawn successfully`, {
      enrollmentId,
      studentId: enrollment.studentId,
      slotOfferedTo: nextWaitlisted?.id ?? null,
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to withdraw student`, {
      error: err.message,
      enrollmentId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function confirmSlotOfferService(
  applicationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting slot offer confirmation service`, {
      applicationId,
      ipAddress: context.ipAddress,
    });

    const [admissionApplication, currentAcademicYear, school] =
      await Promise.all([
        prisma.admissionApplication.findUnique({
          where: { id: applicationId },
        }),
        prisma.academicYear.findFirst({ where: { isCurrent: true } }),
        prisma.schoolConfig.findFirst({ select: { name: true } }),
      ]);

    if (!admissionApplication) {
      throw new Error(
        `Application not found with applicationId ${applicationId}`,
      );
    }
    if (admissionApplication.status !== "SLOT_OFFERED") {
      throw new Error(
        `Application is not in SLOT_OFFERED state, it is ${admissionApplication.status}`,
      );
    }
    if (!currentAcademicYear) {
      throw new Error(`No active academic year found`);
    }
    if (!admissionApplication.slotOfferedClass) {
      throw new Error(`No class assigned to this slot offer`);
    }

    if (
      admissionApplication.slotExpiresAt &&
      new Date() > admissionApplication.slotExpiresAt
    ) {
      await prisma.$transaction(async (tx) => {
        await tx.admissionApplication.update({
          where: { id: applicationId },
          data: {
            status: "OFFER_EXPIRED",
            slotOfferedAt: null,
            slotExpiresAt: null,
            slotOfferedClass: null,
          },
        });

        await tx.admissonApplicationHistory.create({
          data: {
            applicationId,
            status: "OFFER_EXPIRED",
            changedBy: "SYSTEM",
            previousStatus: "SLOT_OFFERED",
          },
        });
      });

      await offerSlotToNextWaitlistedService(
        admissionApplication.appliedForClass,
        admissionApplication.slotOfferedClass,
        "SYSTEM",
        school!.name,
      );

      throw new Error(
        `Slot offer has expired. The seat has been offered to the next applicant.`,
      );
    }

    await createStudentFromApprovedApplication(
      applicationId,
      "SYSTEM",
      admissionApplication.slotOfferedClass,
      context,
      statusCode,
    );

    await prisma.admissionApplication.update({
      where: { id: applicationId },
      data: {
        slotOfferedAt: null,
        slotExpiresAt: null,
        slotOfferedClass: null,
      },
    });

    await Promise.all([
      deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
      deleteCacheByPattern(`admission-applications:*`),
    ]);

    await createAuditLog({
      performedById: "GUARDIAN",
      action: "UPDATE",
      module: "AdmissionApplication",
      resourceId: applicationId,
      resourceType: "AdmissionApplication",
      oldValues: { status: "SLOT_OFFERED" },
      newValues: { status: "APPROVED" },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "Slot offer confirmed by guardian, student created successfully",
      module: "AdmissionApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        classId: admissionApplication.slotOfferedClass,
      },
    });

    log.info(`Slot offer confirmed successfully`, {
      applicationId,
      classId: admissionApplication.slotOfferedClass,
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to confirm slot offer`, {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function declineSlotOfferService(
  applicationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting slot offer decline service`, {
      applicationId,
      ipAddress: context.ipAddress,
    });

    const [admissionApplication, school] = await Promise.all([
      prisma.admissionApplication.findUnique({
        where: { id: applicationId },
      }),
      prisma.schoolConfig.findFirst({ select: { name: true } }),
    ]);

    if (!admissionApplication) {
      throw new Error(
        `Application not found with applicationId ${applicationId}`,
      );
    }
    if (admissionApplication.status !== "SLOT_OFFERED") {
      throw new Error(
        `Application is not in SLOT_OFFERED state, it is ${admissionApplication.status}`,
      );
    }
    if (!admissionApplication.slotOfferedClass) {
      throw new Error(`No class assigned to this slot offer`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: "OFFER_DECLINED",
          slotOfferedAt: null,
          slotExpiresAt: null,
          slotOfferedClass: null,
        },
      });

      await tx.admissonApplicationHistory.create({
        data: {
          applicationId,
          status: "OFFER_DECLINED",
          changedBy: "GUARDIAN",
          previousStatus: "SLOT_OFFERED",
        },
      });
    });

    await offerSlotToNextWaitlistedService(
      admissionApplication.appliedForClass,
      admissionApplication.slotOfferedClass,
      "SYSTEM",
      school!.name,
    );

    await Promise.all([
      deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
      deleteCacheByPattern(`admission-applications:*`),
    ]);

    await createAuditLog({
      performedById: "GUARDIAN",
      action: "UPDATE",
      module: "AdmissionApplication",
      resourceId: applicationId,
      resourceType: "AdmissionApplication",
      oldValues: { status: "SLOT_OFFERED" },
      newValues: { status: "OFFER_DECLINED" },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "Slot offer declined by guardian",
      module: "AdmissionApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        declinedClassId: admissionApplication.slotOfferedClass,
      },
    });

    log.info(`Slot offer declined successfully`, {
      applicationId,
      declinedClassId: admissionApplication.slotOfferedClass,
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to decline slot offer`, {
      error: err.message,
      applicationId,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function offerSlotToNextWaitlistedService(
  appliedForClass: string,
  classId: string,
  offeredBy: string,
  schoolName: string,
): Promise<void> {
  const nextWaitlisted = await prisma.admissionApplication.findFirst({
    where: {
      appliedForClass,
      status: "WAITLISTED",
      waitlistReason: "CLASS_FULL",
    },
    orderBy: { waitlistPosition: "asc" },
  });

  if (!nextWaitlisted) {
    log.info(
      `No CLASS_FULL waitlisted applicants remaining for class ${appliedForClass}`,
    );
    return;
  }

  const slotExpiresAt = new Date();
  slotExpiresAt.setHours(slotExpiresAt.getHours() + 48);

  await prisma.$transaction(async (tx) => {
    await tx.admissionApplication.update({
      where: { id: nextWaitlisted.id },
      data: {
        status: "SLOT_OFFERED",
        slotOfferedAt: new Date(),
        slotExpiresAt,
        slotOfferedClass: classId,
        waitlistPosition: null,
        waitlistReason: null,
      },
    });

    await tx.admissionApplication.updateMany({
      where: {
        appliedForClass,
        status: "WAITLISTED",
        waitlistPosition: { gt: nextWaitlisted.waitlistPosition ?? 0 },
      },
      data: { waitlistPosition: { decrement: 1 } },
    });

    await tx.admissonApplicationHistory.create({
      data: {
        applicationId: nextWaitlisted.id,
        status: "SLOT_OFFERED",
        changedBy: offeredBy,
        previousStatus: "WAITLISTED",
      },
    });
  });

  await sendSlotOfferedEmailService({
    studentFirstName: nextWaitlisted.firstName,
    studentLastName: nextWaitlisted.lastName,
    guardianFirstName: nextWaitlisted.guardianFirstName,
    guardianLastName: nextWaitlisted.guardianLastName,
    guardianEmail: nextWaitlisted.guardianEmail ?? "",
    appliedForClass: nextWaitlisted.appliedForClass,
    schoolName,
    applicationId: nextWaitlisted.id,
    slotExpiresAt,
  });

  log.info(`Slot offered to next waitlisted applicant`, {
    applicationId: nextWaitlisted.id,
    appliedForClass,
    classId,
    slotExpiresAt,
  });
}

export async function expireSlotOffersService(): Promise<void> {
  try {
    log.info(`Starting slot offer expiry check`);

    const [expiredOffers, school] = await Promise.all([
      prisma.admissionApplication.findMany({
        where: {
          status: "SLOT_OFFERED",
          slotExpiresAt: { lt: new Date() },
        },
        select: {
          id: true,
          appliedForClass: true,
          slotOfferedClass: true,
        },
      }),
      prisma.schoolConfig.findFirst({ select: { name: true } }),
    ]);

    if (expiredOffers.length === 0) {
      log.info(`No expired slot offers found`);
      return;
    }

    log.info(`Found ${expiredOffers.length} expired slot offers`, {
      applicationIds: expiredOffers.map((o) => o.id),
    });

    for (const offer of expiredOffers) {
      await prisma.$transaction(async (tx) => {
        await tx.admissionApplication.update({
          where: { id: offer.id },
          data: {
            status: "OFFER_EXPIRED",
            slotOfferedAt: null,
            slotExpiresAt: null,
            slotOfferedClass: null,
          },
        });

        await tx.admissonApplicationHistory.create({
          data: {
            applicationId: offer.id,
            status: "OFFER_EXPIRED",
            changedBy: "SYSTEM",
            previousStatus: "SLOT_OFFERED",
          },
        });
      });

      log.info(`Slot offer expired`, { applicationId: offer.id });

      if (offer.slotOfferedClass) {
        await offerSlotToNextWaitlistedService(
          offer.appliedForClass,
          offer.slotOfferedClass,
          "SYSTEM",
          school!.name,
        );
      }

      await deleteCacheByPattern(`admission-applications:*`);
    }

    log.info(`Slot offer expiry check completed`, {
      expiredCount: expiredOffers.length,
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to run slot offer expiry check`, {
      error: err.message,
    });
    throw err;
  }
}

export async function handleNewSectionWaitlistPromotionService(
  newClassId: string,
  newClassName: string,
  newClassCapacity: number,
  newClassSection: string,
  moderatorId: string,
): Promise<void> {
  try {
    log.info(
      `Checking CLASS_FULL waitlist after new section ${newClassName}-${newClassSection} created`,
    );

    const [waitlistedApplications, school] = await Promise.all([
      prisma.admissionApplication.findMany({
        where: {
          appliedForClass: newClassName,
          status: "WAITLISTED",
          waitlistReason: "CLASS_FULL",
        },
        orderBy: { waitlistPosition: "asc" },
        take: newClassCapacity,
      }),
      prisma.schoolConfig.findFirst({ select: { name: true } }),
    ]);

    if (waitlistedApplications.length === 0) {
      log.info(
        `No CLASS_FULL waitlisted applicants found for class ${newClassName}`,
      );
      return;
    }

    log.info(
      `Found ${waitlistedApplications.length} CLASS_FULL waitlisted applicants for class ${newClassName}, offering slots`,
    );

    for (const application of waitlistedApplications) {
      await offerSlotToNextWaitlistedService(
        newClassName,
        newClassId,
        moderatorId,
        school!.name,
      );
    }

    log.info(
      `Slot offers sent to ${waitlistedApplications.length} waitlisted applicants for new section ${newClassName}-${newClassSection}`,
    );
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to handle waitlist promotion after new section creation`,
      {
        error: err.message,
        newClassId,
        newClassName,
        newClassSection,
      },
    );
    throw err;
  }
}

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
          select: { name: true },
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

    const [totalPendingApplicationForClass, totalEnrollments, capacity] =
      await Promise.all([
        prisma.admissionApplication.count({
          where: {
            appliedForClass: data.appliedForClass,
            status: "PENDING",
          },
        }),
        prisma.enrollment.aggregate({
          where: {
            class: { name: data.appliedForClass },
            academicYearId: currentAcademicYear.id,
            status: "ACTIVE",
          },
          _count: { studentId: true },
        }),
        prisma.class.aggregate({
          where: {
            name: data.appliedForClass,
            academicYearId: currentAcademicYear.id,
          },
          _sum: { capacity: true },
        }),
      ]);

    const totalCapacity = capacity._sum.capacity;
    if (!totalCapacity) {
      throw new Error(
        "No class found for the applied class in current academic year",
      );
    }

    const totalOccupied =
      totalPendingApplicationForClass + totalEnrollments._count.studentId;
    const remainingCapacity = totalCapacity - totalOccupied;
    const isClassFull = remainingCapacity <= 0;

    const waitlistPosition = isClassFull
      ? (await prisma.admissionApplication.count({
          where: {
            appliedForClass: data.appliedForClass,
            status: "WAITLISTED",
          },
        })) + 1
      : null;

    const applicationStatus = isClassFull ? "WAITLISTED" : "PENDING";
    const applicationWaitlistReason = isClassFull ? "CLASS_FULL" : null;

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
                status: applicationStatus,
                waitlistPosition,
                waitlistReason: applicationWaitlistReason,
                rejectionReason: null,
                reviewedAt: null,
                reviewedBy: null,
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
          status: applicationStatus,
          waitlistPosition,
          waitlistReason: applicationWaitlistReason,
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
  const admissionApplication = await prisma.admissionApplication.findUnique({
    where: { id: applicationId },
  });

  if (!admissionApplication) throw new Error(`Application not found`);

  if (
    admissionApplication.status !== "PENDING" &&
    admissionApplication.status !== "WAITLISTED"
  ) {
    throw new Error(
      `Application cannot be accepted as it is in ${admissionApplication.status}`,
    );
  }

  const result = await createStudentFromApprovedApplication(
    applicationId,
    reviewerId,
    classId,
    context,
    statusCode,
  );

  await deleteCache(CACHE_KEYS.admissionApplication(applicationId));
  await deleteCacheByPattern(`admission-applications:*`);

  return result;
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

    const [admissionApplication, school] = await Promise.all([
      prisma.admissionApplication.findUnique({
        where: { id: applicationId },
      }),
      prisma.schoolConfig.findFirst({
        select: { name: true },
      }),
    ]);

    if (!admissionApplication) {
      log.warn(
        `Admission application not found with applicationId ${applicationId}`,
      );
      throw new Error(
        `Admission application not found with applicationId ${applicationId}`,
      );
    }

    if (
      admissionApplication.status !== "PENDING" &&
      admissionApplication.status !== "WAITLISTED"
    ) {
      log.warn("Admission application status is not PENDING or WAITLISTED", {
        applicationId,
        currentStatus: admissionApplication.status,
      });
      throw new Error(
        `Admission application cannot be rejected as it is ${admissionApplication.status}`,
      );
    }

    const { nextWaitlistedId } = await prisma.$transaction(async (tx) => {
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

      if (admissionApplication.status === "WAITLISTED") {
        if (admissionApplication.waitlistPosition !== null) {
          await tx.admissionApplication.updateMany({
            where: {
              appliedForClass: admissionApplication.appliedForClass,
              status: "WAITLISTED",
              waitlistPosition: {
                gt: admissionApplication.waitlistPosition,
              },
            },
            data: { waitlistPosition: { decrement: 1 } },
          });
        }
        return { nextWaitlistedId: null };
      }

      const nextWaitlisted = await tx.admissionApplication.findFirst({
        where: {
          appliedForClass: admissionApplication.appliedForClass,
          status: "WAITLISTED",
          waitlistReason: "CLASS_FULL",
        },
        orderBy: { waitlistPosition: "asc" },
        select: { waitlistPosition: true, id: true },
      });

      if (!nextWaitlisted || nextWaitlisted.waitlistPosition === null) {
        return { nextWaitlistedId: null };
      }

      return { nextWaitlistedId: nextWaitlisted.id };
    });

    await Promise.all([
      deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
      deleteCacheByPattern(`admission-applications:*`),
    ]);

    if (nextWaitlistedId) {
      await deleteCache(CACHE_KEYS.admissionApplication(nextWaitlistedId));

      const [nextWaitlistedApplication, targetClass] = await Promise.all([
        prisma.admissionApplication.findUnique({
          where: { id: nextWaitlistedId },
          select: { appliedForClass: true, waitlistPosition: true },
        }),
        prisma.class.findFirst({
          where: {
            name: admissionApplication.appliedForClass,
            academicYear: { isCurrent: true },
          },
        }),
      ]);

      if (!targetClass) {
        log.warn(
          `No class found with name ${admissionApplication.appliedForClass} in current academic year, skipping slot offer for application ${nextWaitlistedId}`,
        );
      } else if (nextWaitlistedApplication) {
        await offerSlotToNextWaitlistedService(
          admissionApplication.appliedForClass,
          targetClass.id,
          moderatorId,
          school!.name,
        );
      }
    }

    await createAuditLog({
      performedById: moderatorId,
      action: "REJECT",
      module: "AdmissionApplication",
      resourceId: admissionApplication.id,
      resourceType: "AdmissionApplication",
      oldValues: { status: admissionApplication.status },
      newValues: { status: "REJECTED", rejectionReason },
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
        slotOfferedTo: nextWaitlistedId ?? null,
      },
    });

    await sendAdmissionApplicationRejectedEmailService({
      studentFirstName: admissionApplication.firstName,
      studentLastName: admissionApplication.lastName,
      guardianFirstName: admissionApplication.guardianFirstName,
      guardianLastName: admissionApplication.guardianLastName,
      guardianEmail: admissionApplication.guardianEmail ?? "",
      appliedForClass: admissionApplication.appliedForClass,
      schoolName: school!.name,
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

    const [admissionApplicationExists, school, currentAcademicYear] =
      await Promise.all([
        prisma.admissionApplication.findUnique({
          where: { id: applicationId },
        }),
        prisma.schoolConfig.findFirst({ select: { name: true } }),
        prisma.academicYear.findFirst({ where: { isCurrent: true } }),
      ]);

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

    if (!currentAcademicYear) {
      throw new Error(
        "No active academic year found. Cannot resubmit application.",
      );
    }

    const [totalPendingApplicationForClass, totalEnrollments, capacity] =
      await Promise.all([
        prisma.admissionApplication.count({
          where: {
            appliedForClass: admissionApplicationExists.appliedForClass,
            status: "PENDING",
          },
        }),
        prisma.enrollment.aggregate({
          where: {
            class: { name: admissionApplicationExists.appliedForClass },
            academicYearId: currentAcademicYear.id,
            status: "ACTIVE",
          },
          _count: { studentId: true },
        }),
        prisma.class.aggregate({
          where: {
            name: admissionApplicationExists.appliedForClass,
            academicYearId: currentAcademicYear.id,
          },
          _sum: { capacity: true },
        }),
      ]);

    const totalCapacity = capacity._sum.capacity;
    if (!totalCapacity) {
      throw new Error(
        "No class found for the applied class in current academic year",
      );
    }

    const totalOccupied =
      totalPendingApplicationForClass + totalEnrollments._count.studentId;
    const remainingCapacity = totalCapacity - totalOccupied;
    const isClassFull = remainingCapacity <= 0;

    const waitlistPosition = isClassFull
      ? (await prisma.admissionApplication.count({
          where: {
            appliedForClass: admissionApplicationExists.appliedForClass,
            status: "WAITLISTED",
          },
        })) + 1
      : null;

    const applicationStatus = isClassFull ? "WAITLISTED" : "PENDING";
    const applicationWaitlistReason = isClassFull ? "CLASS_FULL" : null;

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
          status: applicationStatus,
          waitlistPosition,
          waitlistReason: applicationWaitlistReason,
          rejectionReason: null,
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
        status: applicationStatus,
        waitlistPosition,
      },
      context,
      statusCode,
    });

    log.info("Application resubmitted successfully", {
      applicationId,
      updatedFields: Object.keys(data),
      documentCount: uploadedFiles.length,
      status: applicationStatus,
      waitlistPosition,
    });

    await sendAdmissionApplicationResubmittedEmailService({
      studentFirstName: admissionApplicationExists.firstName,
      studentLastName: admissionApplicationExists.lastName,
      guardianFirstName: admissionApplicationExists.guardianFirstName,
      guardianLastName: admissionApplicationExists.guardianLastName,
      guardianEmail: admissionApplicationExists.guardianEmail ?? "",
      guardianPhone: admissionApplicationExists.guardianPhone,
      appliedForClass: admissionApplicationExists.appliedForClass,
      schoolName: school!.name,
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
      `Starting service to waitlist admission application with applicationId ${applicationId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    if (waitlistReason === "CLASS_FULL") {
      throw new Error(
        `Waitlist reason cannot be CLASS_FULL for manual waitlisting. This reason is reserved for system use.`,
      );
    }

    const [admissionApplication, school] = await Promise.all([
      prisma.admissionApplication.findUnique({
        where: { id: applicationId },
      }),
      prisma.schoolConfig.findFirst({
        select: { name: true },
      }),
    ]);

    if (!admissionApplication) {
      log.warn(`No application found with applicationId ${applicationId}`);
      throw new Error(
        `No application found with applicationId ${applicationId}`,
      );
    }

    if (admissionApplication.status !== "PENDING") {
      log.warn(
        `Application cannot be marked waitlisted as it is ${admissionApplication.status}`,
      );
      throw new Error(
        `Application cannot be marked waitlisted as it is ${admissionApplication.status}`,
      );
    }

    const nextWaitlistPosition = await prisma.$transaction(async (tx) => {
      const lastWaitlistPosition = await tx.admissionApplication.findFirst({
        where: {
          appliedForClass: admissionApplication.appliedForClass,
          status: "WAITLISTED",
        },
        orderBy: { waitlistPosition: "desc" },
        select: { waitlistPosition: true },
      });

      const nextPosition = (lastWaitlistPosition?.waitlistPosition ?? 0) + 1;

      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: "WAITLISTED",
          waitlistPosition: nextPosition,
          waitlistReason,
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

      return nextPosition;
    });

    await Promise.all([
      deleteCache(CACHE_KEYS.admissionApplication(applicationId)),
      deleteCacheByPattern(`admission-applications:*`),
    ]);

    await createAuditLog({
      performedById: moderatorId,
      action: "UPDATE",
      module: "AdmissionApplication",
      resourceId: applicationId,
      resourceType: "AdmissionApplication",
      oldValues: { status: admissionApplication.status },
      newValues: {
        status: "WAITLISTED",
        waitlistPosition: nextWaitlistPosition,
        waitlistReason,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      message: "Admission Application Waitlisted",
      module: "AdmissionApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        waitlistPosition: nextWaitlistPosition,
        waitlistReason,
      },
    });

    await sendAdmissionApplicationWaitlistedEmailService({
      studentFirstName: admissionApplication.firstName,
      studentLastName: admissionApplication.lastName,
      guardianFirstName: admissionApplication.guardianFirstName,
      guardianLastName: admissionApplication.guardianLastName,
      guardianEmail: admissionApplication.guardianEmail ?? "",
      appliedForClass: admissionApplication.appliedForClass,
      schoolName: school!.name,
      applicationId,
      waitlistPosition: nextWaitlistPosition,
      waitlistReason,
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to waitlist admission application with applicationId ${applicationId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
      },
    );
    throw err;
  }
}

export async function getAdmissionClassService(
  name: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<
  (Class & { enrolled: number; pending: number; remaining: number })[]
> {
  try {
    log.info(`Starting service to find class with the name ${name}`, {
      ipAddress: context.ipAddress,
      name,
    });

    const cacheKey = CACHE_KEYS.classes(name, adminId);
    const cached =
      await getCache<
        (Class & { enrolled: number; pending: number; remaining: number })[]
      >(cacheKey);
    if (cached) {
      log.info(`Cache found. Returning from cache`, { cacheKey });
      return cached;
    }

    const classes = await prisma.class.findMany({
      where: { name, academicYear: { isCurrent: true } },
    });

    if (!classes || classes.length === 0) {
      log.warn(`No classes found with the name ${name}`);
      throw new Error(`No classes found with the name ${name}`);
    }

    const classIds = classes.map((c) => c.id);

    const [enrollmentCounts, pendingCounts] = await Promise.all([
      prisma.enrollment.groupBy({
        by: ["classId"],
        where: {
          classId: { in: classIds },
          status: "ACTIVE",
        },
        _count: { studentId: true },
      }),
      prisma.admissionApplication.groupBy({
        by: ["appliedForClass"],
        where: {
          appliedForClass: name,
          status: "PENDING",
        },
        _count: { id: true },
      }),
    ]);

    const enrollmentMap = new Map(
      enrollmentCounts.map((e) => [e.classId, e._count.studentId]),
    );

    const totalPending = pendingCounts[0]?._count.id ?? 0;
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalEnrolled = enrollmentCounts.reduce(
      (sum, e) => sum + e._count.studentId,
      0,
    );

    const pendingPerClass =
      classes.length > 0 ? Math.floor(totalPending / classes.length) : 0;

    const result = classes.map((cls) => {
      const enrolled = enrollmentMap.get(cls.id) ?? 0;
      const pending = pendingPerClass;
      const remaining = Math.max(0, cls.capacity - enrolled - pending);
      return {
        ...cls,
        enrolled,
        pending,
        remaining,
      };
    });

    await setCache(cacheKey, result);

    await createSystemLog({
      level: "INFO",
      module: "Class",
      message: `Fetched all classes with remaining capacity for admission`,
      metadata: {
        name,
        adminId,
        totalCapacity,
        totalEnrolled,
        totalPending,
        classCount: classes.length,
      },
      context,
      statusCode,
    });

    log.info(`Fetched classes with remaining capacity`, {
      name,
      classCount: classes.length,
      totalCapacity,
      totalEnrolled,
      totalPending,
    });

    return result;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch class names for admission`,
      {
        ipAddress: context.ipAddress,
        error: err.message,
        name,
      },
    );
    throw err;
  }
}
