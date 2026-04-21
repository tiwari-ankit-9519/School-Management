import {
  AdminAttendance,
  AttendanceStatus,
  Prisma,
  StudentAttendance,
  TeacherAttendance,
} from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  ModeratorAttendanceInput,
  StudentAttendanceInput,
  TeacherAttendanceInput,
} from "../validations/input.validations";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";

const log = createModuleLogger("AttendanceModule");

export async function markStudentAttendanceService(
  classId: string,
  schoolId: string,
  data: StudentAttendanceInput,
  classTeacherId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}> {
  try {
    log.info(
      `Starting service to mark attendance of the class with id ${classId}`,
      {
        ipAddress: context.ipAddress,
        schoolId,
        classId,
        classTeacherId,
      },
    );

    const classExists = await prisma.class.findUnique({
      where: { id: classId, schoolId },
    });

    if (!classExists) {
      log.warn(`There is no class with id ${classId}`);
      throw new Error(`There is no class with id ${classId}`);
    }

    const classTeacherExists = await prisma.classTeacher.findFirst({
      where: { teacherId: classTeacherId, classId },
    });

    if (!classTeacherExists) {
      log.warn(
        `You are not authorized to mark the attendance of the class ${classExists.name} as you are not the class teacher`,
      );
      throw new Error(`Unauthorized to mark the attendance`);
    }

    const isHoliday = await prisma.holiday.findFirst({
      where: { date: new Date(data.date), schoolId },
    });

    if (isHoliday) {
      log.warn(`Cannot mark attendance on holiday: ${isHoliday.name}`);
      throw new Error(`Cannot mark attendance on holiday: ${isHoliday.name}`);
    }

    const alreadyMarked = await prisma.studentAttendance.findFirst({
      where: { classId, date: new Date(data.date) },
    });
    if (alreadyMarked) {
      log.warn(`Attendance already marked for ${data.date}`);
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const response = await prisma.$transaction(async (tx) => {
      const classAttendance = await tx.studentAttendance.createManyAndReturn({
        data: data.attendance.map((entry) => ({
          studentId: entry.studentId,
          status: entry.status,
          classId,
          date: new Date(data.date),
          markedBy: classTeacherId,
        })),
        skipDuplicates: true,
      });

      const summary = classAttendance.reduce(
        (acc, entry) => {
          acc[entry.status] = (acc[entry.status] || 0) + 1;
          return acc;
        },
        {} as Record<AttendanceStatus, number>,
      );

      return { classAttendance, summary } as {
        classAttendance: typeof classAttendance;
        summary: Record<AttendanceStatus, number>;
      };
    });

    await createSystemLog({
      level: "INFO",
      module: "StudentAttendance",
      message: "Attendance marked for students",
      context,
      statusCode,
      metadata: {
        classId,
        classTeacherId,
        schoolId,
        totalPresent: response.summary["PRESENT"] || 0,
        totalAbsent: response.summary["ABSENT"] || 0,
        totalLate: response.summary["LATE"] || 0,
        totalExcused: response.summary["EXCUSED"] || 0,
      },
    });

    await createAuditLog({
      schoolId,
      performedById: classTeacherId,
      action: "CREATE",
      module: "StudentAttendance",
      resourceId: response.classAttendance[0]?.id ?? classId,
      resourceType: "StudentAttendance",
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info(`Attendance marked for all students successfully`);

    return {
      totalPresent: response.summary["PRESENT"] || 0,
      totalAbsent: response.summary["ABSENT"] || 0,
      totalLate: response.summary["LATE"] || 0,
      totalExcused: response.summary["EXCUSED"] || 0,
    };
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to mark attendance`, {
      error: err.message,
      ipAddress: context.ipAddress,
      classTeacherId,
      classId,
    });
    throw err;
  }
}

export async function markTeacherAttendanceService(
  schoolId: string,
  data: TeacherAttendanceInput,
  context: AuditContext,
  moderatorId: string,
  statusCode: number,
): Promise<{
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}> {
  try {
    log.info(`Starting service to mark teacher attendance`, {
      ipAddress: context.ipAddress,
      schoolId,
      moderatorId,
    });

    const teacherIds = data.attendance.map((entry) => entry.teacherId);
    const teachersExist = await prisma.teacher.count({
      where: {
        id: { in: teacherIds },
        user: { schoolId },
      },
    });
    if (teachersExist !== teacherIds.length) {
      log.warn("One or more teachers do not belong to this school");
      throw new Error("One or more teachers do not belong to this school");
    }

    const isHoliday = await prisma.holiday.findFirst({
      where: { date: new Date(data.date), schoolId },
    });

    if (isHoliday) {
      log.warn(`Cannot mark attendance on holiday: ${isHoliday.name}`);
      throw new Error(`Cannot mark attendance on holiday: ${isHoliday.name}`);
    }

    const isAlreadyMarked = await prisma.teacherAttendance.findFirst({
      where: {
        date: new Date(data.date),
        teacherId: { in: data.attendance.map((entry) => entry.teacherId) },
      },
    });

    if (isAlreadyMarked) {
      log.warn(`Attendance already marked for ${data.date}`);
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const response = await prisma.$transaction(async (tx) => {
      const teacherAttendanceMarked =
        await tx.teacherAttendance.createManyAndReturn({
          data: data.attendance.map((entry) => ({
            status: entry.status,
            teacherId: entry.teacherId,
            date: new Date(data.date),
            markedBy: moderatorId,
          })),
          skipDuplicates: true,
        });

      const summary = teacherAttendanceMarked.reduce(
        (acc, entry) => {
          acc[entry.status] = (acc[entry.status] || 0) + 1;
          return acc;
        },
        {} as Record<AttendanceStatus, number>,
      );

      return { teacherAttendanceMarked, summary } as {
        teacherAttendanceMarked: typeof teacherAttendanceMarked;
        summary: Record<AttendanceStatus, number>;
      };
    });

    await createSystemLog({
      level: "INFO",
      module: "TeacherAttendance",
      message: "Teacher attendance marked successfully",
      context,
      statusCode,
      metadata: {
        schoolId,
        totalPresent: response.summary["PRESENT"] || 0,
        totalAbsent: response.summary["ABSENT"] || 0,
        totalLate: response.summary["LATE"] || 0,
        totalExcused: response.summary["EXCUSED"] || 0,
      },
    });

    await createAuditLog({
      performedById: moderatorId,
      schoolId,
      action: "CREATE",
      module: "TeacherAttendance",
      resourceId: response.teacherAttendanceMarked[0]?.id ?? schoolId,
      resourceType: "TeacherAttendance",
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info(`Attendance marked for all the teachers`);

    return {
      totalPresent: response.summary["PRESENT"] || 0,
      totalAbsent: response.summary["ABSENT"] || 0,
      totalLate: response.summary["LATE"] || 0,
      totalExcused: response.summary["EXCUSED"] || 0,
    };
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to mark teacher attendance`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      moderatorId,
    });
    throw err;
  }
}

export async function markModeratorAttendanceService(
  schoolId: string,
  data: ModeratorAttendanceInput,
  context: AuditContext,
  statusCode: number,
  adminId: string,
): Promise<{
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}> {
  try {
    log.info(`Starting service to mark attendance for moderators`, {
      ipAddress: context.ipAddress,
      schoolId,
      adminId,
    });

    const moderatorIds = data.attendance.map((entry) => entry.moderatorId);
    const moderatorExists = await prisma.adminAttendance.count({
      where: {
        id: { in: moderatorIds },
        user: { schoolId },
      },
    });

    if (moderatorExists !== moderatorIds.length) {
      log.warn("One or more moderators do not belong to this school");
      throw new Error("One or more moderators do not belong to this school");
    }

    const isHoliday = await prisma.holiday.findFirst({
      where: { date: new Date(data.date), schoolId },
    });

    if (isHoliday) {
      log.warn(`Cannot mark attendance on holiday: ${isHoliday.name}`);
      throw new Error(`Cannot mark attendance on holiday: ${isHoliday.name}`);
    }

    const isAlreadyMarked = await prisma.adminAttendance.findFirst({
      where: {
        date: new Date(data.date),
        teacherId: { in: data.attendance.map((entry) => entry.moderatorId) },
      },
    });

    if (isAlreadyMarked) {
      log.warn(`Attendance already marked for ${data.date}`);
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const response = await prisma.$transaction(async (tx) => {
      const moderatorAttendanceMarked =
        await tx.teacherAttendance.createManyAndReturn({
          data: data.attendance.map((entry) => ({
            status: entry.status,
            teacherId: entry.moderatorId,
            date: new Date(data.date),
            markedBy: adminId,
          })),
          skipDuplicates: true,
        });

      const summary = moderatorAttendanceMarked.reduce(
        (acc, entry) => {
          acc[entry.status] = (acc[entry.status] || 0) + 1;
          return acc;
        },
        {} as Record<AttendanceStatus, number>,
      );

      return { moderatorAttendanceMarked, summary } as {
        moderatorAttendanceMarked: typeof moderatorAttendanceMarked;
        summary: Record<AttendanceStatus, number>;
      };
    });

    await createSystemLog({
      level: "INFO",
      module: "ModeratorAttendance",
      message: "Moderator attendance marked successfully",
      context,
      statusCode,
      metadata: {
        schoolId,
        totalPresent: response.summary["PRESENT"] || 0,
        totalAbsent: response.summary["ABSENT"] || 0,
        totalLate: response.summary["LATE"] || 0,
        totalExcused: response.summary["EXCUSED"] || 0,
      },
    });

    await createAuditLog({
      performedById: adminId,
      schoolId,
      action: "CREATE",
      module: "TeacherAttendance",
      resourceId: response.moderatorAttendanceMarked[0]?.id ?? schoolId,
      resourceType: "TeacherAttendance",
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info(`Attendance marked for all the moderators`);

    return {
      totalPresent: response.summary["PRESENT"] || 0,
      totalAbsent: response.summary["ABSENT"] || 0,
      totalLate: response.summary["LATE"] || 0,
      totalExcused: response.summary["EXCUSED"] || 0,
    };
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to mark moderator attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      adminId,
    });
    throw err;
  }
}

export async function getStudentAttendanceService(
  classId: string,
  classTeacherId: string,
  context: AuditContext,
  statusCode: number,
  schoolId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: AttendanceStatus;
    date?: string;
  },
): Promise<{
  data: StudentAttendance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(
      `Starting service to fetch students attendance of class ${classId}`,
      {
        schoolId,
        classTeacherId,
        filters,
      },
    );
    const cacheKey = CACHE_KEYS.studentAttendance(
      classId,
      classTeacherId,
      schoolId,
      page,
      limit,
    );
    const cached = await getCache<{
      data: StudentAttendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info(`Returning students attendance from cache`, { cacheKey });
      return cached;
    }
    const [classExists, isClassTeacher] = await prisma.$transaction([
      prisma.class.findUnique({
        where: { id: classId, schoolId },
      }),
      prisma.classTeacher.findFirst({
        where: { teacherId: classTeacherId, classId },
      }),
    ]);
    if (!classExists) {
      log.warn(`Class does not exists with classId ${classId}`);
      throw new Error(`Class does not exists with classId ${classId}`);
    }
    if (!isClassTeacher) {
      log.warn(
        `You are not authorized as you are not the class teacher of class with id ${classId}`,
      );
      throw new Error(
        `You are not authorized as you are not the class teacher of class with id ${classId}`,
      );
    }
    const where: Prisma.StudentAttendanceWhereInput = { classId };
    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = new Date(filters.date);
    const [studentAttendance, total] = await prisma.$transaction([
      prisma.studentAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.studentAttendance.count({ where }),
    ]);
    if (studentAttendance.length === 0) {
      log.warn(`No attendance found for class ${classId}`);
      throw new Error(`No attendance found for class ${classId}`);
    }
    await createSystemLog({
      level: "INFO",
      module: "GetAllStudentsAttendance",
      message: "Fetched attendance of all students",
      context,
      statusCode,
      metadata: {
        classId,
        classTeacherId,
        schoolId,
        filters,
      },
    });
    const response = {
      data: studentAttendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);
    log.info(`Fetched attendance of students of class ${classExists.name}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      "Internal Server Error. Failed to fetch attendance of the class",
      {
        error: err.message,
        ipAddress: context.ipAddress,
        schoolId,
        classId,
        classTeacherId,
      },
    );
    throw err;
  }
}

export async function getTeachersAttendanceService(
  context: AuditContext,
  statusCode: number,
  schoolId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: AttendanceStatus;
    date?: string;
  },
): Promise<{
  data: TeacherAttendance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Starting service to get all teachers attendance", {
      ipAddress: context.ipAddress,
      schoolId,
      filters,
    });

    const cacheKey = CACHE_KEYS.teacherAttendance(
      schoolId,
      page,
      limit,
      filters?.status ?? "ALL",
      filters?.date ?? "ALL",
    );

    const cached = await getCache<{
      data: TeacherAttendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning teachers attendance from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.TeacherAttendanceWhereInput = {
      teacher: {
        user: {
          schoolId,
        },
      },
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = new Date(filters.date);

    const [teacherAttendance, total] = await prisma.$transaction([
      prisma.teacherAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.teacherAttendance.count({ where }),
    ]);

    if (teacherAttendance.length === 0) {
      log.warn(`No attendance found for teacher of ${schoolId}`);
      throw new Error(`No attendance found for teacher of ${schoolId}`);
    }

    await createSystemLog({
      level: "INFO",
      module: "GetAllTeachersAttendance",
      message: "Fetched attendance of all teachers",
      context,
      statusCode,
      metadata: {
        schoolId,
        filters,
      },
    });
    const response = {
      data: teacherAttendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);
    log.info(`Fetched attendance of teachers for school with id ${schoolId}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      "Internal Server Error. Failed to fetch all teachers attendance",
      {
        error: err.message,
        ipAddress: context.ipAddress,
        schoolId,
      },
    );
    throw err;
  }
}

