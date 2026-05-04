import { redis } from "@/src/config/redis.config";
import { createModuleLogger } from "@/src/config/logger.config";
import { DayOfWeek } from "@prisma/client";

const log = createModuleLogger("CacheService");
const DEFAULT_TTL = 60 * 5;

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
  teacherApplications: (status: string, page: number, limit: number) =>
    `teacher-applications:${status}:page:${page}:limit:${limit}`,
  teacherApplication: (applicationId: string) =>
    `teacher-application:${applicationId}`,
  admissionApplications: (status: string, page: number, limit: number) =>
    `admission-applications:${status}:page:${page}:limit:${limit}`,
  admissionApplication: (applicationId: string) =>
    `admission-application:${applicationId}`,
  subjects: (page: number, limit: number) =>
    `subjects:page:${page}:limit:${limit}`,
  subject: (subjectId: string) => `subject:${subjectId}`,
  teachers: (page: number, limit: number) =>
    `teachers:page:${page}:limit:${limit}`,
  teacher: (teacherId: string) => `teacher:${teacherId}`,
  timetable: (
    classId: string,
    dayOfWeek: DayOfWeek | "ALL",
    page: number,
    limit: number,
  ) => `class:${classId}:${dayOfWeek}:page:${page}:limit:${limit}`,
  studentAttendance: (
    classId: string,
    classTeacherId: string,
    page: number,
    limit: number,
  ) =>
    `class:${classId}:classTeacher:${classTeacherId}:page:${page}:limit:${limit}`,
  teacherAttendance: (
    page: number,
    limit: number,
    status: string,
    date: string,
  ) =>
    `teacher:attendance:page:${page}:limit:${limit}:status:${status}:date:${date}`,
  moderatorAttendance: (
    page: number,
    limit: number,
    status: string,
    date: string,
  ) =>
    `moderator:attendance:page:${page}:limit:${limit}:status:${status}:date:${date}`,
  allStudents: (
    page: number,
    limit: number,
    classId: string,
    academicYearId: string,
    status: string,
    gender: string,
  ) =>
    `students:page:${page}:limit:${limit}:class:${classId}:academicYear:${academicYearId}:status:${status}:gender:${gender}`,
  allExamSchedule: (
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
    `moderator:${moderatorId}:class:${classId}:academicYear:${academicYearId}:exam:${examType}:subject:${subjectId}:teacher:${teacherId}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}:page:${page}:limit:${limit}`,
  teacherExamSchedule: (
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
    `teacher:${teacherId}:subject:${subjectId}:class:${classId}:type:${examType}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}:page:${page}:limit:${limit}`,
  studentExamSchedule: (
    studentId: string,
    examType: string,
    fromDate: string,
    toDate: string,
    sortBy: string,
    sortOrder: string,
  ) =>
    `student:${studentId}:type:${examType}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}`,
  markForAdmin: (
    moderator: string,
    subjectId: string,
    studentId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `moderator:${moderator}:subject:${subjectId}:student:${studentId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  markForTeacher: (
    teacher: string,
    subjectId: string,
    studentId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `teacher:${teacher}:subject:${subjectId}:student:${studentId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  markForStudent: (
    studentId: string,
    subjectId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `student:${studentId}:subject:${subjectId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  studentLeaveRequest: (
    reviewerId: string,
    classId: string,
    page: number,
    limit: number,
    status: string,
    studentId: string,
  ) =>
    `reviewer:${reviewerId}:class:${classId}:status:${status}:student:${studentId}:page:${page}:limit:${limit}`,
  teacherLeaveRequest: (
    adminId: string,
    page: number,
    limit: number,
    status: string,
    teacherId: string,
  ) =>
    `admin:${adminId}:status:${status}:teacher:${teacherId}:page:${page}:limit:${limit}`,
  moderatorLeaveRequest: (
    adminId: string,
    page: number,
    limit: number,
    status: string,
    moderatorId: string,
  ) =>
    `admin:${adminId}:status:${status}:moderator:${moderatorId}:page:${page}:limit:${limit}`,
  myLeaveRequests: (
    requesterId: string,
    page: number,
    limit: number,
    status: string,
  ) => `requester:${requesterId}:status:${status}:page:${page}:limit:${limit}`,
  allHolidays: (
    page: number,
    limit: number,
    month: number | string,
    year: number | string,
  ) => `holidays:month:${month}:year:${year}:page:${page}:limit:${limit}`,
  userNotifications: (
    userId: string,
    isRead: string,
    type: string,
    channel: string,
    fromDate: string,
    toDate: string,
    page: number,
    limit: number,
    sortOrder: string,
  ) =>
    `user:${userId}:notifications:isRead:${isRead}:type:${type}:channel:${channel}:from:${fromDate}:to:${toDate}:page:${page}:limit:${limit}:sort:${sortOrder}`,
  announcements: () => `announcements`,
  adminAnnouncements: (
    moderatorId: string,
    targetRole: string,
    isActive: string,
    fromDate: string,
    toDate: string,
    sortBy: string,
    sortOrder: string,
    page: number,
    limit: number,
  ) =>
    `admin:${moderatorId}:announcements:role:${targetRole}:active:${isActive}:from:${fromDate}:to:${toDate}:sortBy:${sortBy}:sort:${sortOrder}:page:${page}:limit:${limit}`,
  roleAnnouncements: (
    role: string,
    fromDate: string,
    toDate: string,
    sortOrder: string,
    page: number,
    limit: number,
  ) =>
    `role:${role}:announcements:from:${fromDate}:to:${toDate}:sort:${sortOrder}:page:${page}:limit:${limit}`,
  announcementById: (announcementId: string) =>
    `announcement:${announcementId}`,
  userProfile: (userId: string) => `user:${userId}:profile`,
} as const;

export const CACHE_PATTERNS = {
  markForAdmin: (subjectId: string) => `moderator:*:subject:${subjectId}:*`,
  markForTeacher: (subjectId: string) => `teacher:*:subject:${subjectId}:*`,
  markForStudent: (studentId: string, subjectId: string) =>
    `student:${studentId}:subject:${subjectId}:*`,
};

export const CACHE_TTL = {
  ADMISSION_APPLICATIONS_LIST: 60 * 2,
  ADMISSION_APPLICATION_SINGLE: 60 * 5,
  TEACHER_APPLICATIONS_LIST: 60 * 2,
  TEACHER_APPLICATION_SINGLE: 60 * 5,
  ANNOUNCEMENTS_LIST: 60 * 1,
  ANNOUNCEMENT_DETAIL: 60 * 1,
  NOTIFICATIONS_LIST: 60 * 1,
  USER_PROFILE: 60 * 5,
} as const;
