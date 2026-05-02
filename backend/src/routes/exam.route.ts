import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createExamSchedule,
  getExamScheduleForAdmin,
  getExamScheduleForStudent,
  getExamScheduleForTeacher,
} from "../controller/exam.controller";

const router: Router = Router();

router.post(
  "/:classId/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createExamSchedule,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getExamScheduleForAdmin,
);

router.get(
  "/teacher",
  authenticate,
  authorize("TEACHER"),
  getExamScheduleForTeacher,
);

router.get(
  "/student",
  authenticate,
  authorize("STUDENT"),
  getExamScheduleForStudent,
);

export default router;
