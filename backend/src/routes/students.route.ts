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

const router: Router = Router();

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
