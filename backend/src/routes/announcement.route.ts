import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createAnnouncement,
  getAnnouncementsForAdmin,
  getAnnouncementsForRole,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controller/announcement.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createAnnouncement,
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
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
  updateAnnouncement,
);

router.delete(
  "/:announcementId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  deleteAnnouncement,
);

export default router;
