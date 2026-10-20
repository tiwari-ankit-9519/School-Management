import {
  Announcement,
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

const log = createModuleLogger("AnnouncementService");

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetRoles: Role[];
  expiresAt?: string;
  sendNotification?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  targetRoles?: Role[];
  expiresAt?: string | null;
  isActive?: boolean;
}

export async function createAnnouncementService(
  createdBy: string,
  data: CreateAnnouncementInput,
  context: AuditContext,
  statusCode: number,
): Promise<Announcement> {
  try {
    log.info(`Starting service to create announcement`, {
      ipAddress: context.ipAddress,
      createdBy,
    });

    if (!data.targetRoles || data.targetRoles.length === 0) {
      throw new Error("At least one target role is required");
    }

    const validRoles: Role[] = [
      Role.ADMIN,
      Role.TEACHER,
      Role.STUDENT,
      Role.PARENT,
    ];
    const invalidRoles = data.targetRoles.filter(
      (r) => !validRoles.includes(r),
    );
    if (invalidRoles.length > 0) {
      throw new Error(
        `Invalid target roles: ${invalidRoles.join(", ")}. Allowed: ${validRoles.join(", ")}`,
      );
    }

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      throw new Error("Expiry date must be in the future");
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const newAnnouncement = await tx.announcement.create({
        data: {
          createdBy,
          title: data.title,
          content: data.content,
          targetRoles: data.targetRoles,
          isActive: true,
          ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
        },
      });

      if (data.sendNotification !== false) {
        const targetUsers = await tx.user.findMany({
          where: { role: { in: data.targetRoles }, isActive: true },
          select: { id: true },
        });

        if (targetUsers.length > 0) {
          const notification = await tx.notification.create({
            data: {
              senderId: createdBy,
              announcementId: newAnnouncement.id,
              title: data.title,
              message: data.content.slice(0, 500),
              type: NotificationType.ANNOUNCEMENT,
              channel: NotificationChannel.IN_APP,
            },
          });

          await tx.notificationRecipient.createMany({
            data: targetUsers.map((u) => ({
              notificationId: notification.id,
              userId: u.id,
            })),
          });

          const ssePayload = JSON.stringify({
            id: notification.id,
            title: newAnnouncement.title,
            message: data.content.slice(0, 500),
            type: NotificationType.ANNOUNCEMENT,
            channel: NotificationChannel.IN_APP,
            announcementId: newAnnouncement.id,
            createdAt: newAnnouncement.publishedAt,
          });

          await Promise.allSettled(
            targetUsers.map((u) =>
              redis.publish(`notifications:${u.id}`, ssePayload),
            ),
          );

          log.info(
            `Announcement notification pushed to ${targetUsers.length} users via Redis`,
          );
        }
      }

      return newAnnouncement;
    });

    await createSystemLog({
      level: "INFO",
      module: "AnnouncementService",
      message: "Announcement created successfully",
      context,
      statusCode,
      metadata: { createdBy, announcementId: announcement.id },
    });

    await createAuditLog({
      context,
      module: "AnnouncementService",
      statusCode,
      action: "CREATE",
      performedById: createdBy,
      resourceId: announcement.id,
      resourceType: "Announcement",
      newValues: { announcement },
      isSuccessful: true,
    });

    log.info(`Announcement created successfully with id ${announcement.id}`);
    return announcement;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to create announcement`, {
      error: err.message,
      ipAddress: context.ipAddress,
      createdBy,
    });
    throw err;
  }
}

export async function getAnnouncementsForAdminService(
  moderatorId: string,
  filters: {
    targetRole?: Role;
    isActive?: boolean;
    fromDate?: string;
    toDate?: string;
    sortBy?: "publishedAt" | "createdAt" | "expiresAt";
    sortOrder?: "asc" | "desc";
  },
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch announcements for admin`, {
      ipAddress: context.ipAddress,
      moderatorId,
    });

    const sortBy = filters?.sortBy ?? "publishedAt";
    const sortOrder = filters?.sortOrder ?? "desc";

    const cacheKey = CACHE_KEYS.adminAnnouncements(
      moderatorId,
      filters?.targetRole || "ALL",
      filters?.isActive?.toString() || "ALL",
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      sortBy,
      sortOrder,
      page,
      limit,
    );

    const cached = await getCache<{
      data: Announcement[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning announcements from cache`, { cacheKey });
      return cached;
    }

    const where: Prisma.AnnouncementWhereInput = {};

    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.targetRole) {
      where.targetRoles = { has: filters.targetRole };
    }
    if (filters?.fromDate || filters?.toDate) {
      where.publishedAt = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }

    const [announcements, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.announcement.count({ where }),
    ]);

    const response = {
      data: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ANNOUNCEMENTS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetAdminAnnouncements",
      message: "Fetched announcements for admin",
      context,
      statusCode,
      metadata: { moderatorId, filters },
    });

    log.info(`Fetched ${announcements.length} announcements`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch announcements for admin`, {
      error: err.message,
      ipAddress: context.ipAddress,
      moderatorId,
    });
    throw err;
  }
}

