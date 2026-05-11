import { AuthenticatedRequest } from "../middlewares/request-logger.middleware";
import { buildAuditContext } from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  createAcademicYearService,
  getAcademicYearService,
} from "../services/academic-year.service";
import { HTTP_STATUS } from "../utils/constants";
import { AcademicYearSchema } from "../validations/input.validations";

export async function createAcademicYear(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = AcademicYearSchema.safeParse(req.body);
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

export async function getAcademicYear(
  req: AuthenticatedRequest,
  res: Response,
) {
  const adminId = req.user?.id;
  const auditContext = buildAuditContext(req);
  if (!adminId) {
    throw new Error("Admin ID is required");
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const name = req.query.name as string | undefined;
  const isCurrent =
    req.query.isCurrent !== undefined
      ? req.query.isCurrent === "true"
      : undefined;
  const filters = {
    isCurrent,
    name,
  };
  res.status(HTTP_STATUS.OK);
  const academicYear = await getAcademicYearService(
    adminId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Academic Year fetched successfully",
    data: academicYear,
  });
}
