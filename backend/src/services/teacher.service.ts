import { EmploymentStatus, Gender, Prisma, Teacher } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { prisma } from "../config/database.config";
import { createSystemLog } from "../utils/audit.util";
import { TeacherListPayload } from "../types/response-type";
import { TeacherApplicationStatusResponse } from "../validations/input.validations";

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
  data: TeacherListPayload[];
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

    const cacheKey = CACHE_KEYS.teachers(page, limit, filters);

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
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          gender: true,
          city: true,
          state: true,
          qualification: true,
          experience: true,
          specialization: true,
          employmentStatus: true,
          joiningDate: true,
          createdAt: true,
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
      include: {
        subjects: true,
        timetables: true,
        classTeachers: true,
        attendances: true,
        leaveRequests: true,
        examSchedules: true,
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

export async function getTeacherApplicationStatusService(
  applicationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<TeacherApplicationStatusResponse> {
  try {
    log.info(
      `Starting service to fetch teacher application status for applicationId ${applicationId}`,
      {
        applicationId,
        ipAddress: context.ipAddress,
      },
    );
    const cacheKey = CACHE_KEYS.teacherApplicationStatus(applicationId);
    const cached = await getCache<TeacherApplicationStatusResponse>(cacheKey);
    if (cached) {
      log.info("Returning teacher application status from cache", {
        applicationId,
        status: cached.status,
      });
      return cached;
    }
    const application = await prisma.teacherApplication.findUnique({
      where: {
        id: applicationId,
      },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        updatedAt: true,
      },
    });
    if (!application) {
      log.warn(
        `No teacher application exists with applicationId ${applicationId}`,
      );
      throw new Error("Application does not exist");
    }
    const response: TeacherApplicationStatusResponse = {
      id: application.id,
      status: application.status,
      updatedAt: application.updatedAt.toISOString(),
    };
    if (application.status === "REJECTED") {
      response.rejectionReason = application.rejectionReason;
    }
    await createSystemLog({
      level: "INFO",
      message: "Fetched teacher application status",
      module: "TeacherApplication",
      context,
      statusCode,
      metadata: {
        applicationId,
        status: application.status,
      },
    });
    await setCache(cacheKey, response, CACHE_TTL.TEACHER_APPLICATION_SINGLE);
    log.info("Teacher application status fetched successfully", {
      applicationId,
      status: application.status,
    });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      "Internal Server Error. Failed to get teacher application status",
      {
        error: err.message,
        ipAddress: context.ipAddress,
        applicationId,
      },
    );
    throw err;
  }
}
