import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { HTTP_STATUS } from "../utils/constants";
import { createClassService } from "../services/class.service";
import { ClassSchema } from "../validations/input.validations";

export async function createClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const adminId = req.user?.id;
  const schoolId = req.user?.schoolId;
  const academicYearId = req.params.academicYearId as string;

  const parsed = ClassSchema.safeParse(req.body);

  if (!academicYearId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Academic year ID is required",
    });
    return;
  }

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!adminId || !schoolId) {
    res.status(400).json({
      success: false,
      message: "Admin ID or School ID is missing",
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);

  const newClass = await createClassService(
    academicYearId,
    schoolId,
    adminId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Class created successfully",
    data: newClass,
  });
}
