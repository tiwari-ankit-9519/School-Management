import { AcademicYear } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { AcademicYearInput } from "../validations/input.validations";
import { prisma } from "@/src/config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";

const log = createModuleLogger("AcademicYearService");

export async function createAcademicYearService(
  data: AcademicYearInput,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<AcademicYear> {
  try {
    log.info("Starting academic year creation service", {
      ipAddress: context.ipAddress,
      academicYearName: data.name,
      academicStartDate: data.startDate,
      academicEndDate: data.endDate,
    });

    const academicYearExists = await prisma.academicYear.findFirst({
      where: {
        name: data.name,
      },
    });

    if (academicYearExists) {
      log.warn("Academic year already exists with the same name", {
        academicYearName: data.name,
      });
      throw new Error("Academic year already exists");
    }

    const result = await prisma.$transaction(async (tx) => {
      if (data.isCurrent) {
        await tx.academicYear.updateMany({
          where: {
            isCurrent: true,
          },
          data: {
            isCurrent: false,
          },
        });
      }

      const newAcademicYear = await tx.academicYear.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isCurrent: data.isCurrent,
        },
      });

      return { newAcademicYear };
    });

    await createSystemLog({
      level: "INFO",
      message: "Academic Year created successfully",
      module: "AcademicYear",
      context,
      metadata: {
        newAcademicYearName: result.newAcademicYear.name,
        newAcademicYearStartDate: result.newAcademicYear.startDate,
        newAcademicYearEndDate: result.newAcademicYear.endDate,
      },
      statusCode,
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "AcademicYear",
      resourceId: result.newAcademicYear.id,
      resourceType: "AcademicYear",
      newValues: {
        newAcademicYearName: result.newAcademicYear.name,
        newAcademicYearStartDate: result.newAcademicYear.startDate,
        newAcademicYearEndDate: result.newAcademicYear.endDate,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Academic Year created successfully", {
      newAcademicYear: result.newAcademicYear,
    });

    return result.newAcademicYear;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create academic year", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
