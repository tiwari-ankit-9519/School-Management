import { AttendanceStatus, Holiday, Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";
import { isSundayDate, toDateOnly } from "../utils/school-day.util";
import {
  CreateHolidayInput,
  HolidayListQueryType,
  UpdateHolidayInput,
} from "../validations/input.validations";

const log = createModuleLogger("HolidayModule");

const HOLIDAY_LIST_CACHE_PATTERN = "holidays:*";

interface HolidayListResult {
  data: Holiday[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceOnDate {
  students: number;
  teachers: number;
  admins: number;
  total: number;
}

export class HolidayAttendanceConflictError extends Error {
  readonly counts: AttendanceOnDate;
  readonly date: string;

  constructor(date: string, counts: AttendanceOnDate) {
    super(
      `Attendance is already marked on ${date} (${counts.students} student, ${counts.teachers} teacher, ${counts.admins} admin records). Confirm to convert them to holiday.`,
    );
    this.name = "HolidayAttendanceConflictError";
    this.counts = counts;
    this.date = date;
  }
}

const toYmd = (date: Date): string => date.toISOString().slice(0, 10);

const monthRange = (year: number, month: number) => ({
  gte: new Date(Date.UTC(year, month - 1, 1)),
  lt: new Date(Date.UTC(year, month, 1)),
});

const yearRange = (year: number) => ({
  gte: new Date(Date.UTC(year, 0, 1)),
  lt: new Date(Date.UTC(year + 1, 0, 1)),
});

const isUniqueDateViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

async function clearHolidayCaches(...dates: Date[]): Promise<void> {
  const months = Array.from(
    new Set(dates.map((date) => toYmd(date).slice(0, 7))),
  );
  await Promise.all([
    deleteCacheByPattern(HOLIDAY_LIST_CACHE_PATTERN),
    deleteCacheByPattern("dashboard:overview:*"),
    deleteCacheByPattern("user:*:today:*"),
    ...months.map((month) =>
      deleteCacheByPattern(`dashboard:calendar:${month}`),
    ),
  ]);
}

async function countAttendanceOn(date: Date): Promise<AttendanceOnDate> {
  const where = { date, status: { not: AttendanceStatus.HOLIDAY } };
  const [students, teachers, admins] = await Promise.all([
    prisma.studentAttendance.count({ where }),
    prisma.teacherAttendance.count({ where }),
    prisma.adminAttendance.count({ where }),
  ]);
  return { students, teachers, admins, total: students + teachers + admins };
}

async function assertDateAvailable(
  date: Date,
  excludeHolidayId?: string,
): Promise<void> {
  const label = toYmd(date);

  if (isSundayDate(date)) {
    throw new Error(
      "Cannot create a holiday on a Sunday, it is already a day off",
    );
  }

  const existing = await prisma.holiday.findUnique({
    where: { date },
    select: { id: true, name: true },
  });
  if (existing && existing.id !== excludeHolidayId) {
    throw new Error(`${label} is already a holiday: ${existing.name}`);
  }
}

async function convertAttendanceToHoliday(
  tx: Prisma.TransactionClient,
  date: Date,
): Promise<number> {
  const where = { date, status: { not: AttendanceStatus.HOLIDAY } };
  const data = { status: AttendanceStatus.HOLIDAY };
  const [students, teachers, admins] = await Promise.all([
    tx.studentAttendance.updateMany({ where, data }),
    tx.teacherAttendance.updateMany({ where, data }),
    tx.adminAttendance.updateMany({ where, data }),
  ]);
  return students.count + teachers.count + admins.count;
}

export async function createHolidayService(
  userId: string,
  data: CreateHolidayInput,
  context: AuditContext,
  statusCode: number,
): Promise<{ holiday: Holiday; convertedAttendance: number }> {
  try {
    log.info("Starting service to create holiday", {
      ipAddress: context.ipAddress,
      userId,
      date: data.date,
      overrideAttendance: data.overrideAttendance,
    });

    const holidayDate = toDateOnly(data.date);
    await assertDateAvailable(holidayDate);

    const attendance = await countAttendanceOn(holidayDate);
    if (attendance.total > 0 && !data.overrideAttendance) {
      log.warn("Attendance exists on requested holiday date", {
        date: data.date,
        attendance,
      });
      throw new HolidayAttendanceConflictError(data.date, attendance);
    }

    let result: { holiday: Holiday; convertedAttendance: number };
    try {
      result = await prisma.$transaction(async (tx) => {
        const holiday = await tx.holiday.create({
          data: {
            name: data.name,
            date: holidayDate,
            description: data.description || null,
          },
        });
        const convertedAttendance =
          attendance.total > 0
            ? await convertAttendanceToHoliday(tx, holidayDate)
            : 0;
        return { holiday, convertedAttendance };
      });
    } catch (error) {
      if (isUniqueDateViolation(error))
        throw new Error(`${data.date} is already a holiday`);
      throw error;
    }

    await clearHolidayCaches(holidayDate);

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Holiday created successfully",
      context,
      statusCode,
      metadata: {
        userId,
        holidayId: result.holiday.id,
        date: data.date,
        convertedAttendance: result.convertedAttendance,
      },
    });

    await createAuditLog({
      performedById: userId,
      action: "CREATE",
      module: "HolidayModule",
      resourceId: result.holiday.id,
      resourceType: "Holiday",
      context,
      statusCode,
      isSuccessful: true,
      newValues: {
        name: result.holiday.name,
        date: data.date,
        description: result.holiday.description,
        convertedAttendance: result.convertedAttendance,
      },
    });

    log.info("Holiday created successfully", {
      holidayId: result.holiday.id,
      convertedAttendance: result.convertedAttendance,
    });
    return result;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create holiday", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
      date: data.date,
    });
    throw err;
  }
}

