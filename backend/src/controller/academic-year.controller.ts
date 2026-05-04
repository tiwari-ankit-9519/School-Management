import { AuthenticatedRequest } from "../middlewares/request-logger.middleware";
import { buildAuditContext } from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { createAcademicYearService } from "../services/academic-year.service";
import { AcademicYearInput } from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";

export async function createAcademicYear(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = AcademicYearInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const adminId = req.user?.id;

  if (!adminId) {
    res.status(400).json({
      success: false,
      message: "Admin ID or School ID is missing",
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.CREATED);
  const academicYear = await createAcademicYearService(
    parsed.data,
    adminId,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Academic year created",
    data: academicYear,
  });
}
