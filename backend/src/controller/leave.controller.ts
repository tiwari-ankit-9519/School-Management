import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  ReviewSchoolApplicationSchema,
} from "../validations/input.validations";
import {
  applyLeaveRequestByModeratorService,
  applyLeaveRequestByStudentService,
  applyLeaveRequestByTeacherService,
  getLeaveRequestsOfModeratorForAdminService,
  getLeaveRequestsOfStudentForClassTeacherService,
  getLeaveRequestsOfTeacherForModeratorService,
  getMyLeaveRequestsService,
  reviewLeaveRequestOfModeratorForAdminService,
  reviewLeaveRequestOfStudentByClassTeacherService,
  reviewLeaveRequestOfTeacherForModeratorService,
} from "../services/leave.service";
import { HTTP_STATUS } from "../utils/constants";
import { LeaveStatus, Role } from "@prisma/client";

export async function applyLeaveRequestForStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const role = req.user?.role as Role;
  const schoolId = req.user?.schoolId;
  const requesterId = req?.user?.id;
  if (!role) {
    throw new Error("Role is required");
  }
  if (!schoolId) {
    throw new Error("School ID required");
  }
  if (!requesterId) {
    throw new Error("Requestor ID is required");
  }
  const auditContext = buildAuditContext(req);

  const parsed = createLeaveRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);
  const leaveApplied = await applyLeaveRequestByStudentService(
    schoolId,
    requesterId,
    role,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave applied successfully",
    data: leaveApplied,
  });
}

export async function getLeaveRequestsOfStudentForClassTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const reviewerId = req.user?.id;
  const classId = req.params.classId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as LeaveStatus) || undefined;
  const studentId = (req.query.studentId as string) || undefined;
  const filters = {
    status,
    studentId,
  };
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }
  const auditContext = buildAuditContext(req);

  const studentLeaves = await getLeaveRequestsOfStudentForClassTeacherService(
    schoolId,
    reviewerId,
    classId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.status(200).json({
    success: true,
    message: "Fetched all leave request for class",
    data: studentLeaves,
  });
}

export async function reviewLeaveRequestOfStudentByClassTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const leaveId = req.params.leaveId as string;
  const reviewerId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const parsed = reviewLeaveRequestSchema.safeParse(req.body);

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!leaveId) {
    throw new Error("Leave ID is required");
  }
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  await reviewLeaveRequestOfStudentByClassTeacherService(
    schoolId,
    leaveId,
    reviewerId,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave reviewd successfully",
  });
}

export async function applyLeaveRequestByTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const requesterId = req.user?.id;
  const role = req.user?.role as Role;
  const auditContext = buildAuditContext(req);
  const parsed = createLeaveRequestSchema.safeParse(req.body);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!requesterId) {
    throw new Error("Requester ID is required");
  }
  if (!role) {
    throw new Error("Role is required");
  }
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const teacherLeave = await applyLeaveRequestByTeacherService(
    schoolId,
    requesterId,
    role,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave applied successfully",
    data: teacherLeave,
  });
}

export async function getLeaveRequestsOfTeacherForModerator(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as LeaveStatus) || undefined;
  const teacherId = (req.query.teacherId as string) || undefined;
  const filters = {
    teacherId,
    status,
  };

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!adminId) {
    throw new Error("Admin ID is required");
  }

  res.status(HTTP_STATUS.OK);

  const teachersLeavesRequest =
    await getLeaveRequestsOfTeacherForModeratorService(
      schoolId,
      adminId,
      auditContext,
      res.statusCode,
      page,
      limit,
      filters,
    );

  res.json({
    success: true,
    message: "Fetched leave request for teachers",
    data: teachersLeavesRequest,
  });
}

export async function reviewLeaveRequestOfTeacherForModerator(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const leaveId = req.params.leaveId as string;
  const reviewerId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const parsed = reviewLeaveRequestSchema.safeParse(req.body);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!leaveId) {
    throw new Error("Leave ID is required");
  }
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  res.status(HTTP_STATUS.OK);
  await reviewLeaveRequestOfTeacherForModeratorService(
    schoolId,
    leaveId,
    reviewerId,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave review successfully",
  });
}

export async function applyLeaveRequestByModerator(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const requesterId = req.user?.id;
  const role = req.user?.role as Role;
  const auditContext = buildAuditContext(req);
  const parsed = createLeaveRequestSchema.safeParse(req.body);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!requesterId) {
    throw new Error("Requester ID is required");
  }
  if (!role) {
    throw new Error("Role is required");
  }
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);
  const moderatorLeaves = await applyLeaveRequestByModeratorService(
    schoolId,
    requesterId,
    role,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave applied successfully",
    data: moderatorLeaves,
  });
}

export async function getLeaveRequestsOfModeratorForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const moderatorId = req.query.moderatorId as string;
  const status = req.query.status as LeaveStatus;
  const filters = {
    status,
    moderatorId,
  };

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!adminId) {
    throw new Error("Admin ID is required");
  }

  res.status(HTTP_STATUS.OK);
  const moderatorLeaveRequest =
    await getLeaveRequestsOfModeratorForAdminService(
      schoolId,
      adminId,
      auditContext,
      res.statusCode,
      page,
      limit,
      filters,
    );

  res.json({
    success: true,
    message: "Fetched moderator leave request successfully",
    data: moderatorLeaveRequest,
  });
}

export async function reviewLeaveRequestOfModeratorForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const leaveId = req.params.leaveId as string;
  const reviewerId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const parsed = reviewLeaveRequestSchema.safeParse(req.body);
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
  if (!leaveId) {
    throw new Error("Leave ID is required");
  }
  if (!reviewerId) {
    throw new Error("Reviewer ID is required");
  }

  res.status(HTTP_STATUS.OK);

  await reviewLeaveRequestOfModeratorForAdminService(
    schoolId,
    leaveId,
    reviewerId,
    auditContext,
    res.statusCode,
    parsed.data,
  );

  res.json({
    success: true,
    message: "Leave reviewed successfully",
  });
}

export async function getMyLeaveRequests(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const requesterId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as LeaveStatus) || undefined;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!requesterId) {
    throw new Error("Requester ID is required");
  }
  const filters = {
    status,
  };

  res.status(HTTP_STATUS.OK);

  const myLeaveRequests = await getMyLeaveRequestsService(
    schoolId,
    requesterId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched my applied leaves",
    data: myLeaveRequests,
  });
}
