import { Router } from "express";
import { Module } from "@prisma/client";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createFeeStructure,
  getFeeStructureForClass,
  updateFeeStructure,
  updateFeeStructureStatus,
} from "../controller/fees.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("FeesController"));

router.post(
  "/create/:classGroupId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_STRUCTURE, "canCreate"),
  createFeeStructure,
);

router.get(
  "/:classGroupId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_STRUCTURE, "canRead"),
  getFeeStructureForClass,
);

router.patch(
  "/update/:feeId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_STRUCTURE, "canUpdate"),
  updateFeeStructure,
);

router.patch(
  "/status/:feeId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.FEE_STRUCTURE, "canUpdate"),
  updateFeeStructureStatus,
);

export default router;
