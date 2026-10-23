import {
  AdminAttendance,
  AttendanceStatus,
  EnrollmentStatus,
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
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";
import { assertAttendanceAllowed, toDateOnly } from "../utils/school-day.util";

const log = createModuleLogger("AttendanceModule");

const ATTENDANCE_CACHE_PATTERNS = {
  student: "attendance:student:*",
  teacher: "attendance:teacher:*",
  moderator: "attendance:moderator:*",
} as const;

interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AttendanceFilters {
  status?: AttendanceStatus;
  date?: string;
}

const summarize = (rows: { status: AttendanceStatus }[]): AttendanceSummary => {
  const count = (status: AttendanceStatus) =>
    rows.filter((row) => row.status === status).length;
  return {
    totalPresent: count(AttendanceStatus.PRESENT),
    totalAbsent: count(AttendanceStatus.ABSENT),
    totalLate: count(AttendanceStatus.LATE),
    totalExcused: count(AttendanceStatus.EXCUSED),
  };
};

const assertNoDuplicates = (ids: string[], label: string): void => {
  if (new Set(ids).size !== ids.length) {
    throw new Error(
      `The same ${label} appears more than once in this attendance list`,
    );
  }
};

async function clearAttendanceCaches(
  kind: keyof typeof ATTENDANCE_CACHE_PATTERNS,
): Promise<void> {
  await Promise.all([
    deleteCacheByPattern(ATTENDANCE_CACHE_PATTERNS[kind]),
    deleteCacheByPattern("dashboard:overview:*"),
    deleteCacheByPattern("user:*:today:*"),
  ]);
}

const emptyPage = <T>(page: number, limit: number): Paginated<T> => ({
  data: [],
  total: 0,
  page,
  limit,
  totalPages: 0,
});

export async function markStudentAttendanceService(
  classId: string,
  data: StudentAttendanceInput,
  classTeacherId: string,
  context: AuditContext,
  statusCode: number,
): Promise<AttendanceSummary> {
  try {
    log.info(`Starting service to mark attendance of class ${classId}`, {
      ipAddress: context.ipAddress,
      classId,
      classTeacherId,
      date: data.date,
    });

    const attendanceDate = await assertAttendanceAllowed(data.date);

    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, section: true, academicYearId: true },
    });
    if (!classExists) {
      log.warn(`There is no class with id ${classId}`);
      throw new Error(`There is no class with id ${classId}`);
    }

    const classTeacherExists = await prisma.classTeacher.findFirst({
      where: { teacherId: classTeacherId, classId },
      select: { id: true },
    });
    if (!classTeacherExists) {
      log.warn(
        "Attendance attempted by a teacher who is not the class teacher",
        { classId, classTeacherId },
      );
      throw new Error("Unauthorized to mark the attendance");
    }

    const studentIds = data.attendance.map((entry) => entry.studentId);
    assertNoDuplicates(studentIds, "student");

    const enrolledCount = await prisma.enrollment.count({
      where: {
        classId,
        academicYearId: classExists.academicYearId,
        status: EnrollmentStatus.ACTIVE,
        studentId: { in: studentIds },
      },
    });
    if (enrolledCount !== studentIds.length) {
      log.warn("Some students are not actively enrolled in this class", {
        classId,
        submitted: studentIds.length,
        enrolled: enrolledCount,
      });
      throw new Error(
        "One or more students are not actively enrolled in this class",
      );
    }

    const alreadyMarked = await prisma.studentAttendance.findFirst({
      where: { classId, date: attendanceDate },
      select: { id: true },
    });
    if (alreadyMarked) {
      log.warn(`Attendance already marked for ${data.date}`, { classId });
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const created = await prisma.studentAttendance.createManyAndReturn({
      data: data.attendance.map((entry) => ({
        studentId: entry.studentId,
        status: entry.status,
        classId,
        date: attendanceDate,
        markedBy: classTeacherId,
      })),
      skipDuplicates: true,
    });

    const summary = summarize(created);
    await clearAttendanceCaches("student");

    await createSystemLog({
      level: "INFO",
      module: "StudentAttendance",
      message: "Attendance marked for students",
      context,
      statusCode,
      metadata: { classId, classTeacherId, date: data.date, ...summary },
    });

    await createAuditLog({
      performedById: classTeacherId,
      action: "CREATE",
      module: "StudentAttendance",
      resourceId: classId,
      resourceType: "StudentAttendance",
      newValues: { date: data.date, records: created.length, ...summary },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Attendance marked for all students successfully", {
      classId,
      records: created.length,
    });
    return summary;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to mark student attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
      classTeacherId,
      classId,
    });
    throw err;
  }
}

