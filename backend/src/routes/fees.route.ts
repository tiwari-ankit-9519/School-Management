import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createFeeStructure,
  getFeeStructureForClass,
  updateFeeStructure,
} from "../controller/fees.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("FeesController"));

router.post(
  "/create/:classGroupId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createFeeStructure,
);

router.get(
  "/:classGroupId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getFeeStructureForClass,
);

router.patch(
  "/update/:feeId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  updateFeeStructure,
);

export default router;
