import { redis } from "@/src/config/redis.config";
import { createModuleLogger } from "@/src/config/logger.config";
import { DayOfWeek } from "@prisma/client";

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
    `teacher-application:${applicationId}:${schoolId}`,
  admissionApplications: (
    schoolId: string,
    status: string,
    page: number,
    limit: number,
  ) =>
    `admission-applications:${status}:page:${page}:limit:${limit}:${schoolId}`,
  admissionApplication: (applicationId: string, schoolId: string) =>
    `admission-application:${applicationId}:${schoolId}`,
  schoolSubjects: (schoolId: string, page: number, limit: number) =>
    `subjects:page:${page}:limit:${limit}:${schoolId}`,
  schoolSubject: (subjectId: string, schoolId: string) =>
    `subject:${subjectId}:${schoolId}`,
  schoolTeachers: (schoolId: string, page: number, limit: number) =>
    `teachers:page:${page}:limit:${limit}:${schoolId}`,
  schoolTeacher: (teacherId: string, schoolId: string) =>
    `teacher:${teacherId}:${schoolId}`,
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
    `school:${schoolId}:moderator:${moderatorId}:class:${classId}:academicYear:${academicYearId}:exam:${examType}:subject:${subjectId}:teacher:${teacherId}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}:page:${page}:limit:${limit}`,
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
    `school:${schoolId}:teacher:${teacherId}:subject:${subjectId}:class:${classId}:type:${examType}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}:page:${page}:limit:${limit}`,
  studentExamSchedule: (
    schoolId: string,
    studentId: string,
    examType: string,
    fromDate: string,
    toDate: string,
    sortBy: string,
    sortOrder: string,
  ) =>
    `school:${schoolId}:student:${studentId}:type:${examType}:from:${fromDate}:to:${toDate}:sort:${sortBy}:order:${sortOrder}`,
  markForAdmin: (
    schoolId: string,
    moderator: string,
    subjectId: string,
    studentId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `school:${schoolId}:moderator:${moderator}:subject:${subjectId}:student:${studentId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  markForTeacher: (
    schoolId: string,
    teacher: string,
    subjectId: string,
    studentId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `school:${schoolId}:teacher:${teacher}:subject:${subjectId}:student:${studentId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  markForStudent: (
    schoolId: string,
    studentId: string,
    subjectId: string,
    examScheduleId: string,
    grade: string,
    isAbsent: string,
    page: number,
    limit: number,
  ) =>
    `school:${schoolId}:student:${studentId}:subject:${subjectId}:exam:${examScheduleId}:grade:${grade}:absent:${isAbsent}:page:${page}:limit:${limit}`,
  studentLeaveRequest: (
    schoolId: string,
    reviewerId: string,
    classId: string,
    page: number,
    limit: number,
    status: string,
    studentId: string,
  ) =>
    `school:${schoolId}:reviewer:${reviewerId}:class:${classId}:status:${status}:student:${studentId}:page:${page}:limit:${limit}`,
  teacherLeaveRequest: (
    schoolId: string,
    adminId: string,
    page: number,
    limit: number,
    status: string,
    teacherId: string,
  ) =>
    `school:${schoolId}:admin:${adminId}:status:${status}:teacher:${teacherId}:page:${page}:limit:${limit}`,
  moderatorLeaveRequest: (
    schoolId: string,
    adminId: string,
    page: number,
    limit: number,
    status: string,
    moderatorId: string,
  ) =>
    `school:${schoolId}:admin:${adminId}:status:${status}:moderator:${moderatorId}:page:${page}:limit:${limit}`,
  myLeaveRequests: (
    schoolId: string,
    requesterId: string,
    page: number,
    limit: number,
    status: string,
  ) =>
    `school:${schoolId}:requester:${requesterId}:status:${status}:page:${page}:limit:${limit}`,
  allHolidays: (
    schoolId: string,
    page: number,
    limit: number,
    month: number | string,
    year: number | string,
  ) =>
    `school:${schoolId}:holidays:month:${month}:year:${year}:page:${page}:limit:${limit}`,
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

  schoolAnnouncements: (schoolId: string) => `school:${schoolId}:announcements`,

  adminAnnouncements: (
    schoolId: string,
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
    `school:${schoolId}:admin:${moderatorId}:announcements:role:${targetRole}:active:${isActive}:from:${fromDate}:to:${toDate}:sortBy:${sortBy}:sort:${sortOrder}:page:${page}:limit:${limit}`,

  roleAnnouncements: (
    schoolId: string,
    role: string,
    fromDate: string,
    toDate: string,
    sortOrder: string,
    page: number,
    limit: number,
  ) =>
    `school:${schoolId}:role:${role}:announcements:from:${fromDate}:to:${toDate}:sort:${sortOrder}:page:${page}:limit:${limit}`,

  announcementById: (announcementId: string) =>
    `announcement:${announcementId}`,
  userProfile: (userId: string) => `user:${userId}:profile`,
} as const;

export const CACHE_PATTERNS = {
  markForAdmin: (schoolId: string, subjectId: string) =>
    `school:${schoolId}:moderator:*:subject:${subjectId}:*`,
  markForTeacher: (schoolId: string, subjectId: string) =>
    `school:${schoolId}:teacher:*:subject:${subjectId}:*`,
  markForStudent: (schoolId: string, studentId: string, subjectId: string) =>
    `school:${schoolId}:student:${studentId}:subject:${subjectId}:*`,
};

export const CACHE_TTL = {
  SCHOOL_APPLICATIONS_LIST: 60 * 2,
  SCHOOL_APPLICATION_SINGLE: 60 * 5,
  ANNOUNCEMENTS_LIST: 60 * 1,
  ANNOUNCEMENT_DETAIL: 60 * 1,
  NOTIFICATIONS_LIST: 60 * 1,
  USER_PROFILE: 60 * 5,
} as const;
