import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  approveTeacherApplication,
  createModerator,
  createTeacherApplication,
  rejectTeacherApplication,
  resubmitTeacherApplication,
  shortlistTeacherApplication,
  viewAllTeacherApplications,
  viewTeacherApplication,
} from "../controller/user-management.controller";
import { upload } from "../config/cloudinary.config";

const router: Router = Router();

router.post(
  "/moderator/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createModerator,
);

router.post(
  "/:schoolId/teacher/apply",
  upload.array("documents", 5),
  createTeacherApplication,
);

router.patch(
  "/teacher/:id/create",
  authenticate,
  authorize("ADMIN"),
  approveTeacherApplication,
);

router.patch(
  "/teacher/:id/shortlist",
  authenticate,
  authorize("MODERATOR"),
  shortlistTeacherApplication,
);

router.patch(
  "/teacher/:id/reject",
  authenticate,
  authorize("MODERATOR"),
  rejectTeacherApplication,
);

router.patch(
  "/teacher/:id/resubmit",
  authenticate,
  authorize("MODERATOR"),
  resubmitTeacherApplication,
);

router.get(
  "/teacher/applications",
  authenticate,
  authorize("ADMIN"),
  viewAllTeacherApplications,
);

router.get(
  "/teacher/:applicationId",
  authenticate,
  authorize("ADMIN"),
  viewTeacherApplication,
);

export default router;
