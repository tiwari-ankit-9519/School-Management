import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  assignTeacherToSubject,
  createSubject,
  getAllSubjects,
  GetSingleSubject,
  unassignTeacherFromSubject,
} from "../controller/subject.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("SubjectController"));

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.SUBJECT, "canCreate"),
  createSubject,
);

router.post(
  "/:subjectId/assign-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER_SUBJECT, "canCreate"),
  assignTeacherToSubject,
);

router.delete(
  "/:subjectId/unassign-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER_SUBJECT, "canDelete"),
  unassignTeacherFromSubject,
);

router.get(
  "/all-subjects",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.SUBJECT, "canRead"),
  getAllSubjects,
);

router.get(
  "/:subjectId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.SUBJECT, "canRead"),
  GetSingleSubject,
);

export default router;
