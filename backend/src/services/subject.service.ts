import { Subject } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  AssignTeacherToSubjectInput,
  SubjectInput,
} from "../validations/input.validations";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCacheByPattern,
  getCache,
  setCache,
} from "../utils/cache.util";

const log = createModuleLogger("SubjectSerivce");

export async function createSubjectService(
  adminId: string,
  data: SubjectInput,
  context: AuditContext,
  statusCode: number,
): Promise<Subject> {
  try {
    log.info("Starting subject creation service", {
      adminId,
      subjectName: data.name,
      subjectCode: data.code,
      ipAddress: context.ipAddress,
    });

    const subjectExists = await prisma.subject.findUnique({
      where: {
        code: data.code,
      },
    });

    if (subjectExists) {
      log.warn("Subject with same code already exists", {
        subjectCode: data.code,
      });
      throw new Error("Subject with same code already exists");
    }

    const newSubject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
      },
    });

    await deleteCacheByPattern(`subjects:*`);

    await createSystemLog({
      level: "INFO",
      module: "SubjectService",
      context,
      statusCode,
      message: "Subject created successfully",
      metadata: {
        adminId,
        subjectName: data.name,
        subjectCode: data.code,
        ipAddress: context.ipAddress,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "Subject",
      resourceId: newSubject.id,
      resourceType: "SubjectCreation",
      newValues: {
        subjectId: newSubject.id,
        subjectName: newSubject.name,
        subjectCode: newSubject.code,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Subject created successfully", {
      newSubject,
    });

    return newSubject;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create subject", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function assignTeacherToSubjectService(
  subjectId: string,
  data: AssignTeacherToSubjectInput,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Starting Service to assign teacher to subject with code ${subjectId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const teacherForSubject = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId,
          classId: data.classId,
        },
      },
    });

    if (teacherForSubject) {
      log.warn(
        `Subject is already assigned to teacher with id ${data.teacherId}`,
      );
      throw new Error(
        `Subject is already assigned to teacher with id ${data.teacherId}`,
      );
    }

    await prisma.teacherSubject.create({
      data: {
        teacherId: data.teacherId,
        subjectId,
        classId: data.classId,
      },
    });

    log.info("Subject assgigned to teacher successfully", {
      teacherId: data.teacherId,
      subjectId,
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "ASSIGN",
      module: "Subject",
      resourceId: subjectId,
      resourceType: "Teacher being assigned to subject",
      newValues: {
        subjectId,
        teacherId: data.teacherId,
        classId: data.classId,
      },
      context,
      statusCode,
      isSuccessful: true,
    });

    await createSystemLog({
      level: "INFO",
      module: "SubjectService",
      message: "Teacher assigned to subject successfully",
      context,
      statusCode,
      metadata: {
        ipAddress: context.ipAddress,
        moderatorId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to assign teacher to subject with code ${subjectId}`, {
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function unassignTeacherFromSubjectService(
  subjectId: string,
  data: AssignTeacherToSubjectInput,
  moderatorId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Starting service to unassign teacher with subjectId ${subjectId}`,
      {
        ipAddress: context.ipAddress,
        subjectId,
        moderatorId,
      },
    );

    const teacherForSubject = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId,
          classId: data.classId,
        },
      },
    });

    if (!teacherForSubject) {
      log.warn(
        `Teacher is not assigned to subject with subjectId ${subjectId}`,
      );
      throw new Error(
        `Teacher is not assigned to subject with subjectId ${subjectId}`,
      );
    }

    await prisma.teacherSubject.delete({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId,
          classId: data.classId,
        },
      },
    });

    log.info("Teacher unassigned from subject", {
      teacherId: data.teacherId,
      subjectId,
    });

    await createAuditLog({
      performedById: moderatorId,
      action: "UNASSIGN",
      module: "Subject",
      resourceId: subjectId,
      resourceType: "Teacher being unassigned from subject",
      newValues: {
        subjectId,
        teacherId: data.teacherId,
        classId: data.classId,
      },
      context,
      statusCode,
      isSuccessful: true,
    });

    await createSystemLog({
      level: "INFO",
      module: "SubjectService",
      message: "Teacher being unassigned from subject",
      context,
      statusCode,
      metadata: {
        ipAddress: context.ipAddress,
        moderatorId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to unassign teacher to subject with subjectId ${subjectId}`,
      {
        ipAddress: context.ipAddress,
        subjectId,
        moderatorId,
        error: err.message,
      },
    );
    throw err;
  }
}

export async function getAllSubjectsService(
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  isActive?: boolean,
): Promise<{
  data: Subject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Fetching all subjects for school`, {
      page,
      limit,
      ipAddress: context.ipAddress,
    });

    const where = isActive !== undefined ? { isActive } : {};

    const cacheKey = CACHE_KEYS.subjects(page, limit);

    const cached = await getCache<{
      data: Subject[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info("Returning cached subjects", { cacheKey });
      return cached;
    }

    const [allSubjects, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.subject.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      message: `Fetched all subjects`,
      module: "GetAllSubjects",
      context,
      metadata: {
        page,
        limit,
        total,
        isActive,
      },
      statusCode,
    });

    const response = {
      data: allSubjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);

    log.info("Fetched all school applications successfully", {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      isActive,
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch all subjects", {
      ipAddress: context.ipAddress,
      error: err.message,
      page,
      limit,
    });
    throw err;
  }
}

export async function getSingleSubjectService(
  subjectId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Subject> {
  try {
    log.info(`Starting service to fetch subject with id ${subjectId}`, {
      ipAddress: context.ipAddress,
    });

    const subjectExists = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      include: {
        teacherSubjects: true,
        timetables: true,
      },
    });

    if (!subjectExists) {
      log.warn(`No subject exists with id ${subjectId}`);
      throw new Error(`Subject does not exists with id ${subjectId}`);
    }

    await createSystemLog({
      level: "INFO",
      message: `Fetched subject with id ${subjectId}`,
      module: "GetSingleSubject",
      context,
      statusCode,
      metadata: {
        subjectId,
      },
    });

    log.info(`Fetched subject with id ${subjectId}`);
    return subjectExists;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch subject with subjectId ${subjectId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
      },
    );
    throw err;
  }
}
