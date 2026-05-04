import { Mark, Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_PATTERNS,
  CACHE_TTL,
  deleteCache,
  getCache,
  setCache,
} from "../utils/cache.util";
import { MarksInput, UpdateMarkInput } from "../validations/input.validations";

const log = createModuleLogger("MarksModule");

export async function gradeExamService(
  teacherId: string,
  subjectCode: string,
  data: MarksInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting service to grade exam with id ${subjectCode}`, {
      ipAddress: context.ipAddress,
    });

    const subjectExists = await prisma.subject.findUnique({
      where: {
        code: subjectCode,
      },
    });
    if (!subjectExists) {
      log.warn(`No subject exists with the subject code ${subjectCode}`);
      throw new Error(`No subject exists with the subject code ${subjectCode}`);
    }

    const subjectAssignedTo = await prisma.teacherSubject.findFirst({
      where: {
        teacher: { userId: teacherId },
        subjectId: subjectExists.id,
      },
    });
    if (!subjectAssignedTo) {
      log.warn(`You are not authorized to grade the exam`);
      throw new Error(`You are not authorized to grade the exam`);
    }

    const examSchedule = await prisma.examSchedule.findFirst({
      where: {
        id: data.examScheduleId,
        subjectId: subjectExists.id,
      },
    });
    if (!examSchedule) {
      log.warn(`Exam schedule not found or does not belong to this subject`);
      throw new Error(
        `Exam schedule not found or does not belong to this subject`,
      );
    }

    for (const entry of data.entries) {
      if (!entry.isAbsent && entry.marksObtained > examSchedule.totalMarks) {
        throw new Error(
          `Marks obtained (${entry.marksObtained}) cannot exceed total marks (${examSchedule.totalMarks}) for student ${entry.studentId}`,
        );
      }
    }

    const studentIds = data.entries.map((e) => e.studentId);
    const validStudents = await prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        classId: examSchedule.classId,
        academicYearId: examSchedule.academicYearId,
        status: "ACTIVE",
      },
      select: { studentId: true },
    });

    const validStudentIds = new Set(validStudents.map((e) => e.studentId));
    const invalidStudents = studentIds.filter((id) => !validStudentIds.has(id));
    if (invalidStudents.length > 0) {
      throw new Error(
        `The following students are not enrolled in the relevant class: ${invalidStudents.join(", ")}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const grade = await tx.mark.createManyAndReturn({
        data: data.entries.map((entry) => ({
          studentId: entry.studentId,
          examScheduleId: data.examScheduleId,
          subjectId: subjectExists.id,
          marksObtained: entry.marksObtained,
          isAbsent: entry.isAbsent,
          enteredBy: subjectAssignedTo.teacherId,
          ...(entry.remarks && { remarks: entry.remarks }),
          ...(entry.grade && { grade: entry.grade }),
        })),
      });
      return { grade };
    });

    await createSystemLog({
      level: "INFO",
      module: "MarksModule",
      message: "Exam graded successfully",
      context,
      statusCode,
      metadata: {
        teacherId: subjectAssignedTo.teacherId,
        subjectId: subjectExists.id,
        examScheduleId: data.examScheduleId,
      },
    });

    await createAuditLog({
      performedById: teacherId,
      action: "CREATE",
      resourceId: result.grade[0]?.id || data.examScheduleId,
      resourceType: "ExamModule",
      context,
      isSuccessful: true,
      statusCode,
      module: "ExamModule",
    });

    log.info("Exam graded successfully");
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to grade exam", {
      error: err.message,
      ipAddress: context.ipAddress,
      subjectCode,
    });
    throw err;
  }
}

export async function getMarksForAdminService(
  moderatorId: string,
  subjectId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    studentId?: string;
    examScheduleId?: string;
    grade?: string;
    isAbsent?: boolean;
  },
): Promise<{
  data: Mark[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch grade or marks`, {
      ipAddress: context.ipAddress,
      moderatorId,
    });

    const subjectExists = await prisma.subject.findFirst({
      where: { id: subjectId },
    });
    if (!subjectExists) throw new Error(`Subject not found`);

    const cacheKey = CACHE_KEYS.markForAdmin(
      moderatorId,
      subjectId,
      filters?.studentId || "ALL",
      filters?.examScheduleId || "ALL",
      filters?.grade || "ALL",
      String(filters?.isAbsent ?? "ALL"),
      page,
      limit,
    );
    const cached = await getCache<{
      data: Mark[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning marks from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.MarkWhereInput = {
      subject: { id: subjectId },
    };
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.examScheduleId) where.examScheduleId = filters.examScheduleId;
    if (filters?.grade) where.grade = filters.grade;
    if (filters?.isAbsent !== undefined) where.isAbsent = filters.isAbsent;

    const [marksObtained, total] = await prisma.$transaction([
      prisma.mark.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { marksObtained: "desc" },
      }),
      prisma.mark.count({ where }),
    ]);

    const response = {
      data: marksObtained,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    await createSystemLog({
      level: "INFO",
      module: "GetMarksForAdmin",
      message: "Fetched marks for admin",
      context,
      statusCode,
      metadata: { moderatorId, filters },
    });

    log.info(`Fetched marks for admin`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch grades or marks`, {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
    });
    throw err;
  }
}

