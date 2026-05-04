import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { ExamScheduleSchema } from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  createExamScheduleService,
  getExamScheduleForAdminService,
  getExamScheduleForStudentService,
  getExamScheduleForTeacherService,
} from "../services/exam.service";
import { ExamType } from "@prisma/client";

export async function createExamSchedule(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const moderatorId = req.user?.id;
  const classId = req.params.classId as string;
  const parsed = ExamScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!moderatorId) {
    throw new Error("Modeator ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);
  const examSchdeule = await createExamScheduleService(
    moderatorId,
    classId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Exam Schedule created successfully",
    data: examSchdeule,
  });
}

export async function getExamScheduleForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const moderatorId = req.user?.id;
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  const classId = req.query.classId as string;
  const academicYearId = req.query.academicYearId as string | undefined;
  const examType = req.query.examType as ExamType | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const teacherId = req.query.teacherId as string | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortBy = req.query.sortBy as "date" | "createdAt" | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filters = {
    classId,
    academicYearId,
    examType,
    subjectId,
    teacherId,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  };

  res.status(HTTP_STATUS.OK);

  const auditContext = buildAuditContext(req);

  const adminExamSchedule = await getExamScheduleForAdminService(
    moderatorId,
    filters,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: "Fetched exam schedule for admin",
    data: adminExamSchedule,
  });
}

export async function getExamScheduleForTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const teacherId = req.user?.id;
  if (!teacherId) {
    throw new Error("Teacher ID is required");
  }
  const auditContext = buildAuditContext(req);
  const classId = req.query.classId as string | undefined;
  const examType = req.query.examType as ExamType | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortBy = req.query.classId as "date" | "createdAt" | undefined;
  const sortOrder = req.query.classId as "asc" | "desc" | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filters = {
    classId,
    examType,
    subjectId,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  };

  res.status(HTTP_STATUS.OK);

  const teacherExamSchedule = await getExamScheduleForTeacherService(
    teacherId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched exam schedule for teacher",
    data: teacherExamSchedule,
  });
}

export async function getExamScheduleForStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const studentId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  if (!studentId) {
    throw new Error("School ID is required");
  }

  const examType = req.query.examType as ExamType | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortBy = req.query.sortBy as "date" | "createdAt" | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;

  const filters = {
    examType,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  };

  res.status(HTTP_STATUS.OK);

  const studentExamSchedule = await getExamScheduleForStudentService(
    studentId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched exam schedule for student",
    data: studentExamSchedule,
  });
}
