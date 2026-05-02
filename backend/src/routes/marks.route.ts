import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  gradeExam,
  updateMark,
  getMarksForAdmin,
  getMarksForTeacher,
  getMarksForStudent,
} from "@/src/controller/marks.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post("/:subjectId/grade", authenticate, authorize("TEACHER"), gradeExam);

router.patch("/:markId", authenticate, authorize("TEACHER"), updateMark);

router.get(
  "/admin/:subjectId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.MARK, "canRead"),
  getMarksForAdmin,
);

router.get(
  "/teacher/:subjectId",
  authenticate,
  authorize("TEACHER"),
  getMarksForTeacher,
);

router.get(
  "/student/:subjectId",
  authenticate,
  authorize("STUDENT"),
  getMarksForStudent,
);

export default router;
