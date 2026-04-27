import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createExamSchedule } from "../controller/exam.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createExamSchedule,
);

export default router;
