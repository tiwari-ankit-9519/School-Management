import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  getAllStudentsList,
  getSingleStudentDetail,
} from "../controller/students.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("StudentsController"));

router.get(
  "/all",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.STUDENT, "canRead"),
  getAllStudentsList,
);

router.get(
  "/:studentId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.STUDENT, "canRead"),
  getSingleStudentDetail,
);

export default router;
