import { redis } from "@/src/config/redis.config";
import { createModuleLogger } from "@/src/config/logger.config";

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
    `admission-application:${applicationId}:${schoolId}`,
} as const;

export const CACHE_TTL = {
  SCHOOL_APPLICATIONS_LIST: 60 * 2,
  SCHOOL_APPLICATION_SINGLE: 60 * 5,
} as const;
