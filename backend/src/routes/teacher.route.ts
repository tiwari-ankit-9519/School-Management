import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  getAllTeachers,
  getSingleTeacher,
  getTeacherApplicationStatus,
} from "../controller/teacher.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("TeacherController"));

router.get(
  "/all-teachers",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER, "canRead"),
  getAllTeachers,
);

router.get(
  "/:teacherId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER, "canRead"),
  getSingleTeacher,
);

router.get("/status/:applicationId", getTeacherApplicationStatus);

export default router;
