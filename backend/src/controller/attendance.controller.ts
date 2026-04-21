import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  ModeratorAttendanceSchema,
  StudentAttendanceSchema,
  TeacherAttendanceSchema,
} from "../validations/input.validations";
import {
  getAdminsAttendanceService,
  getStudentAttendanceService,
  getTeachersAttendanceService,
  markModeratorAttendanceService,
  markStudentAttendanceService,
  markTeacherAttendanceService,
} from "../services/attendance.service";
import { HTTP_STATUS } from "../utils/constants";
import { AttendanceStatus } from "@prisma/client";

export async function markStudentAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const classId = req.params.id as string;
  const schoolId = req.user?.schoolId;
  const classTeacherId = req.user?.id;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }
  if (!classTeacherId) {
    throw new Error("Class Teacher ID is required");
  }

  const parsed = StudentAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);

  const studentAttendance = await markStudentAttendanceService(
    classId,
    schoolId,
    parsed.data,
    classTeacherId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Students attendance marked successfully",
    data: studentAttendance,
  });
}

export async function markTeacherAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  if (!schoolId) {
    throw new Error(`School ID is requird`);
  }
  if (!moderatorId) {
    throw new Error(`Moderator ID is required`);
  }

  const parsed = TeacherAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.CREATED);

  const teacherAttendance = await markTeacherAttendanceService(
    schoolId,
    parsed.data,
    auditContext,
    moderatorId,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Teachers attendance marked sucessfully",
    data: teacherAttendance,
  });
}

export async function markModeratorAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const parsed = ModeratorAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!adminId) {
    throw new Error("Admin ID is required");
  }

  res.status(HTTP_STATUS.CREATED);

  const moderatorAttendance = await markModeratorAttendanceService(
    schoolId,
    parsed.data,
    auditContext,
    res.statusCode,
    adminId,
  );

  res.json({
    success: true,
    message: "Moderators attendance marked successfully",
    data: moderatorAttendance,
  });
}

export async function getStudentAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const date = req.query.date as string | undefined;
  const status = req.query.status as AttendanceStatus | undefined;
  const schoolId = req.user?.schoolId;
  const classId = req.params.id as string;
  const classTeacherId = req.user?.id;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!classTeacherId) {
    throw new Error("Teacher ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }
  const filters = {
    date,
    status,
  };

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const allStudentsAttendance = await getStudentAttendanceService(
    classId,
    classTeacherId,
    auditContext,
    res.statusCode,
    schoolId,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched attendance of all students",
    data: allStudentsAttendance,
  });
}

export async function getTeachersAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const date = req.query.date as string | undefined;
  const status = req.query.status as AttendanceStatus | undefined;

  const filters = {
    date,
    status,
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const allTeachersAttendance = await getTeachersAttendanceService(
    auditContext,
    res.statusCode,
    schoolId,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched all teachers attendance",
    data: allTeachersAttendance,
  });
}

export async function getAdminsAttendance(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const date = req.query.date as string | undefined;
  const status = req.query.status as AttendanceStatus | undefined;

  const filters = {
    date,
    status,
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const allAdminsAttendance = await getAdminsAttendanceService(
    auditContext,
    res.statusCode,
    schoolId,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched all admins attendance",
    data: allAdminsAttendance,
  });
}
