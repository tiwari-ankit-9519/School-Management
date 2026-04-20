import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  assignTeacherToSubject,
  createSubject,
  getAllSubjects,
  GetSingleSubject,
  unassignTeacherFromSubject,
} from "../controller/subject.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createSubject,
);

router.post(
  "/:id/assign-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  assignTeacherToSubject,
);

router.delete(
  "/:id/unassign-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  unassignTeacherFromSubject,
);

router.get(
  "/all-subjects",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getAllSubjects,
);

router.get(
  "/:subjectId",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  GetSingleSubject,
);

export default router;