export async function markTeacherAttendanceService(
  data: TeacherAttendanceInput,
  context: AuditContext,
  moderatorId: string,
  statusCode: number,
): Promise<AttendanceSummary> {
  try {
    log.info("Starting service to mark teacher attendance", {
      ipAddress: context.ipAddress,
      moderatorId,
      date: data.date,
    });

    const attendanceDate = await assertAttendanceAllowed(data.date);

    const teacherIds = data.attendance.map((entry) => entry.teacherId);
    assertNoDuplicates(teacherIds, "teacher");

    const teachersExist = await prisma.teacher.count({
      where: { id: { in: teacherIds } },
    });
    if (teachersExist !== teacherIds.length) {
      log.warn("One or more teachers do not exist", {
        submitted: teacherIds.length,
        found: teachersExist,
      });
      throw new Error("One or more teachers do not belong to this school");
    }

    const isAlreadyMarked = await prisma.teacherAttendance.findFirst({
      where: { date: attendanceDate, teacherId: { in: teacherIds } },
      select: { id: true },
    });
    if (isAlreadyMarked) {
      log.warn(`Teacher attendance already marked for ${data.date}`);
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const created = await prisma.teacherAttendance.createManyAndReturn({
      data: data.attendance.map((entry) => ({
        status: entry.status,
        teacherId: entry.teacherId,
        date: attendanceDate,
        markedBy: moderatorId,
      })),
      skipDuplicates: true,
    });

    const summary = summarize(created);
    await clearAttendanceCaches("teacher");

    await createSystemLog({
      level: "INFO",
      module: "TeacherAttendance",
      message: "Teacher attendance marked successfully",
      context,
      statusCode,
      metadata: { date: data.date, ...summary },
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "CREATE",
      module: "TeacherAttendance",
      resourceId: data.date,
      resourceType: "TeacherAttendance",
      newValues: { date: data.date, records: created.length, ...summary },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Attendance marked for all the teachers", {
      records: created.length,
    });
    return summary;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to mark teacher attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
    });
    throw err;
  }
}

export async function markModeratorAttendanceService(
  data: ModeratorAttendanceInput,
  context: AuditContext,
  statusCode: number,
  adminId: string,
): Promise<AttendanceSummary> {
  try {
    log.info("Starting service to mark attendance for moderators", {
      ipAddress: context.ipAddress,
      adminId,
      date: data.date,
    });

    const attendanceDate = await assertAttendanceAllowed(data.date);

    const moderatorIds = data.attendance.map((entry) => entry.moderatorId);
    assertNoDuplicates(moderatorIds, "moderator");

    const moderatorsExist = await prisma.admin.count({
      where: { id: { in: moderatorIds } },
    });
    if (moderatorsExist !== moderatorIds.length) {
      log.warn("One or more moderators do not exist", {
        submitted: moderatorIds.length,
        found: moderatorsExist,
      });
      throw new Error("One or more moderators do not belong to this school");
    }

    const isAlreadyMarked = await prisma.adminAttendance.findFirst({
      where: { date: attendanceDate, adminId: { in: moderatorIds } },
      select: { id: true },
    });
    if (isAlreadyMarked) {
      log.warn(`Moderator attendance already marked for ${data.date}`);
      throw new Error(`Attendance already marked for ${data.date}`);
    }

    const created = await prisma.adminAttendance.createManyAndReturn({
      data: data.attendance.map((entry) => ({
        status: entry.status,
        adminId: entry.moderatorId,
        date: attendanceDate,
        markedBy: adminId,
      })),
      skipDuplicates: true,
    });

    const summary = summarize(created);
    await clearAttendanceCaches("moderator");

    await createSystemLog({
      level: "INFO",
      module: "ModeratorAttendance",
      message: "Moderator attendance marked successfully",
      context,
      statusCode,
      metadata: { date: data.date, ...summary },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "ModeratorAttendance",
      resourceId: data.date,
      resourceType: "AdminAttendance",
      newValues: { date: data.date, records: created.length, ...summary },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Attendance marked for all the moderators", {
      records: created.length,
    });
    return summary;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to mark moderator attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
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
  page: number = 1,
  limit: number = 10,
  filters?: AttendanceFilters,
): Promise<Paginated<StudentAttendance>> {
  try {
    log.info(
      `Starting service to fetch students attendance of class ${classId}`,
      {
        classTeacherId,
        filters,
      },
    );

    const cacheKey = `${CACHE_KEYS.studentAttendance(classId, classTeacherId, page, limit)}:status:${filters?.status ?? "ALL"}:date:${filters?.date ?? "ALL"}`;
    const cached = await getCache<Paginated<StudentAttendance>>(cacheKey);
    if (cached) {
      log.info("Returning students attendance from cache", { cacheKey });
      return cached;
    }

    const [classExists, isClassTeacher] = await prisma.$transaction([
      prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true },
      }),
      prisma.classTeacher.findFirst({
        where: { teacherId: classTeacherId, classId },
        select: { id: true },
      }),
    ]);
    if (!classExists) {
      log.warn(`Class does not exist with classId ${classId}`);
      throw new Error(`Class does not exist with classId ${classId}`);
    }
    if (!isClassTeacher) {
      log.warn(
        "Attendance read attempted by a teacher who is not the class teacher",
        { classId, classTeacherId },
      );
      throw new Error(
        "You are not authorized as you are not the class teacher of this class",
      );
    }

    const where: Prisma.StudentAttendanceWhereInput = { classId };
    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = toDateOnly(filters.date);

    const [studentAttendance, total] = await prisma.$transaction([
      prisma.studentAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.studentAttendance.count({ where }),
    ]);

    const response: Paginated<StudentAttendance> =
      total === 0
        ? emptyPage(page, limit)
        : {
            data: studentAttendance,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };

    await setCache(cacheKey, response, CACHE_TTL.ATTENDANCE_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetAllStudentsAttendance",
      message: "Fetched attendance of all students",
      context,
      statusCode,
      metadata: { classId, classTeacherId, filters, total },
    });

    log.info(`Fetched attendance of students of class ${classExists.name}`, {
      total,
    });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch attendance of the class", {
      error: err.message,
      ipAddress: context.ipAddress,
      classId,
      classTeacherId,
    });
    throw err;
  }
}

