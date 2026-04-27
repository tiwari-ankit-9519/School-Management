import { Enrollment, EnrollmentStatus, Gender, Prisma } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { prisma } from "../config/database.config";
import { createSystemLog } from "../utils/audit.util";
import { StudentWithClassDetailsReturn } from "../validations/input.validations";

const log = createModuleLogger("StudentModule");

export async function getAllStudentsListService(
  schoolId: string,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters?: {
    classId?: string;
    academicYearId?: string;
    status?: EnrollmentStatus;
    gender?: Gender;
  },
): Promise<{
  data: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(
      `Starting service to get list of all student of school with id ${schoolId}`,
    );

    const cacheKey = CACHE_KEYS.allStudents(
      schoolId,
      page,
      limit,
      filters?.classId || "ALL",
      filters?.academicYearId || "ALL",
      filters?.status || "ALL",
      filters?.gender || "ALL",
    );

    const cached = await getCache<{
      data: Enrollment[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning all students of school with id ${schoolId}`);
      return cached;
    }

    const where: Prisma.EnrollmentWhereInput = {
      class: {
        schoolId,
      },
    };

    if (filters?.classId) where.classId = filters.classId;
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.status) where.status = filters.status;
    if (filters?.gender) where.student = { gender: filters.gender };

    const [allStudents, total] = await prisma.$transaction([
      prisma.enrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          enrolledAt: "desc",
        },
      }),

      prisma.enrollment.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      module: "GetAllStudentsForSchool",
      message: "Fetched all students of school",
      context,
      statusCode,
      metadata: {
        schoolId,
        moderatorId,
        filters,
      },
    });
    const response = {
      data: allStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await setCache(cacheKey, response, CACHE_TTL.SCHOOL_APPLICATIONS_LIST);
    log.info(`Fetched all students of school with id ${schoolId}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
    });
    throw err;
  }
}

export async function getSingleStudentDetailService(
  studentId: string,
  schoolId: string,
  context: AuditContext,
  statusCode: number,
  filters: {
    academicYearId?: string;
  },
): Promise<StudentWithClassDetailsReturn> {
  try {
    log.info(
      `Starting service to fectch student attendance record with id ${studentId}`,
      {
        ipAddress: context.ipAddress,
        studentId,
      },
    );

    const studentDetail = await prisma.enrollment.findFirst({
      where: {
        studentId,
        class: { schoolId },
        ...(filters?.academicYearId && {
          academicYearId: filters.academicYearId,
        }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                regNumber: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
              },
            },
            parent: true,
            documents: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            roomNumber: true,
            capacity: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
          },
        },
      },
    });

    if (!studentDetail) {
      log.warn(`No student found with studentId ${studentId}`);
      throw new Error(`No student found with studentId ${studentId}`);
    }

    await createSystemLog({
      level: "INFO",
      module: "GetSingleStudentDetais",
      message: `Fetched details of student with id ${studentId}`,
      context,
      statusCode,
      metadata: {
        studentId,
        filters,
      },
    });

    log.info(`Fetched details of student with id ${studentId}`);
    return studentDetail;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch the student with id ${studentId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        studentId,
      },
    );
    throw err;
  }
}
