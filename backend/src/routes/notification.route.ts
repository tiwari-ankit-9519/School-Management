import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controller/notification.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.NOTIFICATION, "canCreate"),
  createNotification,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  getNotificationsForUser,
);

router.patch(
  "/:notificationId/read",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  markNotificationAsRead,
);

router.patch(
  "/read-all",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  markAllNotificationsAsRead,
);

router.delete(
  "/:notificationId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.NOTIFICATION, "canDelete"),
  deleteNotification,
);

export default router;
