import { redis } from "@/src/config/redis.config";
import { createModuleLogger } from "@/src/config/logger.config";
import { DayOfWeek, EnrollmentStatus, ExamType, Gender } from "@prisma/client";

const log = createModuleLogger("CacheService");

const DEFAULT_TTL = 60 * 5; // 5 minutes

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) {
      log.debug("Cache miss", { key });
      return null;
    }
    log.debug("Cache hit", { key });
    return JSON.parse(data) as T;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to get cache", { key, error: err.message });
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    log.debug("Cache set", { key, ttlSeconds });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to set cache", { key, error: err.message });
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    log.debug("Cache deleted", { key });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to delete cache", { key, error: err.message });
  }
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      log.debug("No cache keys found for pattern", { pattern });
      return;
    }
    await redis.del(...keys);
    log.debug("Cache deleted by pattern", {
      pattern,
      keysDeleted: keys.length,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to delete cache by pattern", {
      pattern,
      error: err.message,
    });
  }
}

export const CACHE_KEYS = {
  schoolApplications: (status: string, page: number, limit: number) =>
    `school-applications:${status}:page:${page}:limit:${limit}`,
  schoolApplication: (applicationId: string) =>
    `school-application:${applicationId}`,
  teacherApplications: (
    schoolId: string,
    status: string,
    page: number,
    limit: number,
  ) => `teacher-applications:${status}:page:${page}:limit:${limit}:${schoolId}`,
  teacherApplication: (applicationId: string, schoolId: string) =>
    `admission-application:${applicationId}:${schoolId}`,
  admissionApplications: (
    schoolId: string,
    status: string,
    page: number,
    limit: number,
  ) => `teacher-applications:${status}:page:${page}:limit:${limit}:${schoolId}`,
  admissionApplication: (applicationId: string, schoolId: string) =>
    `subject:${schoolId}`,
  schoolSubjects: (schoolId: string, page: number, limit: number) =>
    `subjects:page:${page}:limit:${limit}:${schoolId}`,
  schoolSubject: (subjectId: string, schoolId: string) => `subject:${schoolId}`,
  schoolTeachers: (schoolId: string, page: number, limit: number) =>
    `teachers:page:${page}:limit:${limit}:${schoolId}`,
  schoolTeacher: (teacherId: string, schoolId: string) => `teacher:${schoolId}`,
  timetable: (
    classId: string,
    schoolId: string,
    dayOfWeek: DayOfWeek | "ALL",
    page: number,
    limit: number,
  ) =>
    `class:${classId}:school:${schoolId}:${dayOfWeek}:page:${page}:limit:${limit}`,
  studentAttendance: (
    classId: string,
    classTeacherId: string,
    schoolId: string,
    page: number,
    limit: number,
  ) =>
    `class:${classId}:classTeacher:${classTeacherId}:page:${page}:limit:${limit}:school:${schoolId}`,
  teacherAttendance: (
    schoolId: string,
    page: number,
    limit: number,
    status: string,
    date: string,
  ) =>
    `teacher:attendance:school:${schoolId}:page:${page}:limit:${limit}:status:${status}:date:${date}`,
  moderatorAttendance: (
    schoolId: string,
    page: number,
    limit: number,
    status: string,
    date: string,
  ) =>
    `moderator:attendance:school:${schoolId}:page:${page}:limit:${limit}:status:${status}:date:${date}`,
  allStudents: (
    schoolId: string,
    page: number,
    limit: number,
    classId: string,
    academicYearId: string,
    status: string,
    gender: string,
  ) =>
    `school:${schoolId}:page:${page}:limit:${limit}:class:${classId}:academicYear:${academicYearId}:status:${status}:gender:${gender}`,
  allExamSchedule: (
    schoolId: string,
    moderatorId: string,
    classId: string,
    academicYearId: string,
    examType: string,
    subjectId: string,
    teacherId: string,
    fromDate: string,
    toDate: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
  ) =>
    `school:${schoolId}:page:${page}:limit:${limit}:moderator:${moderatorId}:classId:${classId}:academicYear:${academicYearId}:exam:${examType}:subject:${subjectId}:teacher:${teacherId}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}`,
  teacherExamSchedule: (
    schoolId: string,
    teacherId: string,
    classId: string,
    examType: string,
    subjectId: string,
    fromDate: string,
    toDate: string,
    sortBy: string,
    sortOrder: string,
    page: number,
    limit: number,
  ) =>
    `school"${schoolId}:teacher"${teacherId}:subject:${subjectId}:from:${fromDate}:to:${toDate}:class:${classId}:type:${examType}`,
  studentExamSchedule: (
    schoolId: string,
    studentId: string,
    examType: string,
    fromDate: string,
    toDate: string,
    sortBy: string,
    sortOrder: string,
  ) =>
    `school"${schoolId}:student"${studentId}:type:${examType}:from:${fromDate}:to:${toDate}`,
} as const;

export const CACHE_TTL = {
  SCHOOL_APPLICATIONS_LIST: 60 * 2,
  SCHOOL_APPLICATION_SINGLE: 60 * 5,
} as const;
