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

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.SUBJECT, "canCreate"),
  createSubject,
);

router.post(
  "/:id/assign-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER_SUBJECT, "canCreate"),
  assignTeacherToSubject,
);

router.delete(
  "/:id/unassign-teacher",
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
