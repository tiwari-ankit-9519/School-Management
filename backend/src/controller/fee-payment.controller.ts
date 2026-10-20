import { Response } from "express";
import { Role } from "@prisma/client";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import {
  CollectFeePaymentPayload,
  FeePaymentListQuery,
  ReverseFeeTransactionPayload,
  WaiveFeePaymentPayload,
} from "../validations/input.validations";
import {
  collectFeePaymentService,
  getFeePaymentDetailService,
  getMyFeesService,
  listFeePaymentsService,
  reverseFeeTransactionService,
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

const sendValidationError = (
  res: Response,
  issues: unknown,
  message = "Validation failed",
): void => {
  res
    .status(HTTP_STATUS.BAD_REQUEST)
    .json({ success: false, message, errors: issues });
};

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
    message: "Fee payments fetched successfully",
    data: result,
  });
}

export async function getFeePaymentDetail(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId } = requireIdentity(req);
  const billId = req.params.billId as string;
  if (!billId) throw new Error("Bill ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const bill = await getFeePaymentDetailService(
    billId,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fee bill fetched successfully",
    data: bill,
  });
}

export async function collectFeePayment(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = CollectFeePaymentPayload.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.issues);

  const { userId } = requireIdentity(req);
  const billId = req.params.billId as string;
  if (!billId) throw new Error("Bill ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  const result = await collectFeePaymentService(
    billId,
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Payment recorded. Receipt ${result.transaction.receiptNumber}`,
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
  const billId = req.params.billId as string;
  if (!billId) throw new Error("Bill ID is required");

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

export async function reverseFeeTransaction(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = ReverseFeeTransactionPayload.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error.issues);

  const { userId } = requireIdentity(req);
  const transactionId = req.params.transactionId as string;
  if (!transactionId) throw new Error("Transaction ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await reverseFeeTransactionService(
    transactionId,
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Payment ${result.transaction.receiptNumber} reversed`,
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
  const transactionId = req.params.transactionId as string;
  if (!transactionId) throw new Error("Transaction ID is required");

  const receipt = await getReceiptData(transactionId);

  try {
    assertReceiptAccess(receipt, userId, role);
  } catch (error) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: (error as Error).message,
    });
    return;
  }

  const pdf = await buildReceiptPdf(receipt);
  const fileName = receiptFileName(receipt.transaction.receiptNumber);
  const disposition = req.query.inline === "true" ? "inline" : "attachment";

  await createAuditLog({
    performedById: userId,
    action: "EXPORT",
    module: "FeePayment",
    resourceId: receipt.transaction.receiptNumber,
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
