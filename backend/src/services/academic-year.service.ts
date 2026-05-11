import { AcademicYear, Prisma } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { AcademicYearInput } from "../validations/input.validations";
import { prisma } from "@/src/config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";

const log = createModuleLogger("AcademicYearService");

export async function createAcademicYearService(
  data: AcademicYearInput,
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ id: string }> {
  try {
    log.info("Starting academic year creation service", {
      ipAddress: context.ipAddress,
      academicYearName: data.name,
      academicStartDate: data.startDate,
      academicEndDate: data.endDate,
    });

    const academicYearExists = await prisma.academicYear.findFirst({
      where: { name: data.name },
      select: { id: true },
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
          where: { isCurrent: true },
          data: { isCurrent: false },
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

    await deleteCacheByPattern(`user:${adminId}:isCurrent:*`);

    if (data.isCurrent) {
      await deleteCacheByPattern(`user:*:isCurrent:*`);
    }

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

    return { id: result.newAcademicYear.id };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create academic year", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getAcademicYearService(
  adminId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    isCurrent?: boolean;
    name?: string;
  },
): Promise<{
  data: AcademicYear[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Starting service to get academic year", {
      adminId,
    });
    const cacheKey = CACHE_KEYS.allAcademicYear(
      adminId,
      filters?.isCurrent !== undefined ? filters.isCurrent : "ALL",
      filters?.name ?? "ALL",
    );
    const cached = await getCache<{
      data: AcademicYear[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning academic year from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.AcademicYearWhereInput = {};
    if (filters?.isCurrent !== undefined) where.isCurrent = filters.isCurrent;
    if (filters?.name) where.name = filters?.name;

    const [academicYear, total] = await prisma.$transaction([
      prisma.academicYear.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.academicYear.count({ where }),
    ]);

    const response = {
      data: academicYear,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "AcademicYearModule",
      message: "Fetched academic year",
      context,
      statusCode,
      metadata: {
        adminId,
        filters,
      },
    });

    log.info("Fetched all admission applications successfully", {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      status: filters ?? "ALL",
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to get academic year", {
      error: err.message,
      ipAddress: context.ipAddress,
      adminId,
    });
    throw err;
  }
}
