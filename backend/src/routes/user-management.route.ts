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
  getAllAdmins,
  getSingleAdmin,
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
  "/teacher/apply",
  upload.array("documents", 5),
  createTeacherApplication,
);

router.patch(
  "/teacher/:applicationId/approve",
  authenticate,
  authorize("ADMIN"),
  approveTeacherApplication,
);

router.patch(
  "/teacher/:applicationId/shortlist",
  authenticate,
  authorize("MODERATOR"),
  shortlistTeacherApplication,
);

router.patch(
  "/teacher/:applicationId/reject",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  rejectTeacherApplication,
);

router.patch(
  "/teacher/:applicationId/resubmit",
  upload.array("documents", 5),
  resubmitTeacherApplication,
);

router.get(
  "/teacher/applications",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  viewAllTeacherApplications,
);

router.get("/all-admins", authenticate, authorize("ADMIN"), getAllAdmins);

router.get("/:moderatorId", authenticate, authorize("ADMIN"), getSingleAdmin);

router.get(
  "/teacher/:applicationId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  viewTeacherApplication,
);

export default router;
