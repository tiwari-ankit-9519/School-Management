import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createFeeStructure,
  getFeeStructureForClass,
  updateFeeStructure,
} from "../controller/fees.controller";

const router: Router = Router();

router.post(
  "/create/:classId",
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
