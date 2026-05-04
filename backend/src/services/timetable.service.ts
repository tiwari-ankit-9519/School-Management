import { DayOfWeek, Prisma, Timetable } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  CreateTimeTableInput,
  UpdateTimeTableInput,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";

const log = createModuleLogger("TimeTableModule");

export async function createTimeTableService(
  data: CreateTimeTableInput[],
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Timetable[]> {
  try {
    log.info("Starting service to create timetable", {
      ipAddress: context.ipAddress,
    });

    const timeTable = await prisma.$transaction(async (tx) => {
      return await tx.timetable.createManyAndReturn({
        data: data.map((entry) => ({
          classId: entry.classId,
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          startTime: entry.startTime,
          endTime: entry.endTime,
          dayOfWeek: entry.dayOfWeek,
          room: entry.room ?? "",
          periodNumber: entry.periodNumber,
        })),
        skipDuplicates: true,
      });
    });

    await createSystemLog({
      level: "INFO",
      module: "CreateTimeTable",
      message: "Time table created",
      context,
      statusCode,
      metadata: {
        data,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "CREATE",
      module: "CreateTimeTable",
      resourceId: data[0].classId,
      resourceType: "CreateTimeTable",
      newValues: {
        timeTable,
      },
      statusCode,
      context,
      isSuccessful: true,
    });

    log.info("TimeTable created successfully", {
      timeTable,
    });
    return timeTable;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to create timetable`, {
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function getTimeTableForClassService(
  classId: string,
  page: number = 1,
  limit: number = 10,
  context: AuditContext,
  statusCode: number,
  dayOfWeek?: DayOfWeek,
): Promise<{
  data: Timetable[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(
      `Starting service to get time table for class with id ${classId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const where: Prisma.TimetableWhereInput = { classId };
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    const cacheKey = CACHE_KEYS.timetable(
      classId,
      dayOfWeek ?? "ALL",
      page,
      limit,
    );

    const cached = await getCache<{
      data: Timetable[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning cached time table`, { cacheKey });
      return cached;
    }

    const [timeTableExists, total] = await prisma.$transaction([
      prisma.timetable.findMany({
        where,
        orderBy: {
          periodNumber: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.timetable.count({ where }),
    ]);

    if (timeTableExists.length === 0) {
      log.warn(`No timetable found for class ${classId}`);
      throw new Error(`No timetable found for class ${classId}`);
    }

    await createSystemLog({
      level: "INFO",
      module: "GetTimeTable",
      message: `Fetched time table for class with id ${classId}`,
      context,
      statusCode,
      metadata: {
        classId,
        page,
        limit,
      },
    });

    const response = {
      data: timeTableExists,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Fetched time table for class with id ${classId}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch time table for class ${classId}`, {
      error: err.message,
      ipAddress: context.ipAddress,
      classId,
    });
    throw err;
  }
}

export async function updateTimeTableForClassService(
  timeTableId: string,
  data: UpdateTimeTableInput,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Timetable> {
  try {
    log.info(`Starting service to update time table with id ${timeTableId}`, {
      ipAddress: context.ipAddress,
      data,
    });

    const timeTableExists = await prisma.timetable.findUnique({
      where: {
        id: timeTableId,
      },
    });

    if (!timeTableExists) {
      log.warn(`No period found with id ${timeTableId}`);
      throw new Error(`No period found with id ${timeTableId}`);
    }

    const updatedTimeTable = await prisma.timetable.update({
      where: {
        id: timeTableId,
      },
      data: {
        ...(data.startTime && {
          startTime: data.startTime,
        }),
        ...(data.endTime && {
          endTime: data.endTime,
        }),
        ...(data.room && {
          room: data.room,
        }),
        ...(data.subjectId && {
          subjectId: data.subjectId,
        }),
        ...(data.teacherId && {
          teacherId: data.teacherId,
        }),
      },
    });

    log.info(`Time Table updated`);
    await createSystemLog({
      level: "INFO",
      message: `Time table updated for id ${timeTableId}`,
      module: "UpdateTimeTable",
      context,
      statusCode,
      metadata: {
        timeTableId,
        data,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "UPDATE",
      module: "UpdateTimeTable",
      resourceId: updatedTimeTable.id,
      resourceType: "UpdateTimeTable",
      oldValues: {
        ...(data.startTime && { startTime: timeTableExists.startTime }),
        ...(data.endTime && { endTime: timeTableExists.endTime }),
        ...(data.room && { room: timeTableExists.room }),
        ...(data.teacherId && { teacherId: timeTableExists.teacherId }),
        ...(data.subjectId && { subjectId: timeTableExists.subjectId }),
      },
      newValues: {
        startTime: updatedTimeTable.startTime,
        endTime: updatedTimeTable.endTime,
        room: updatedTimeTable.room,
        teacherId: updatedTimeTable.teacherId,
        subjectId: updatedTimeTable.subjectId,
      },
      context,
      isSuccessful: true,
      statusCode,
    });
    return updatedTimeTable;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to update the time table with id ${timeTableId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
      },
    );
    throw err;
  }
}

export async function swapTimeTableForClassService(
  timetableId1: string,
  timetableId2: string,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Timetable[]> {
  try {
    log.info(`Starting service to swap ${timetableId1} with ${timetableId2}`, {
      ipAddress: context.ipAddress,
    });

    let p1: Timetable | null = null;
    let p2: Timetable | null = null;

    const response = await prisma.$transaction(async (tx) => {
      p1 = await tx.timetable.findUnique({
        where: {
          id: timetableId1,
        },
      });

      p2 = await tx.timetable.findUnique({
        where: {
          id: timetableId2,
        },
      });

      if (!p1 || !p2) {
        log.warn(
          `No time table found with id ${timetableId1} and ${timetableId2} to swap`,
        );
        throw new Error("No classes found to swap");
      }

      const updated1 = await tx.timetable.update({
        where: { id: timetableId1 },
        data: {
          startTime: p2.startTime,
          endTime: p2.endTime,
          periodNumber: p2.periodNumber,
        },
      });

      const updated2 = await tx.timetable.update({
        where: { id: timetableId2 },
        data: {
          startTime: p1.startTime,
          endTime: p1.endTime,
          periodNumber: p1.periodNumber,
        },
      });

      return [updated1, updated2];
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "UPDATE",
      module: "SwapTimeTable",
      resourceId: timetableId1,
      resourceType: "SwapTimeTable",
      oldValues: {
        period1: {
          startTime: p1!.startTime,
          endTime: p1!.endTime,
          periodNumber: p1!.periodNumber,
        },
        period2: {
          startTime: p2!.startTime,
          endTime: p2!.endTime,
          periodNumber: p2!.periodNumber,
        },
      },
      newValues: {
        period1: {
          startTime: p2!.startTime,
          endTime: p2!.endTime,
          periodNumber: p2!.periodNumber,
        },
        period2: {
          startTime: p1!.startTime,
          endTime: p1!.endTime,
          periodNumber: p1!.periodNumber,
        },
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      module: "SwapTimeTable",
      message: `Swapped timetable ${timetableId1} with ${timetableId2}`,
      context,
      statusCode,
      metadata: { timetableId1, timetableId2 },
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Cannot swap timetable ${timetableId1} with ${timetableId2}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
      },
    );
    throw err;
  }
}
