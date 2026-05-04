import { EmploymentStatus, Gender, Prisma, Teacher } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { prisma } from "../config/database.config";
import { createSystemLog } from "../utils/audit.util";

const log = createModuleLogger("TeacherService");

export async function getAllTeachersService(
  page: number = 1,
  limit: number = 10,
  context: AuditContext,
  statusCode: number,
  filters?: {
    status?: EmploymentStatus;
    gender?: Gender;
    city?: string;
    state?: string;
    qualification?: string;
    experience?: number;
  },
): Promise<{
  data: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch all teachers for school`, {
      ipAddress: context.ipAddress,
      page,
      limit,
      filters,
    });

    const where: Prisma.TeacherWhereInput = {};

    if (filters?.status) where.employmentStatus = filters.status;
    if (filters?.gender) where.gender = filters.gender;
    if (filters?.city) where.city = filters.city;
    if (filters?.state) where.state = filters.state;
    if (filters?.qualification) where.qualification = filters.qualification;
    if (filters?.experience !== undefined)
      where.experience = { gte: filters.experience };

    const cacheKey = CACHE_KEYS.teachers(page, limit);

    const cached = await getCache<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning cached teachers list`, { cacheKey });
      return cached;
    }

    const [allTeachers, total] = await prisma.$transaction([
      prisma.teacher.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      module: "GetAllTeachers",
      message: `Fetched all teachers for school`,
      context,
      statusCode,
      metadata: {
        filters,
        page,
        limit,
      },
    });

    const response = {
      data: allTeachers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Fetched all teachers for school`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch all teachers for school`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        page,
        limit,
        filters,
      },
    );
    throw err;
  }
}

export async function getSingleTeacherService(
  teacherId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Teacher> {
  try {
    log.info(`Starting service to fetch teacher with id ${teacherId}`, {
      ipAddress: context.ipAddress,
    });

    const teacherExists = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacherExists) {
      log.warn(`No teacher exists with id ${teacherId}`);
      throw new Error(`No teacher exists with id ${teacherId}`);
    }

    await createSystemLog({
      level: "INFO",
      module: "GetSingleTeacher",
      message: `Fetched teacher with id ${teacherId}`,
      context,
      statusCode,
      metadata: {
        teacherId,
      },
    });

    log.info(`Fetched teacher with id ${teacherId}`);

    return teacherExists;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch teacher with id ${teacherId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
      },
    );
    throw err;
  }
}