export async function getTeachersAttendanceService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters?: AttendanceFilters,
): Promise<Paginated<TeacherAttendance>> {
  try {
    log.info("Starting service to get all teachers attendance", {
      ipAddress: context.ipAddress,
      filters,
    });

    const cacheKey = CACHE_KEYS.teacherAttendance(
      page,
      limit,
      filters?.status ?? "ALL",
      filters?.date ?? "ALL",
    );
    const cached = await getCache<Paginated<TeacherAttendance>>(cacheKey);
    if (cached) {
      log.info("Returning teachers attendance from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.TeacherAttendanceWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = toDateOnly(filters.date);

    const [teacherAttendance, total] = await prisma.$transaction([
      prisma.teacherAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.teacherAttendance.count({ where }),
    ]);

    const response: Paginated<TeacherAttendance> =
      total === 0
        ? emptyPage(page, limit)
        : {
            data: teacherAttendance,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };

    await setCache(cacheKey, response, CACHE_TTL.ATTENDANCE_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetAllTeachersAttendance",
      message: "Fetched attendance of all teachers",
      context,
      statusCode,
      metadata: { filters, total },
    });

    log.info("Fetched attendance of teachers", { total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch all teachers attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getAdminsAttendanceService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters?: AttendanceFilters,
): Promise<Paginated<AdminAttendance>> {
  try {
    log.info("Starting service to get all moderators attendance", {
      ipAddress: context.ipAddress,
      filters,
    });

    const cacheKey = CACHE_KEYS.moderatorAttendance(
      page,
      limit,
      filters?.status ?? "ALL",
      filters?.date ?? "ALL",
    );
    const cached = await getCache<Paginated<AdminAttendance>>(cacheKey);
    if (cached) {
      log.info("Returning moderators attendance from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.AdminAttendanceWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.date) where.date = toDateOnly(filters.date);

    const [moderatorAttendance, total] = await prisma.$transaction([
      prisma.adminAttendance.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.adminAttendance.count({ where }),
    ]);

    const response: Paginated<AdminAttendance> =
      total === 0
        ? emptyPage(page, limit)
        : {
            data: moderatorAttendance,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };

    await setCache(cacheKey, response, CACHE_TTL.ATTENDANCE_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetAllAdminsAttendance",
      message: "Fetched attendance of all admins",
      context,
      statusCode,
      metadata: { filters, total },
    });

    log.info("Fetched attendance of admins", { total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch all admins attendance", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
