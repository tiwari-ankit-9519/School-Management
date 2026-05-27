import { Class, Prisma } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  AssignTeacherToSubjectInput,
  ClassInput,
} from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";

const log = createModuleLogger("ClassService");

export async function createClassService(
  adminId: string,
  data: ClassInput,
  context: AuditContext,
  statusCode: number,
): Promise<Class> {
  try {
    log.info("Class creation service started", {
      ipAddress: context.ipAddress,
      className: data.name,
      capacity: data.capacity,
      adminId,
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        isCurrent: true,
      },
    });

    if (!academicYear) {
      log.warn("Academic Year not found for this school", {
        academicYearId: academicYear!.id,
      });
      throw new Error("Academic Year not found for this school");
    }

    const classExists = await prisma.class.findFirst({
      where: {
        name: data.name,
        section: data.section,
        academicYearId: academicYear.id,
      },
    });

    if (classExists) {
      log.warn("Class already exists", {
        classExists,
      });
      throw new Error("Class already exists");
    }

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        section: data.section,
        capacity: data.capacity,
        roomNumber: data.roomNumber,
        academicYearId: academicYear.id,
      },
    });

    await deleteCacheByPattern(`classes:*`);

    await createSystemLog({
      level: "INFO",
      module: "ClassService",
      message: "Class created successfully",
      context,
      statusCode,
      metadata: {
        ipAddress: context.ipAddress,
        className: data.name,
        capacity: data.capacity,
        academicYearId: academicYear.id,
        adminId,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "Class",
      resourceId: newClass.id,
      resourceType: "ClassService",
      newValues: {
        className: newClass.name,
        classId: newClass.id,
        studentCapacity: newClass.capacity,
        section: newClass.section,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Class created successfully", {
      class: newClass,
    });

    return newClass;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create class", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function assignClassTeacherService(
  moderatorId: string,
  data: AssignTeacherToSubjectInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Starting service to assign class teacher to class with classId ${data.classId}`,
      {
        ipAddress: context.ipAddress,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    );

    const teacherExists = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacherExists) {
      log.warn(`Teacher does not exists with teacherId ${data.teacherId}`);
      throw new Error(
        `Teacher does not exists with teacherId ${data.teacherId}`,
      );
    }

    const classAlreadyHasTeacher = await prisma.classTeacher.findFirst({
      where: {
        classId: data.classId,
      },
    });
    if (classAlreadyHasTeacher) {
      log.warn(`Class already has a teacher assigned`, {
        classId: data.classId,
      });
      throw new Error("Class already has a teacher assigned");
    }

    const classTeacherExists = await prisma.classTeacher.findUnique({
      where: {
        classId_teacherId: {
          classId: data.classId,
          teacherId: data.teacherId,
        },
      },
    });

    if (classTeacherExists) {
      log.warn(`Class Teacher is already assigned to class`, {
        classId: data.classId,
        teacherId: data.teacherId,
      });
      throw new Error("Class Teacher is already assigned to class");
    }

    const newClassTeacher = await prisma.classTeacher.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        isPrimary: true,
      },
    });

    log.info(
      `Teacher with id ${data.teacherId} is assigned as class teacher with classId ${data.classId}`,
    );

    await createAuditLog({
      performedById: moderatorId,
      action: "CREATE",
      module: "Class",
      resourceId: newClassTeacher.id,
      resourceType: "Class Teacher",
      newValues: {
        newClassTeacher,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      module: "ClassTeacherService",
      context,
      statusCode,
      message: "Class Teacher assigned successfully",
      metadata: {
        newClassTeacher,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to assign class teacher to class with classId ${data.classId}`,
      {
        ipAddress: context.ipAddress,
        classId: data.classId,
        teacherId: data.teacherId,
        error: err.message,
      },
    );
    throw err;
  }
}

export async function getAllClassesService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    academicYearId: string;
    name?: string;
    section?: string;
    capacityMin?: number;
    capacityMax?: number;
    roomNumber?: string;
    teacherId?: string;
  },
): Promise<{
  data: Class[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Getting all classes for school for academicYear`);

    const { academicYearId, ...restFilters } = filters;
    const cacheKey = CACHE_KEYS.allClasses(
      academicYearId,
      page,
      limit,
      restFilters,
    );

    const cached = await getCache<{
      data: Class[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info(
        `Returning cached classes for academicYear ${filters.academicYearId}`,
      );
      return cached;
    }

    const where: Prisma.ClassWhereInput = {
      academicYearId: filters.academicYearId,
      ...(filters.name && {
        name: { contains: filters.name, mode: "insensitive" },
      }),
      ...(filters.section && {
        section: { contains: filters.section, mode: "insensitive" },
      }),
      ...(filters.roomNumber && {
        roomNumber: { contains: filters.roomNumber, mode: "insensitive" },
      }),
      ...(filters.teacherId && {
        teacherId: filters.teacherId,
      }),
      ...((filters.capacityMin !== undefined ||
        filters.capacityMax !== undefined) && {
        capacity: {
          ...(filters.capacityMin !== undefined && {
            gte: filters.capacityMin,
          }),
          ...(filters.capacityMax !== undefined && {
            lte: filters.capacityMax,
          }),
        },
      }),
    };

    const [classes, total] = await prisma.$transaction([
      prisma.class.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          classTeachers: {
            where: { isPrimary: true },
            select: { id: true },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    if (classes.length === 0) {
      log.warn(`No classes found for school for academicYear`);
      throw new Error(`No classes found for school for academicYear`);
    }

    const result = {
      data: classes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, result);

    await createSystemLog({
      level: "INFO",
      module: "Class",
      message: `Fetched all classes for school for academicYear`,
      metadata: {
        academicYearId: filters.academicYearId,
        totalClass: total,
        page,
        limit,
        filters,
      },
      context,
      statusCode,
    });

    return result;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to get all classes`, {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getSingleClassService(
  classId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Class> {
  try {
    log.info(`Starting service to fetch class with id ${classId} for school`);

    const classExists = await prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        classTeachers: {
          select: {
            id: true,
            isPrimary: true,
            teacherId: true,
            teacher: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        enrollments: {
          select: {
            rollNumber: true,
            status: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
                user: {
                  select: { regNumber: true },
                },
              },
            },
          },
        },
        timetables: true,
        examSchedules: true,
        leaveRequest: true,
      },
    });

    if (!classExists) {
      log.warn(`No class exists with classId ${classId}`);
      throw new Error(`No class exists with classId ${classId}`);
    }

    log.info(`Fetched class with classId ${classId}`);

    await createSystemLog({
      level: "INFO",
      module: "Class Module",
      message: "Class Fetched successfully",
      context,
      metadata: {
        classId,
      },
      statusCode,
    });

    return classExists;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch class with classId ${classId}`, {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
