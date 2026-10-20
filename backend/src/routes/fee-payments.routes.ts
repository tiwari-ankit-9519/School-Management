import { Router } from "express";
import { Module } from "@prisma/client";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  collectFeePayment,
  downloadFeeReceipt,
  getFeePaymentDetail,
  getMyFees,
  listFeePayments,
  reverseFeeTransaction,
  waiveFeePayment,
} from "../controller/fee-payment.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("FeePaymentController"));

router.get("/me", authenticate, authorize("STUDENT", "PARENT"), getMyFees);

router.get(
  "/transactions/:transactionId/receipt",
  authenticate,
  authorize("ADMIN", "MODERATOR", "STUDENT", "PARENT"),
  downloadFeeReceipt,
);

router.patch(
  "/transactions/:transactionId/reverse",
  authenticate,
  authorize("ADMIN"),
  reverseFeeTransaction,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canRead"),
  listFeePayments,
);

router.get(
  "/:billId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canRead"),
  getFeePaymentDetail,
);

router.post(
  "/:billId/collect",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canCreate"),
  collectFeePayment,
);

router.patch(
  "/:billId/waive",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_PAYMENT, "canApprove"),
  waiveFeePayment,
);

export default router;
