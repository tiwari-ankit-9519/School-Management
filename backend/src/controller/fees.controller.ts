import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  FeesStructurePayload,
  FeesStructureUpdatePayload,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  createFeeStructureService,
  getFeeStructureForClassService,
  updateFeeStructureService,
} from "../services/fees.service";

export async function createFeeStructure(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeesStructurePayload.safeParse(req.body);
  if (!parsed.success) {
    res.json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const adminId = req.user?.id;
  const classId = req.params?.classId as string;
  if (!adminId) {
    throw new Error("Admin ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }
  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.CREATED);

  const feeStructure = await createFeeStructureService(
    adminId,
    classId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee Structure created successfully",
    data: feeStructure,
  });
}

export async function updateFeeStructure(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeesStructureUpdatePayload.safeParse(req.body);
  if (!parsed.success) {
    res.json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  const feeId = req.params.feeId as string;
  if (!adminId) {
    throw new Error("Admin ID is required");
  }
  if (!feeId) {
    throw new Error("Fee ID is required");
  }
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);
  const updatedFeeStructure = await updateFeeStructureService(
    adminId,
    feeId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee Strucutre updated successfully",
    data: updatedFeeStructure,
  });
}

export async function getFeeStructureForClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = req.user?.id;
  const classId = req.params.classId as string;
  if (!adminId) {
    throw new Error("Admin ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }

  const page = parseInt(req.params.page as string) || 1;
  const limit = parseInt(req.params.limit as string) || 10;

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const feeStructure = await getFeeStructureForClassService(
    classId,
    adminId,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: "Fetched fee structure for class",
    data: feeStructure,
  });
}