export async function getMarksForTeacherService(
  teacherId: string,
  subjectId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    studentId?: string;
    examScheduleId?: string;
    grade?: string;
    isAbsent?: boolean;
  },
): Promise<{
  data: Mark[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch marks for teachers`, {
      ipAddress: context.ipAddress,
      teacherId,
    });

    const subjectAssignedTo = await prisma.teacherSubject.findFirst({
      where: {
        teacher: { userId: teacherId },
        subjectId: subjectId,
      },
    });
    if (!subjectAssignedTo) {
      log.warn(`You are not authorized to view marks for this subject`);
      throw new Error(`You are not authorized to view marks for this subject`);
    }

    const cacheKey = CACHE_KEYS.markForTeacher(
      teacherId,
      subjectId,
      filters?.studentId || "ALL",
      filters?.examScheduleId || "ALL",
      filters?.grade || "ALL",
      String(filters?.isAbsent ?? "ALL"),
      page,
      limit,
    );

    const cached = await getCache<{
      data: Mark[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning marks from cache", { cacheKey });
      return cached;
    }

    const where: Prisma.MarkWhereInput = {
      subject: { id: subjectId },
    };
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.examScheduleId) where.examScheduleId = filters.examScheduleId;
    if (filters?.grade) where.grade = filters.grade;
    if (filters?.isAbsent !== undefined) where.isAbsent = filters.isAbsent;

    const [marksObtained, total] = await prisma.$transaction([
      prisma.mark.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { marksObtained: "desc" },
      }),
      prisma.mark.count({ where }),
    ]);

    const response = {
      data: marksObtained,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    await createSystemLog({
      level: "INFO",
      module: "GetMarksForTeacher",
      message: "Fetched marks for teacher",
      context,
      statusCode,
      metadata: { teacherId, filters },
    });

    log.info(`Fetched marks for teacher`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch marks for teacher`, {
      error: err.message,
      ipAddress: context.ipAddress,
      teacherId,
    });
    throw err;
  }
}

export async function getMarksForStudentService(
  studentId: string,
  subjectId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    examScheduleId?: string;
    grade?: string;
    isAbsent?: boolean;
  },
): Promise<{
  data: Mark[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch marks for student`, {
      ipAddress: context.ipAddress,
      studentId,
    });

    const studentExists = await prisma.student.findFirst({
      where: { userId: studentId },
    });
    if (!studentExists) {
      log.warn(`Student not found with userId ${studentId}`, {
        studentId,
      });
      throw new Error(`Student not found`);
    }

    log.info(`Student found, validating subject`, { studentId, subjectId });

    const subjectExists = await prisma.subject.findFirst({
      where: { id: subjectId },
    });
    if (!subjectExists) {
      log.warn(`Subject not found with id ${subjectId}`, {
        subjectId,
      });
      throw new Error(`Subject not found`);
    }

    log.info(`Subject validated, checking cache`, { subjectId });

    const cacheKey = CACHE_KEYS.markForStudent(
      studentId,
      subjectId,
      filters?.examScheduleId || "ALL",
      filters?.grade || "ALL",
      String(filters?.isAbsent ?? "ALL"),
      page,
      limit,
    );

    const cached = await getCache<{
      data: Mark[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning marks from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, {
      studentId,
      subjectId,
      page,
      limit,
    });

    const where: Prisma.MarkWhereInput = {
      studentId: studentExists.id,
      subject: { id: subjectId },
    };
    if (filters?.examScheduleId) where.examScheduleId = filters.examScheduleId;
    if (filters?.grade) where.grade = filters.grade;
    if (filters?.isAbsent !== undefined) where.isAbsent = filters.isAbsent;

    const [marksObtained, total] = await prisma.$transaction([
      prisma.mark.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { marksObtained: "desc" },
      }),
      prisma.mark.count({ where }),
    ]);

    log.info(`Database query successful`, {
      total,
      page,
      limit,
      studentId,
      subjectId,
    });

    const response = {
      data: marksObtained,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Marks cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "GetMarksForStudent",
      message: "Fetched marks for student",
      context,
      statusCode,
      metadata: { studentId, subjectId, filters },
    });

    log.info(`Fetched marks for student successfully`, {
      studentId,
      subjectId,
      total,
    });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch marks for student`, {
      error: err.message,
      ipAddress: context.ipAddress,
      studentId,
      subjectId,
    });
    throw err;
  }
}

