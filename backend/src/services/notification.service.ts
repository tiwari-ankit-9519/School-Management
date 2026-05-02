import {
  Notification,
  NotificationChannel,
  NotificationType,
  Prisma,
  Role,
} from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_TTL,
  getCache,
  setCache,
  deleteCache,
} from "../utils/cache.util";

const log = createModuleLogger("NotificationService");

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  recipientUserIds: string[];
  announcementId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface NotificationWithRecipient extends Notification {
  isRead: boolean;
  readAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
}

export async function createNotificationService(
  schoolId: string,
  senderId: string,
  data: CreateNotificationInput,
  context: AuditContext,
  statusCode: number,
): Promise<Notification> {
  try {
    log.info(`Starting service to create notification`, {
      ipAddress: context.ipAddress,
      schoolId,
      senderId,
    });

    if (!data.recipientUserIds || data.recipientUserIds.length === 0) {
      throw new Error("At least one recipient is required");
    }

    const recipientCount = await prisma.user.count({
      where: {
        id: { in: data.recipientUserIds },
        schoolId,
        isActive: true,
      },
    });

    if (recipientCount !== data.recipientUserIds.length) {
      throw new Error(
        "One or more recipient users not found or don't belong to this school",
      );
    }

    if (data.announcementId) {
      const announcementExists = await prisma.announcement.findUnique({
        where: { id: data.announcementId, schoolId },
      });
      if (!announcementExists) {
        throw new Error(
          `Announcement not found with id ${data.announcementId}`,
        );
      }
    }

    const notification = await prisma.$transaction(async (tx) => {
      const newNotification = await tx.notification.create({
        data: {
          schoolId,
          senderId,
          title: data.title,
          message: data.message,
          type: data.type ?? NotificationType.INFO,
          channel: data.channel ?? NotificationChannel.IN_APP,
          announcementId: data.announcementId,
          ...(data.metadata !== undefined && { metadata: data.metadata }),
        },
      });

      await tx.notificationRecipient.createMany({
        data: data.recipientUserIds.map((userId) => ({
          notificationId: newNotification.id,
          userId,
        })),
      });

      return newNotification;
    });

    const payload = JSON.stringify({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channel: notification.channel,
      createdAt: notification.createdAt,
      metadata: notification.metadata,
    });

    await Promise.allSettled(
      data.recipientUserIds.map((userId) =>
        redis.publish(`notifications:${userId}`, payload),
      ),
    );

    log.info(
      `Notification published to ${data.recipientUserIds.length} recipients via Redis`,
    );

    await Promise.allSettled(
      data.recipientUserIds.map((userId) =>
        deleteCache(
          CACHE_KEYS.userNotifications(
            userId,
            "ALL",
            "ALL",
            "ALL",
            "ALL",
            "ALL",
            1,
            20,
            "desc",
          ),
        ),
      ),
    );

    await createSystemLog({
      level: "INFO",
      module: "NotificationService",
      message: "Notification created and sent successfully",
      context,
      statusCode,
      metadata: { schoolId, senderId, notificationId: notification.id },
    });

    await createAuditLog({
      schoolId,
      context,
      module: "NotificationService",
      statusCode,
      action: "CREATE",
      performedById: senderId,
      resourceId: notification.id,
      resourceType: "Notification",
      newValues: {
        notification,
        recipientCount: data.recipientUserIds.length,
      },
      isSuccessful: true,
    });

    log.info(`Notification created successfully with id ${notification.id}`);
    return notification;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to create notification`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      senderId,
    });
    throw err;
  }
}

export async function getNotificationsForUserService(
  schoolId: string,
  userId: string,
  filters: {
    isRead?: boolean;
    type?: NotificationType;
    channel?: NotificationChannel;
    fromDate?: string;
    toDate?: string;
    sortBy?: "createdAt";
    sortOrder?: "asc" | "desc";
  },
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: NotificationWithRecipient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}> {
  try {
    log.info(`Starting service to fetch notifications for user`, {
      ipAddress: context.ipAddress,
      schoolId,
      userId,
    });

    const sortOrder = filters?.sortOrder ?? "desc";

    const cacheKey = CACHE_KEYS.userNotifications(
      userId,
      filters?.isRead?.toString() || "ALL",
      filters?.type || "ALL",
      filters?.channel || "ALL",
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      page,
      limit,
      sortOrder,
    );

    const cached = await getCache<{
      data: NotificationWithRecipient[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      unreadCount: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning notifications from cache`, { cacheKey });
      return cached;
    }

    const recipientWhere: Prisma.NotificationRecipientWhereInput = {
      userId,
      ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
    };

    const notificationWhere: Prisma.NotificationWhereInput = {
      schoolId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.channel && { channel: filters.channel }),
      ...((filters?.fromDate || filters?.toDate) && {
        createdAt: {
          ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
          ...(filters.toDate && { lte: new Date(filters.toDate) }),
        },
      }),
    };

    const [recipients, total, unreadCount] = await prisma.$transaction([
      prisma.notificationRecipient.findMany({
        where: { ...recipientWhere, notification: notificationWhere },
        include: { notification: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { notification: { createdAt: sortOrder } },
      }),

      prisma.notificationRecipient.count({
        where: { ...recipientWhere, notification: notificationWhere },
      }),

      prisma.notificationRecipient.count({
        where: { userId, isRead: false, notification: { schoolId } },
      }),
    ]);

    const data: NotificationWithRecipient[] = recipients.map((r) => ({
      ...r.notification,
      isRead: r.isRead,
      readAt: r.readAt,
      isDelivered: r.isDelivered,
      deliveredAt: r.deliveredAt,
    }));

    const response = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };

    await setCache(cacheKey, response, CACHE_TTL.NOTIFICATIONS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetUserNotifications",
      message: "Fetched notifications for user",
      context,
      statusCode,
      metadata: { schoolId, userId, filters },
    });

    log.info(`Fetched ${data.length} notifications for user ${userId}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch notifications for user`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      userId,
    });
    throw err;
  }
}

