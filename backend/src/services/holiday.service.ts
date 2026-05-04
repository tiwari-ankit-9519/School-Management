import { Holiday, Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { isHoliday, isSunday } from "../utils/date.util";
import { CreateHolidayInput } from "../validations/input.validations";

const log = createModuleLogger("HolidayModule");

export async function createHolidayService(
  moderatorId: string,
  data: CreateHolidayInput,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Starting service to create holiday", {
      ipAddress: context.ipAddress,
      moderatorId,
    });

    const holidayDate = new Date(data.date);

    if (isSunday(holidayDate)) {
      log.warn(`Cannot create holiday on Sunday as it is already a day off`, {
        date: data.date,
      });
      throw new Error(
        `Cannot create holiday on Sunday as it is already a day off`,
      );
    }

    log.info(`Sunday check passed, checking if date is already a holiday`, {
      date: data.date,
    });

    const existingHoliday = await prisma.holiday.findUnique({
      where: {
        date: holidayDate,
      },
    });
    if (existingHoliday) {
      log.warn(`Date ${data.date} is already marked as a holiday`, {
        date: data.date,
        existingHoliday: existingHoliday.name,
      });
      throw new Error(
        `Date ${data.date} is already marked as a holiday - ${existingHoliday.name}`,
      );
    }

    log.info(`All checks passed, creating holiday`, {
      date: data.date,
    });

    const newHoliday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: holidayDate,
      },
    });

    log.info(`Holiday created successfully`, {
      holidayId: newHoliday.id,
      date: data.date,
    });

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Holiday created successfully",
      context,
      statusCode,
      metadata: {
        moderatorId,
        holidayId: newHoliday.id,
        date: data.date,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "CREATE",
      module: "HolidayModule",
      resourceId: newHoliday.id,
      resourceType: "HolidayModule",
      context,
      statusCode,
      isSuccessful: true,
      newValues: {
        holidayName: newHoliday.name,
        holidayDate: newHoliday.date,
        description: newHoliday.description,
      },
    });

    log.info(`Create holiday service completed successfully`, {
      holidayId: newHoliday.id,
    });
    return newHoliday;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to create holiday", {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
      date: data.date,
    });
    throw err;
  }
}

export async function getAllHolidaysService(
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    month?: number;
    year?: number;
  },
): Promise<{
  data: Holiday[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Starting service to fetch all holidays", {
      ipAddress: context.ipAddress,
      moderatorId,
    });

    const cacheKey = CACHE_KEYS.allHolidays(
      page,
      limit,
      filters?.month || "ALL",
      filters?.year || "ALL",
    );

    const cached = await getCache<{
      data: Holiday[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning holidays from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, { page, limit });

    const where: Prisma.HolidayWhereInput = {};

    if (filters?.month !== undefined && filters?.year !== undefined) {
      const startOfMonth = new Date(filters.year, filters.month - 1, 1);
      const endOfMonth = new Date(filters.year, filters.month, 0);
      where.date = { gte: startOfMonth, lte: endOfMonth };
    } else if (filters?.year !== undefined) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31);
      where.date = { gte: startOfYear, lte: endOfYear };
    } else if (filters?.month !== undefined) {
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, filters.month - 1, 1);
      const endOfMonth = new Date(currentYear, filters.month, 0);
      where.date = { gte: startOfMonth, lte: endOfMonth };
    }

    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "asc" },
      }),
      prisma.holiday.count({ where }),
    ]);

    log.info(`Database query successful`, { total, page, limit });

    const response = {
      data: holidays,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Holidays cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Fetched all holidays successfully",
      context,
      statusCode,
      metadata: {
        moderatorId,
        filters,
      },
    });

    log.info(`Fetched all holidays successfully`, { total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to fetch holidays", {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
    });
    throw err;
  }
}

export async function deleteHolidayService(
  moderatorId: string,
  holidayId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting service to delete holiday with id ${holidayId}`, {
      ipAddress: context.ipAddress,
      moderatorId,
    });

    const holiday = await prisma.holiday.findUnique({
      where: { id: holidayId },
    });
    if (!holiday) {
      log.warn(`Holiday not found with id ${holidayId}`, {
        holidayId,
      });
      throw new Error(`Holiday not found`);
    }

    log.info(`Holiday found, deleting`, { holidayId });

    await prisma.holiday.delete({
      where: { id: holidayId },
    });

    log.info(`Holiday deleted successfully`, { holidayId });

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Holiday deleted successfully",
      context,
      statusCode,
      metadata: {
        moderatorId,
        holidayId,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "DELETE",
      module: "HolidayModule",
      resourceId: holidayId,
      resourceType: "HolidayModule",
      context,
      statusCode,
      isSuccessful: true,
      oldValues: {
        holidayName: holiday.name,
        holidayDate: holiday.date,
        description: holiday.description,
      },
    });

    log.info(`Delete holiday service completed successfully`, {
      holidayId,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to delete holiday", {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
      holidayId,
    });
    throw err;
  }
}