export async function updateHolidayService(
  userId: string,
  holidayId: string,
  data: UpdateHolidayInput,
  context: AuditContext,
  statusCode: number,
): Promise<{ holiday: Holiday; convertedAttendance: number }> {
  try {
    log.info("Starting service to update holiday", {
      ipAddress: context.ipAddress,
      userId,
      holidayId,
      fields: Object.keys(data),
    });

    const existing = await prisma.holiday.findUnique({
      where: { id: holidayId },
    });
    if (!existing) {
      log.warn("Holiday not found", { holidayId });
      throw new Error("Holiday not found");
    }

    const newDate = data.date ? toDateOnly(data.date) : null;
    const dateChanged = !!newDate && toYmd(newDate) !== toYmd(existing.date);

    let attendance: AttendanceOnDate = {
      students: 0,
      teachers: 0,
      admins: 0,
      total: 0,
    };
    if (dateChanged && newDate) {
      await assertDateAvailable(newDate, holidayId);
      attendance = await countAttendanceOn(newDate);
      if (attendance.total > 0 && !data.overrideAttendance) {
        log.warn("Attendance exists on new holiday date", {
          date: data.date,
          attendance,
        });
        throw new HolidayAttendanceConflictError(toYmd(newDate), attendance);
      }
    }

    const updateData: Prisma.HolidayUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(dateChanged && newDate && { date: newDate }),
    };

    let result: { holiday: Holiday; convertedAttendance: number };
    try {
      result = await prisma.$transaction(async (tx) => {
        const holiday = await tx.holiday.update({
          where: { id: holidayId },
          data: updateData,
        });
        const convertedAttendance =
          dateChanged && newDate && attendance.total > 0
            ? await convertAttendanceToHoliday(tx, newDate)
            : 0;
        return { holiday, convertedAttendance };
      });
    } catch (error) {
      if (isUniqueDateViolation(error))
        throw new Error(`${data.date} is already a holiday`);
      throw error;
    }

    await clearHolidayCaches(existing.date, result.holiday.date);

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Holiday updated successfully",
      context,
      statusCode,
      metadata: {
        userId,
        holidayId,
        changedFields: Object.keys(updateData),
        convertedAttendance: result.convertedAttendance,
      },
    });

    await createAuditLog({
      performedById: userId,
      action: "UPDATE",
      module: "HolidayModule",
      resourceId: holidayId,
      resourceType: "Holiday",
      context,
      statusCode,
      isSuccessful: true,
      oldValues: {
        name: existing.name,
        date: toYmd(existing.date),
        description: existing.description,
      },
      newValues: {
        name: result.holiday.name,
        date: toYmd(result.holiday.date),
        description: result.holiday.description,
        convertedAttendance: result.convertedAttendance,
      },
    });

    log.info("Holiday updated successfully", { holidayId });
    return result;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to update holiday", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
      holidayId,
    });
    throw err;
  }
}

export async function getAllHolidaysService(
  userId: string,
  context: AuditContext,
  statusCode: number,
  query: HolidayListQueryType,
): Promise<HolidayListResult> {
  try {
    const { page, limit, month, year } = query;

    log.info("Starting service to fetch holidays", {
      ipAddress: context.ipAddress,
      userId,
      page,
      limit,
      month,
      year,
    });

    const cacheKey = CACHE_KEYS.allHolidays(
      page,
      limit,
      month ?? "ALL",
      year ?? "ALL",
    );
    const cached = await getCache<HolidayListResult>(cacheKey);
    if (cached) {
      log.info("Returning holidays from cache", { cacheKey });
      return cached;
    }

    const effectiveYear =
      year ?? (month !== undefined ? new Date().getUTCFullYear() : undefined);
    const where: Prisma.HolidayWhereInput =
      month !== undefined && effectiveYear !== undefined
        ? { date: monthRange(effectiveYear, month) }
        : effectiveYear !== undefined
          ? { date: yearRange(effectiveYear) }
          : {};

    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "asc" },
      }),
      prisma.holiday.count({ where }),
    ]);

    const response: HolidayListResult = {
      data: holidays,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.HOLIDAYS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Fetched holidays successfully",
      context,
      statusCode,
      metadata: { userId, page, limit, month, year, total },
    });

    log.info("Fetched holidays successfully", { total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch holidays", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function deleteHolidayService(
  userId: string,
  holidayId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Starting service to delete holiday", {
      ipAddress: context.ipAddress,
      userId,
      holidayId,
    });

    const holiday = await prisma.holiday.findUnique({
      where: { id: holidayId },
    });
    if (!holiday) {
      log.warn("Holiday not found", { holidayId });
      throw new Error("Holiday not found");
    }

    await prisma.holiday.delete({ where: { id: holidayId } });

    await clearHolidayCaches(holiday.date);

    await createSystemLog({
      level: "INFO",
      module: "HolidayModule",
      message: "Holiday deleted successfully",
      context,
      statusCode,
      metadata: { userId, holidayId },
    });

    await createAuditLog({
      performedById: userId,
      action: "DELETE",
      module: "HolidayModule",
      resourceId: holidayId,
      resourceType: "Holiday",
      context,
      statusCode,
      isSuccessful: true,
      oldValues: {
        name: holiday.name,
        date: toYmd(holiday.date),
        description: holiday.description,
      },
    });

    log.info("Holiday deleted successfully", { holidayId });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to delete holiday", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
      holidayId,
    });
    throw err;
  }
}
