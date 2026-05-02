import { ExamSchedule, ExamType, Prisma } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { ExamScheduleInput } from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { date } from "zod";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";

const log = createModuleLogger("ExamScheduleModule");

export async function createExamScheduleService(
  schoolId: string,
  moderatorId: string,
  classId: string,
  data: ExamScheduleInput,
  context: AuditContext,
  statusCode: number,
): Promise<ExamSchedule[]> {
  try {
    log.info(
      `Starting service to create exam schedule for class with id ${classId}`,
      {
        ipAddress: context.ipAddress,
        schoolId,
        moderatorId,
      },
    );

    const classExists = await prisma.class.findUnique({
      where: { id: classId, schoolId },
    });
    if (!classExists) {
      log.warn(`Class not found with id ${classId}`);
      throw new Error(`Class not found with id ${classId}`);
    }

    if (data.passingMarks > data.totalMarks) {
      throw new Error(`Passing marks cannot exceed total marks`);
    }

    if (data.startTime >= data.endTime) {
      throw new Error(`Start time must be before end time`);
    }

    const isHoliday = await prisma.holiday.findFirst({
      where: { schoolId, date: new Date(data.date) },
    });
    if (isHoliday) {
      log.warn(`Cannot schedule exam on holiday: ${isHoliday.name}`);
      throw new Error(
        `Cannot schedule exam on holiday: ${isHoliday.name} (${isHoliday.date})`,
      );
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true },
    });

    const subjectIds = data.entries.map((entry) => entry.subjectId);
    const subjectCount = await prisma.subject.count({
      where: { schoolId, id: { in: subjectIds } },
    });
    if (subjectCount !== subjectIds.length) {
      log.warn(`One or more subjects do not exist`);
      throw new Error(
        `One or more subjects do not exist or don't belong to this school`,
      );
    }

    const teacherIds = data.entries.map((entry) => entry.teacherId);
    const teacherCount = await prisma.teacher.count({
      where: {
        id: { in: teacherIds },
        user: { schoolId },
      },
    });
    if (teacherCount !== teacherIds.length) {
      log.warn(`One or more teachers do not exist`);
      throw new Error(
        `One or more teachers do not exist or don't belong to this school`,
      );
    }

    const assignedPairs = await prisma.teacherSubject.findMany({
      where: {
        classId,
        OR: data.entries.map((entry) => ({
          teacherId: entry.teacherId,
          subjectId: entry.subjectId,
        })),
      },
      select: { teacherId: true, subjectId: true },
    });

    const assignedSet = new Set(
      assignedPairs.map((a) => `${a.teacherId}:${a.subjectId}`),
    );

    for (const entry of data.entries) {
      if (!assignedSet.has(`${entry.teacherId}:${entry.subjectId}`)) {
        throw new Error(
          `Teacher is not assigned to subject ${entry.subjectId}`,
        );
      }
    }

    for (const entry of data.entries) {
      const conflict = await prisma.examSchedule.findFirst({
        where: {
          classId,
          subjectId: entry.subjectId,
          date: new Date(data.date),
          OR: [
            {
              startTime: { lte: data.endTime },
              endTime: { gte: data.startTime },
            },
          ],
        },
      });
      if (conflict) {
        throw new Error(
          `Exam already scheduled for subject ${entry.subjectId} on ${data.date} with overlapping time`,
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const allExamSchedule = await tx.examSchedule.createManyAndReturn({
        data: data.entries.map((entry) => ({
          classId,
          academicYearId: academicYear!.id,
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          examType: data.examType,
          title: data.title,
          date: new Date(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          totalMarks: data.totalMarks,
          passingMarks: data.passingMarks,
          weightage: data.weightage,
          ...(data.instructions && { instructions: data.instructions }),
        })),
      });
      return { allExamSchedule };
    });

    await createSystemLog({
      level: "INFO",
      module: "ExamScheduleModule",
      message: "Exam Schedule prepared successfully",
      context,
      statusCode,
      metadata: {
        schoolId,
        classId,
        moderatorId,
      },
    });

    await createAuditLog({
      schoolId,
      context,
      module: "ExamScheduleModule",
      statusCode,
      action: "CREATE",
      performedById: moderatorId,
      resourceId: result.allExamSchedule[0]?.id,
      resourceType: "ExamScheduleModule",
      newValues: {
        examSchdeule: result.allExamSchedule,
      },
      isSuccessful: true,
    });

    log.info(
      `Exam Schedule prepared successfully for class with id ${classId}`,
    );

    return result.allExamSchedule;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to create exam schedule`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      moderatorId,
      classId,
    });
    throw err;
  }
}

export async function getExamScheduleForAdminService(
  schoolId: string,
  moderatorId: string,
  filters: {
    classId?: string;
    academicYearId?: string;
    examType?: ExamType;
    subjectId?: string;
    teacherId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: "date" | "createdAt";
    sortOrder?: "asc" | "desc";
  },
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: ExamSchedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch exam schedule`, {
      ipAddress: context.ipAddress,
      schoolId,
      moderatorId,
    });

    const sortBy = filters?.sortBy ?? "date";
    const sortOrder = filters?.sortOrder ?? "asc";

    const cacheKey = CACHE_KEYS.allExamSchedule(
      schoolId,
      moderatorId,
      filters?.classId || "ALL",
      filters?.academicYearId || "ALL",
      filters?.examType || "ALL",
      filters?.subjectId || "ALL",
      filters?.teacherId || "ALL",
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      page,
      limit,
      sortOrder || "ALL",
      sortBy || "ALL",
    );

    const cached = await getCache<{
      data: ExamSchedule[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning exam schedule from cache`, { cacheKey });
      return cached;
    }

    const where: Prisma.ExamScheduleWhereInput = { schoolId };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.examType) where.examType = filters.examType;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.fromDate || filters?.toDate) {
      where.date = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }

    const [allExamSchedule, total] = await prisma.$transaction([
      prisma.examSchedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [filters.sortBy as string]: filters.sortOrder },
      }),

      prisma.examSchedule.count({ where }),
    ]);

    const response = {
      data: allExamSchedule,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    log.info(`Fetched exam schedule`);
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetAllExamSchedule",
      message: "Fetched all exam schedule",
      context,
      statusCode,
      metadata: {
        schoolId,
        moderatorId,
        filters,
      },
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch the exam schedule`, {
      ipAddress: context.ipAddress,
      error: err.message,
      schoolId,
      moderatorId,
    });
    throw err;
  }
}