export async function updateMarkService(
  teacherId: string,
  markId: string,
  data: UpdateMarkInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(`Starting service to update mark with id ${markId}`, {
      teacherId,
      ipAddress: context.ipAddress,
    });

    const markExists = await prisma.mark.findUnique({
      where: { id: markId },
      include: { examSchedule: true },
    });
    if (!markExists) {
      log.warn(`Mark not found with id ${markId}`, { markId });
      throw new Error(`Mark not found`);
    }

    log.info(`Mark found, validating teacher authorization`, {
      markId,
      teacherId,
    });

    const subjectAssignedTo = await prisma.teacherSubject.findFirst({
      where: {
        teacher: { userId: teacherId },
        subjectId: markExists.subjectId,
      },
    });
    if (!subjectAssignedTo) {
      log.warn(
        `Teacher ${teacherId} is not authorized to update mark ${markId}`,
        {
          teacherId,
          markId,
          subjectId: markExists.subjectId,
        },
      );
      throw new Error(`You are not authorized to update this mark`);
    }

    log.info(`Teacher authorized, validating marks obtained`, {
      markId,
      teacherId,
    });

    if (
      data.marksObtained !== undefined &&
      !data.isAbsent &&
      data.marksObtained > markExists.examSchedule.totalMarks
    ) {
      log.warn(
        `Marks obtained (${data.marksObtained}) exceeds total marks (${markExists.examSchedule.totalMarks})`,
        { markId, teacherId },
      );
      throw new Error(
        `Marks obtained (${data.marksObtained}) cannot exceed total marks (${markExists.examSchedule.totalMarks})`,
      );
    }

    log.info(`Validation passed, updating mark`, { markId, teacherId });

    const oldValues = {
      marksObtained: markExists.marksObtained,
      grade: markExists.grade,
      remarks: markExists.remarks,
      isAbsent: markExists.isAbsent,
    };

    const updatedMark = await prisma.mark.update({
      where: { id: markId },
      data: {
        ...(data.marksObtained !== undefined && {
          marksObtained: data.marksObtained,
        }),
        ...(data.grade !== undefined && { grade: data.grade }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
        ...(data.isAbsent !== undefined && { isAbsent: data.isAbsent }),
        enteredBy: subjectAssignedTo.teacherId,
      },
    });

    await Promise.all([
      deleteCache(CACHE_PATTERNS.markForAdmin(updatedMark.subjectId)),
      deleteCache(CACHE_PATTERNS.markForTeacher(updatedMark.subjectId)),
      deleteCache(
        CACHE_PATTERNS.markForStudent(
          updatedMark.studentId,
          updatedMark.subjectId,
        ),
      ),
    ]);

    log.info(`Mark updated successfully`, { markId, teacherId });

    await createSystemLog({
      level: "INFO",
      module: "MarksModule",
      message: "Mark updated successfully",
      context,
      statusCode,
      metadata: {
        teacherId: subjectAssignedTo.teacherId,
        markId,
        subjectId: markExists.subjectId,
        examScheduleId: markExists.examScheduleId,
      },
    });

    await createAuditLog({
      performedById: teacherId,
      action: "UPDATE",
      resourceId: updatedMark.id,
      resourceType: "ExamModule",
      context,
      isSuccessful: true,
      statusCode,
      module: "ExamModule",
      oldValues,
      newValues: {
        marksObtained: updatedMark.marksObtained,
        grade: updatedMark.grade,
        remarks: updatedMark.remarks,
        isAbsent: updatedMark.isAbsent,
      },
    });

    log.info(`Update mark service completed successfully`, {
      markId,
      teacherId,
    });
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to update mark`, {
      error: err.message,
      ipAddress: context.ipAddress,
      teacherId,
      markId,
    });
    throw err;
  }
}