export async function getAnnouncementsForRoleService(
  userId: string,
  role: Role,
  filters: {
    fromDate?: string;
    toDate?: string;
    sortOrder?: "asc" | "desc";
  },
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch announcements for role ${role}`, {
      ipAddress: context.ipAddress,
      userId,
      role,
    });

    const sortOrder = filters?.sortOrder ?? "desc";

    const cacheKey = CACHE_KEYS.roleAnnouncements(
      role,
      filters?.fromDate || "ALL",
      filters?.toDate || "ALL",
      sortOrder,
      page,
      limit,
    );

    const cached = await getCache<{
      data: Announcement[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cached) {
      log.info(`Returning role announcements from cache`, { cacheKey });
      return cached;
    }

    const now = new Date();
    const where: Prisma.AnnouncementWhereInput = {
      isActive: true,
      targetRoles: { has: role },
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    if (filters?.fromDate || filters?.toDate) {
      where.publishedAt = {
        ...(filters.fromDate && { gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { lte: new Date(filters.toDate) }),
      };
    }

    const [announcements, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: sortOrder },
      }),
      prisma.announcement.count({ where }),
    ]);

    const response = {
      data: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ANNOUNCEMENTS_LIST);

    await createSystemLog({
      level: "INFO",
      module: "GetRoleAnnouncements",
      message: `Fetched announcements for role ${role}`,
      context,
      statusCode,
      metadata: { userId, role, filters },
    });

    log.info(`Fetched ${announcements.length} announcements for role ${role}`);
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch announcements for role ${role}`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function getAnnouncementByIdService(
  announcementId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Announcement> {
  try {
    log.info(`Fetching announcement by id ${announcementId}`);

    const cacheKey = CACHE_KEYS.announcementById(announcementId);
    const cached = await getCache<Announcement>(cacheKey);
    if (cached) return cached;

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error(`Announcement not found with id ${announcementId}`);
    }

    await setCache(cacheKey, announcement, CACHE_TTL.ANNOUNCEMENT_DETAIL);

    await createSystemLog({
      level: "INFO",
      module: "GetAnnouncementById",
      message: "Fetched announcement by id",
      context,
      statusCode,
      metadata: { announcementId },
    });

    return announcement;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch announcement by id`, {
      error: err.message,
      announcementId,
    });
    throw err;
  }
}

export async function updateAnnouncementService(
  performedById: string,
  announcementId: string,
  data: UpdateAnnouncementInput,
  context: AuditContext,
  statusCode: number,
): Promise<Announcement> {
  try {
    log.info(`Updating announcement ${announcementId}`);

    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      throw new Error(`Announcement not found with id ${announcementId}`);
    }

    if (data.targetRoles && data.targetRoles.length === 0) {
      throw new Error("At least one target role is required");
    }

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      throw new Error("Expiry date must be in the future");
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.targetRoles !== undefined && {
          targetRoles: data.targetRoles,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
    });

    await deleteCache(CACHE_KEYS.announcementById(announcementId));

    await createAuditLog({
      context,
      module: "AnnouncementService",
      statusCode,
      action: "UPDATE",
      performedById,
      resourceId: announcementId,
      resourceType: "Announcement",
      oldValues: { announcement: existing },
      newValues: { announcement: updated },
      isSuccessful: true,
    });

    log.info(`Announcement ${announcementId} updated successfully`);
    return updated;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to update announcement`, {
      error: err.message,
      announcementId,
    });
    throw err;
  }
}

export async function deleteAnnouncementService(
  performedById: string,
  announcementId: string,
  context: AuditContext,
  statusCode: number,
): Promise<{ success: boolean }> {
  try {
    log.info(`Deleting announcement ${announcementId}`);

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error(`Announcement not found with id ${announcementId}`);
    }

    await prisma.announcement.delete({ where: { id: announcementId } });

    await deleteCache(CACHE_KEYS.announcementById(announcementId));

    await createAuditLog({
      context,
      module: "AnnouncementService",
      statusCode,
      action: "DELETE",
      performedById,
      resourceId: announcementId,
      resourceType: "Announcement",
      oldValues: { announcement },
      isSuccessful: true,
    });

    log.info(`Announcement ${announcementId} deleted successfully`);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to delete announcement`, {
      error: err.message,
      announcementId,
    });
    throw err;
  }
}