export async function markNotificationAsReadService(
  schoolId: string,
  userId: string,
  notificationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ success: boolean }> {
  try {
    log.info(
      `Marking notification ${notificationId} as read for user ${userId}`,
    );

    const recipient = await prisma.notificationRecipient.findUnique({
      where: { notificationId_userId: { notificationId, userId } },
    });

    if (!recipient) {
      throw new Error(`Notification not found or not addressed to this user`);
    }

    if (recipient.isRead) {
      return { success: true };
    }

    await prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isRead: true, readAt: new Date() },
    });

    await deleteCache(
      CACHE_KEYS.userNotifications(
        userId,
        "ALL",
        "ALL",
        "ALL",
        "ALL",
        "ALL",
        1,
        20,
        "desc",
      ),
    );

    await createSystemLog({
      level: "INFO",
      module: "MarkNotificationRead",
      message: "Notification marked as read",
      context,
      statusCode,
      metadata: { schoolId, userId, notificationId },
    });

    log.info(`Notification ${notificationId} marked as read`);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to mark notification as read`, {
      error: err.message,
      notificationId,
      userId,
    });
    throw err;
  }
}

export async function markAllNotificationsAsReadService(
  schoolId: string,
  userId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ updatedCount: number }> {
  try {
    log.info(`Marking all notifications as read for user ${userId}`);

    const result = await prisma.notificationRecipient.updateMany({
      where: {
        userId,
        isRead: false,
        notification: { schoolId },
      },
      data: { isRead: true, readAt: new Date() },
    });

    await deleteCache(
      CACHE_KEYS.userNotifications(
        userId,
        "ALL",
        "ALL",
        "ALL",
        "ALL",
        "ALL",
        1,
        20,
        "desc",
      ),
    );

    await createSystemLog({
      level: "INFO",
      module: "MarkAllNotificationsRead",
      message: "All notifications marked as read",
      context,
      statusCode,
      metadata: { schoolId, userId, updatedCount: result.count },
    });

    log.info(`Marked ${result.count} notifications as read for user ${userId}`);
    return { updatedCount: result.count };
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to mark all notifications as read`, {
      error: err.message,
      userId,
      schoolId,
    });
    throw err;
  }
}

export async function deleteNotificationService(
  schoolId: string,
  performedById: string,
  notificationId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ success: boolean }> {
  try {
    log.info(`Deleting notification ${notificationId}`);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { recipients: { select: { userId: true } } },
    });

    if (!notification || notification.schoolId !== schoolId) {
      throw new Error(`Notification not found with id ${notificationId}`);
    }

    const affectedUserIds = notification.recipients.map((r) => r.userId);

    await prisma.notification.delete({ where: { id: notificationId } });

    await Promise.allSettled(
      affectedUserIds.map((userId) =>
        deleteCache(
          CACHE_KEYS.userNotifications(
            userId,
            "ALL",
            "ALL",
            "ALL",
            "ALL",
            "ALL",
            1,
            20,
            "desc",
          ),
        ),
      ),
    );

    await createAuditLog({
      schoolId,
      context,
      module: "NotificationService",
      statusCode,
      action: "DELETE",
      performedById,
      resourceId: notificationId,
      resourceType: "Notification",
      oldValues: { notification },
      isSuccessful: true,
    });

    log.info(`Notification ${notificationId} deleted successfully`);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to delete notification`, {
      error: err.message,
      notificationId,
      schoolId,
    });
    throw err;
  }
}
