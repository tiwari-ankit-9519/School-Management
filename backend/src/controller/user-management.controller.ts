import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  ModeratorSchema,
  TeacherApplicationSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  createModeratorService,
  teacherApplicationService,
} from "../services/user-management.service";

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
