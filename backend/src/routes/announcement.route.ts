import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createAnnouncement,
  getAnnouncementsForAdmin,
  getAnnouncementsForRole,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controller/announcement.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ANNOUNCEMENT, "canCreate"),
  createAnnouncement,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ANNOUNCEMENT, "canRead"),
  getAnnouncementsForAdmin,
);

router.get(
  "/me",
  authenticate,
  authorize("TEACHER", "STUDENT", "PARENT"),
  getAnnouncementsForRole,
);

router.get(
  "/:announcementId",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  getAnnouncementById,
);

router.patch(
  "/:announcementId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ANNOUNCEMENT, "canUpdate"),
  updateAnnouncement,
);

router.delete(
  "/:announcementId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ANNOUNCEMENT, "canDelete"),
  deleteAnnouncement,
);

export default router;
