import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { SubjectSchema } from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import { createSubjectService } from "../services/subject.service";

export async function createSubject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = SubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  const schoolId = req.user?.schoolId;
  const adminId = req.user?.id;
  if (!schoolId || !adminId) {
    throw new Error("School Id or Admin Id is required");
  }

  res.status(HTTP_STATUS.CREATED);

  const subject = await createSubjectService(
    adminId,
    schoolId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Subject created successfully",
    data: subject,
  });
}