export async function getExamScheduleForTeacherService(
  schoolId: string,
  teacherId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    classId?: string;
    examType?: ExamType;
    subjectId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: "date" | "createdAt";
    sortOrder?: "asc" | "desc";
  },
): Promise<{
  data: ExamSchedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch exam schedule for teacher`, {
      ipAddress: context.ipAddress,
      schoolId,
      teacherId,
    });

    const sortBy = filters?.sortBy ?? "date";
    const sortOrder = filters?.sortOrder ?? "asc";

    const cacheKey = CACHE_KEYS.teacherExamSchedule(
      schoolId,
      teacherId,
      filters?.classId || "ALL",
      filters?.examType || "ALL",
      filters?.subjectId || "ALL",
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      sortBy || "ALL",
      sortOrder || "ALL",
      page,
      limit,
    );

    const cached = await getCache<{
      data: ExamSchedule[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning teacher exam schedule from cache`, { cacheKey });
      return cached;
    }
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true },
    });

    const where: Prisma.ExamScheduleWhereInput = {
      schoolId,
      teacherId,
      academicYearId: activeAcademicYear!.id,
    };

    if (filters?.subjectId) where.subjectId = filters?.subjectId;
    if (filters?.classId) where.classId = filters?.classId;
    if (filters?.fromDate || filters?.toDate) {
      where.date = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }
    if (filters.examType) where.examType = filters.examType;

    const [teacherExamSchedule, total] = await prisma.$transaction([
      prisma.examSchedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [filters.sortBy as string]: filters.sortOrder },
      }),

      prisma.examSchedule.count({ where }),
    ]);

    const response = {
      data: teacherExamSchedule,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    log.info(`Fetched exam schedule for teacher`);
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetTeacherExamSchedule",
      message: "Fetched all exam schedule",
      context,
      statusCode,
      metadata: {
        schoolId,
        teacherId,
        filters,
      },
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch exam schedule for teacher`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        schoolId,
        teacherId,
      },
    );
    throw err;
  }
}

export async function getExamScheduleForStudentService(
  schoolId: string,
  studentId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    examType?: ExamType;
    fromDate?: string;
    toDate?: string;
    sortBy?: "date" | "createdAt";
    sortOrder?: "asc" | "desc";
  },
): Promise<{
  data: ExamSchedule[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch exam schedule for student`, {
      ipAddress: context.ipAddress,
      schoolId,
      studentId,
    });

    const sortBy = filters?.sortBy ?? "date";
    const sortOrder = filters?.sortOrder ?? "asc";

    const cacheKey = CACHE_KEYS.studentExamSchedule(
      schoolId,
      studentId,
      filters?.examType || "ALL",
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      sortBy,
      sortOrder,
    );

    const cached = await getCache<{
      data: ExamSchedule[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning student exam schedule from cahce", { cacheKey });
      return cached;
    }

    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true },
    });

    const where: Prisma.ExamScheduleWhereInput = {
      schoolId,
      academicYearId: activeAcademicYear!.id,
      class: { enrollments: { some: { studentId } } },
    };

    if (filters?.examType) where.examType = filters?.examType;
    if (filters?.fromDate || filters?.toDate) {
      where.date = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }

    if (!activeAcademicYear) {
      log.info("No active academic year found");
      throw new Error("No active academic year found");
    }

    const [studentExamSchedule, total] = await prisma.$transaction([
      prisma.examSchedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      }),

      prisma.examSchedule.count({ where }),
    ]);

    const response = {
      data: studentExamSchedule,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    log.info(`Fetched exam schedule for student`);
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetStudentExamSchedule",
      message: "Fetched all exam schedule",
      context,
      statusCode,
      metadata: {
        schoolId,
        studentId,
        filters,
      },
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch exam schedule for student`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        schoolId,
        studentId,
      },
    );
    throw err;
  }
}
