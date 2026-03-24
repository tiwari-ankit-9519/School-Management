import { Admin, Role } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  CreateModeratorInput,
  ModeratorWithDetails,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { hashPassword } from "../utils/password";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { sendModeratorInformation } from "./email.service";

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
