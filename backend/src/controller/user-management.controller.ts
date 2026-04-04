import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  ModeratorSchema,
  RejectTeacherApplicationSchema,
  ResubmitApplicationSchema,
  TeacherApplicationSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  approveTeacherApplicationService,
  createModeratorService,
  getAllTeachersApplicationService,
  getTeacherApplicationService,
  rejectTeacherApplicaitonService,
  resubmitTeacherApplicationService,
  shortlistApplicationService,
  teacherApplicationService,
} from "../services/user-management.service";
import { ApplicationStatus } from "@prisma/client";

export async function createModerator(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = ModeratorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  if (!schoolId || !adminId) {
    throw new Error("School Id or Admin ID are required");
  }

  res.status(HTTP_STATUS.CREATED);

  const moderator = await createModeratorService(
    parsed.data,
    schoolId,
    adminId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Moderator created successfully",
    data: moderator,
  });
}

export async function createTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (req.body.documents && typeof req.body.documents === "string") {
    try {
      req.body.documents = JSON.parse(req.body.documents);
    } catch {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ path: ["documents"], message: "Invalid documents format" }],
      });
      return;
    }
  }

  const parsed = TeacherApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  const auditContext = buildAuditContext(req);
  const schoolId = req.params.schoolId as string;
  if (!schoolId) {
    throw new Error("School Id is required");
  }

  res.status(HTTP_STATUS.CREATED);
  const teacherApplication = await teacherApplicationService(
    parsed.data,
    schoolId,
    files,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Teacher Application sent successfully",
    data: teacherApplication,
  });
}

export async function viewAllTeacherApplications(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as ApplicationStatus | undefined;

  res.status(HTTP_STATUS.OK);
  const applications = await getAllTeachersApplicationService(
    auditContext,
    res.statusCode,
    page,
    limit,
    schoolId,
    status,
  );

  res.json({
    success: true,
    message: "Teacher Applications fetched successfully",
    data: applications,
  });
}

export async function viewTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const schoolId = req.user?.schoolId;
  const applicationId = req.params.applicationId as string;
  if (!schoolId || !applicationId) {
    throw new Error("Application ID and School ID is required");
  }
  res.status(HTTP_STATUS.OK);
  const application = await getTeacherApplicationService(
    applicationId,
    schoolId,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Fetched teacher application",
    data: application,
  });
}

export async function shortlistTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const applicationId = req.params.id as string;
  const moderatorId = req.user?.id;
  const schoolId = req.user?.schoolId;
  const auditcontext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("SchoolID is missing");
  }
  if (!applicationId) {
    throw new Error("Application ID is missing");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is missing");
  }
  const updatedApplication = await shortlistApplicationService(
    applicationId,
    moderatorId,
    schoolId,
    auditcontext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Application is shortlisted",
    data: updatedApplication,
  });
}

export async function approveTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  const applicationId = req.params.id as string;
  const auditContext = buildAuditContext(req);

  if (!schoolId) {
    throw new Error("SchoolID is missing");
  }
  if (!applicationId) {
    throw new Error("Application ID is missing");
  }
  if (!adminId) {
    throw new Error("Admin ID is missing");
  }

  res.status(HTTP_STATUS.CREATED);

  const teacher = await approveTeacherApplicationService(
    applicationId,
    schoolId,
    adminId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Teacher created succesfully",
    data: teacher,
  });
}

export async function rejectTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const parsed = RejectTeacherApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  const applicationId = req.params.id as string;

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!applicationId) {
    throw new Error("Application ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  res.status(HTTP_STATUS.OK);

  await rejectTeacherApplicaitonService(
    applicationId,
    schoolId,
    moderatorId,
    parsed.data.rejectionReason,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Teacher Application with applicationId ${applicationId} is rejected`,
  });
}

export async function resubmitTeacherApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const applicationId = req.params.id as string;

  if (req.body.documents && typeof req.body.documents === "string") {
    try {
      req.body.documents = JSON.parse(req.body.documents);
    } catch {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ path: ["documents"], message: "Invalid documents format" }],
      });
      return;
    }
  }

  const parsed = ResubmitApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  res.status(HTTP_STATUS.CREATED);
  const application = await resubmitTeacherApplicationService(
    applicationId,
    parsed.data,
    files,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Teacher Application resubmitted",
    data: application,
  });
}
