import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  FeesStructurePayload,
  FeesStructureUpdatePayload,
  UpdateFeeStructureStatusPayload,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  createFeeStructureService,
  getFeeStructureForClassService,
  updateFeeStructureService,
  updateFeeStructureStatusService,
} from "../services/fees.service";

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function createFeeStructure(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeesStructurePayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  const classGroupId = req.params.classGroupId as string;
  if (!adminId) throw new Error("Admin ID is required");
  if (!classGroupId) throw new Error("ClassGroup ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  const feeStructure = await createFeeStructureService(
    adminId,
    classGroupId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee structure created successfully",
    data: feeStructure,
  });
}

export async function updateFeeStructure(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeesStructureUpdatePayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  const feeId = req.params.feeId as string;
  if (!adminId) throw new Error("Admin ID is required");
  if (!feeId) throw new Error("Fee ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const updatedFeeStructure = await updateFeeStructureService(
    adminId,
    feeId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee structure updated successfully",
    data: updatedFeeStructure,
  });
}

export async function getFeeStructureForClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = req.user?.id;
  const classGroupId = req.params.classGroupId as string;
  if (!adminId) throw new Error("Admin ID is required");
  if (!classGroupId) throw new Error("Class group ID is required");

  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 10);

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const feeStructure = await getFeeStructureForClassService(
    classGroupId,
    adminId,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: "Fetched fee structure for class group",
    data: feeStructure,
  });
}

export async function updateFeeStructureStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = UpdateFeeStructureStatusPayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  const feeId = req.params.feeId as string;
  if (!adminId) throw new Error("Admin ID is required");
  if (!feeId) throw new Error("Fee ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const feeStructure = await updateFeeStructureStatusService(
    adminId,
    feeId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: parsed.data.isActive
      ? "Fee structure activated"
      : "Fee structure deactivated",
    data: feeStructure,
  });
}
