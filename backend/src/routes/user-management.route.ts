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
  updateUserPermissions,
} from "../controller/user-management.controller";
import { upload } from "../config/cloudinary.config";
import { checkPermission } from "../middlewares/auth.middleware";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/moderator/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createModerator,
);

router.patch(
  "/:userId/permissions",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMIN, "canUpdate"),
  updateUserPermissions,
);

router.post(
  "/:schoolId/teacher/apply",
  upload.array("documents", 5),
  createTeacherApplication,
);

router.patch(
  "/teacher/:id/approve",
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
  upload.array("documents", 5),
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