export async function getAdminsAttendanceService(
  context: AuditContext,
  statusCode: number,
  schoolId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: AttendanceStatus;
    date?: string;
  },
): Promise<{
  data: AdminAttendance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info("Starting service to get all moderators attendance", {
      ipAddress: context.ipAddress,
      schoolId,
      filters,
    });

    const cacheKey = CACHE_KEYS.moderatorAttendance(
      schoolId,
      page,
      limit,
      filters?.status ?? "ALL",
      filters?.date ?? "ALL",
    );

    const cached = await getCache<{
      data: AdminAttendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning moderators attendance from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.AdminAttendanceWhereInput = {
      admin: {
        user: {
          schoolId,
        },
      },
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = new Date(filters.date);

    const [moderatorAttendance, total] = await prisma.$transaction([
      prisma.adminAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.adminAttendance.count({ where }),
    ]);

    if (moderatorAttendance.length === 0) {
      log.warn(`No attendance found for admins of ${schoolId}`);
      throw new Error(`No attendance found for admins of ${schoolId}`);
    }

    await createSystemLog({
      level: "INFO",
      module: "GetAllAdminsAttendance",
      message: "Fetched attendance of all admins",
      context,
      statusCode,
      metadata: {
        schoolId,
        filters,
      },
    });
    const response = {
      data: moderatorAttendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);
    log.info(`Fetched attendance of admins for school with id ${schoolId}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to fetch all admins attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
    });
    throw err;
  }
}
