import { Response } from "express";
import { Role } from "@prisma/client";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import {
  CollectStudentFeesPayload,
  FeePaymentListQuery,
  FeeStudentListQuery,
  ReverseFeeReceiptPayload,
  WaiveFeePaymentPayload,
} from "../validations/input.validations";
import {
  collectStudentFeesService,
  getFeeStudentDetailService,
  getMyFeesService,
  listFeePaymentsService,
  listFeeStudentsService,
  reverseFeeReceiptService,
  waiveFeePaymentService,
} from "../services/fee-payment.service";
import {
  assertReceiptAccess,
  buildReceiptPdf,
  getReceiptData,
  receiptFileName,
} from "../services/fee-receipt.service";
import { createAuditLog } from "../utils/audit.util";

const requireIdentity = (req: AuthenticatedRequest) => {
  const userId = req.user?.id;
  const role = req.user?.role as Role | undefined;
  if (!userId) throw new Error("User ID is required");
  if (!role) throw new Error("Role is required");
  return { userId, role };
};

const requireParam = (req: AuthenticatedRequest, name: string): string => {
  const value = req.params[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const sendValidationError = (
  res: Response,
  issues: unknown,
  message = "Validation failed",
): void => {
  res
    .status(HTTP_STATUS.BAD_REQUEST)
    .json({ success: false, message, errors: issues });
};

export async function listFeeStudents(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeeStudentListQuery.safeParse(req.query);
  if (!parsed.success)
    return sendValidationError(res, parsed.error.issues, "Invalid filters");

  const { userId } = requireIdentity(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await listFeeStudentsService(
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Students fetched successfully",
    data: result,
  });
}

export async function getFeeStudentDetail(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = requireIdentity(req);
  const studentId = requireParam(req, "studentId");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const detail = await getFeeStudentDetailService(
    studentId,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Student fees fetched successfully",
    data: detail,
  });
}

export async function collectStudentFees(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = CollectStudentFeesPayload.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.issues);

  const { userId } = requireIdentity(req);
  const studentId = requireParam(req, "studentId");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  const result = await collectStudentFeesService(
    studentId,
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Payment recorded. Receipt ${result.receipt.receiptNumber}`,
    data: result,
  });
}

export async function listFeePayments(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = FeePaymentListQuery.safeParse(req.query);
  if (!parsed.success)
    return sendValidationError(res, parsed.error.issues, "Invalid filters");

  const { userId } = requireIdentity(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await listFeePaymentsService(
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee bills fetched successfully",
    data: result,
  });
}

export async function waiveFeePayment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = WaiveFeePaymentPayload.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.issues);

  const { userId } = requireIdentity(req);
  const billId = requireParam(req, "billId");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const bill = await waiveFeePaymentService(
    billId,
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({ success: true, message: "Fee waived successfully", data: bill });
}

export async function reverseFeeReceipt(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = ReverseFeeReceiptPayload.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.issues);

  const { userId } = requireIdentity(req);
  const receiptId = requireParam(req, "receiptId");
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await reverseFeeReceiptService(
    receiptId,
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Receipt ${result.receipt.receiptNumber} reversed`,
    data: result,
  });
}

export async function getMyFees(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId, role } = requireIdentity(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await getMyFeesService(
    userId,
    role,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fees fetched successfully",
    data: result,
  });
}

export async function downloadFeeReceipt(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId, role } = requireIdentity(req);
  const receiptId = requireParam(req, "receiptId");

  const receipt = await getReceiptData(receiptId);

  try {
    assertReceiptAccess(receipt, userId, role);
  } catch (error) {
    res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ success: false, message: (error as Error).message });
    return;
  }

  const pdf = await buildReceiptPdf(receipt);
  const fileName = receiptFileName(receipt.receipt.receiptNumber);
  const disposition = req.query.inline === "true" ? "inline" : "attachment";

  await createAuditLog({
    performedById: userId,
    action: "EXPORT",
    module: "FeePayment",
    resourceId: receipt.receipt.receiptNumber,
    resourceType: "FeeReceipt",
    context: buildAuditContext(req),
    isSuccessful: true,
    statusCode: HTTP_STATUS.OK,
  });

  res.status(HTTP_STATUS.OK);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${fileName}"`,
  );
  res.setHeader("Content-Length", pdf.length);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(pdf);
}
