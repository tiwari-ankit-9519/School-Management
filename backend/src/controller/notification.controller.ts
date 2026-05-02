import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import { NotificationChannel, NotificationType } from "@prisma/client";
import {
  createNotificationService,
  getNotificationsForUserService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
} from "../services/notification.service";

export async function createNotification(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const senderId = req.user?.id;

  if (!schoolId) throw new Error("School ID is required");
  if (!senderId) throw new Error("Sender ID is required");

  const {
    title,
    message,
    type,
    channel,
    recipientUserIds,
    announcementId,
    metadata,
  } = req.body;

  if (!title || !message) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "title and message are required",
    });
    return;
  }

  if (
    !recipientUserIds ||
    !Array.isArray(recipientUserIds) ||
    recipientUserIds.length === 0
  ) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "recipientUserIds must be a non-empty array",
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  const notification = await createNotificationService(
    schoolId,
    senderId,
    {
      title,
      message,
      type,
      channel,
      recipientUserIds,
      announcementId,
      metadata,
    },
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Notification created and sent successfully",
    data: notification,
  });
}

export async function getNotificationsForUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;

  if (!schoolId) throw new Error("School ID is required");
  if (!userId) throw new Error("User ID is required");

  const isReadRaw = req.query.isRead as string | undefined;
  const isRead =
    isReadRaw === "true" ? true : isReadRaw === "false" ? false : undefined;

  const type = req.query.type as NotificationType | undefined;
  const channel = req.query.channel as NotificationChannel | undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const filters = { isRead, type, channel, fromDate, toDate, sortOrder };

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await getNotificationsForUserService(
    schoolId,
    userId,
    filters,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: "Fetched notifications",
    data: result,
  });
}

export async function markNotificationAsRead(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;
  const notificationId = req.params.notificationId as string;

  if (!schoolId) throw new Error("School ID is required");
  if (!userId) throw new Error("User ID is required");
  if (!notificationId) throw new Error("Notification ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await markNotificationAsReadService(
    schoolId,
    userId,
    notificationId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Notification marked as read",
    data: result,
  });
}

export async function markAllNotificationsAsRead(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;

  if (!schoolId) throw new Error("School ID is required");
  if (!userId) throw new Error("User ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await markAllNotificationsAsReadService(
    schoolId,
    userId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
}

export async function deleteNotification(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const performedById = req.user?.id;
  const notificationId = req.params.notificationId as string;

  if (!schoolId) throw new Error("School ID is required");
  if (!performedById) throw new Error("Performer ID is required");
  if (!notificationId) throw new Error("Notification ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await deleteNotificationService(
    schoolId,
    performedById,
    notificationId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Notification deleted successfully",
    data: result,
  });
}
