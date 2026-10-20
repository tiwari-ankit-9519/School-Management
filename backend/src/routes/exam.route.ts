import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createExamSchedule,
  getExamScheduleForAdmin,
  getExamScheduleForStudent,
  getExamScheduleForTeacher,
} from "../controller/exam.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("ExamController"));

router.post(
  "/:classId/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.EXAM_SCHEDULE, "canCreate"),
  createExamSchedule,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.EXAM_SCHEDULE, "canRead"),
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
