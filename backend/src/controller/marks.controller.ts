import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  MarksSchema,
  updateMarkSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  getMarksForAdminService,
  getMarksForStudentService,
  getMarksForTeacherService,
  gradeExamService,
  updateMarkService,
} from "../services/marks.service";

export async function gradeExam(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const teacherId = req.user?.id;
  const subjectId = req.params.subjectId as string;
  const parsed = MarksSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }
  if (!teacherId) throw new Error("Teacher ID is required");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);
  await gradeExamService(
    teacherId,
    subjectId,
    parsed.data,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Exam graded successfully",
  });
}

export async function updateMark(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const teacherId = req.user?.id;
  const markId = req.params.markId as string;
  const parsed = updateMarkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }
  if (!teacherId) throw new Error("Teacher ID is required");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  await updateMarkService(
    teacherId,
    markId,
    parsed.data,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Mark updated successfully",
  });
}

export async function getMarksForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const moderatorId = req.user?.id;
  const subjectId = req.params.subjectId as string;
  if (!moderatorId) throw new Error("Moderator ID is required");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const studentId = req.query.studentId as string | undefined;
  const examScheduleId = req.query.examScheduleId as string | undefined;
  const grade = req.query.grade as string | undefined;
  const isAbsent =
    req.query.isAbsent !== undefined
      ? req.query.isAbsent === "true"
      : undefined;
  const filters = { studentId, examScheduleId, grade, isAbsent };
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const adminGrades = await getMarksForAdminService(
    moderatorId,
    subjectId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );
  res.json({
    success: true,
    message: "Fetched grades for admin",
    data: adminGrades,
  });
}

export async function getMarksForTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const teacherId = req.user?.id;
  const subjectId = req.params.subjectId as string;
  if (!teacherId) throw new Error("Teacher ID is required");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const studentId = req.query.studentId as string | undefined;
  const examScheduleId = req.query.examScheduleId as string | undefined;
  const grade = req.query.grade as string | undefined;
  const isAbsent =
    req.query.isAbsent !== undefined
      ? req.query.isAbsent === "true"
      : undefined;
  const filters = { studentId, examScheduleId, grade, isAbsent };
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const teacherGrades = await getMarksForTeacherService(
    teacherId,
    subjectId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );
  res.json({
    success: true,
    message: "Fetched grades for teacher",
    data: teacherGrades,
  });
}

export async function getMarksForStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const studentId = req.user?.id;
  const subjectId = req.params.subjectId as string;
  if (!studentId) throw new Error("Student ID is required");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const examScheduleId = req.query.examScheduleId as string | undefined;
  const grade = req.query.grade as string | undefined;
  const isAbsent =
    req.query.isAbsent !== undefined
      ? req.query.isAbsent === "true"
      : undefined;
  const filters = { examScheduleId, grade, isAbsent };
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const studentGrades = await getMarksForStudentService(
    studentId,
    subjectId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );
  res.json({
    success: true,
    message: "Fetched grades for student",
    data: studentGrades,
  });
}
