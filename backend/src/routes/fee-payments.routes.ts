import { Router } from "express";
import { Module } from "@prisma/client";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  collectStudentFees,
  downloadFeeReceipt,
  getFeeStudentDetail,
  getMyFees,
  listFeePayments,
  listFeeStudents,
  reverseFeeReceipt,
  waiveFeePayment,
} from "../controller/fee-payment.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("FeePaymentController"));

router.get("/me", authenticate, authorize("STUDENT", "PARENT"), getMyFees);

router.get(
  "/students",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canRead"),
  listFeeStudents,
);

router.get(
  "/students/:studentId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canRead"),
  getFeeStudentDetail,
);

router.post(
  "/students/:studentId/collect",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canCreate"),
  collectStudentFees,
);

router.get(
  "/receipts/:receiptId/pdf",
  authenticate,
  authorize("ADMIN", "MODERATOR", "STUDENT", "PARENT"),
  downloadFeeReceipt,
);

router.patch(
  "/receipts/:receiptId/reverse",
  authenticate,
  authorize("ADMIN"),
  reverseFeeReceipt,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canRead"),
  listFeePayments,
);

router.patch(
  "/:billId/waive",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canApprove"),
  waiveFeePayment,
);

export default router;
