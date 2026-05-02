import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import { Role } from "@prisma/client";
import {
  createAnnouncementService,
  getAnnouncementsForAdminService,
  getAnnouncementsForRoleService,
  getAnnouncementByIdService,
  updateAnnouncementService,
  deleteAnnouncementService,
} from "../services/announcement.service";

export async function createAnnouncement(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const createdBy = req.user?.id;

  if (!schoolId) throw new Error("School ID is required");
  if (!createdBy) throw new Error("Creator ID is required");

  const { title, content, targetRoles, expiresAt, sendNotification } = req.body;

  if (!title || !content) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "title and content are required",
    });
    return;
  }

  if (!targetRoles || !Array.isArray(targetRoles) || targetRoles.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "targetRoles must be a non-empty array",
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  const announcement = await createAnnouncementService(
    schoolId,
    createdBy,
    { title, content, targetRoles, expiresAt, sendNotification },
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Announcement created successfully",
    data: announcement,
  });
}

export async function getAnnouncementsForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;

  if (!schoolId) throw new Error("School ID is required");
  if (!moderatorId) throw new Error("Moderator ID is required");

  const targetRole = req.query.targetRole as Role | undefined;
  const isActiveRaw = req.query.isActive as string | undefined;
  const isActive =
    isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : undefined;
  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortBy = req.query.sortBy as
    | "publishedAt"
    | "createdAt"
    | "expiresAt"
    | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filters = { targetRole, isActive, fromDate, toDate, sortBy, sortOrder };

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await getAnnouncementsForAdminService(
    schoolId,
    moderatorId,
    filters,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: "Fetched announcements for admin",
    data: result,
  });
}

export async function getAnnouncementsForRole(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;
  const role = req.user?.role as Role;

  if (!schoolId) throw new Error("School ID is required");
  if (!userId) throw new Error("User ID is required");
  if (!role) throw new Error("Role is required");

  const fromDate = req.query.fromDate as string | undefined;
  const toDate = req.query.toDate as string | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filters = { fromDate, toDate, sortOrder };

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await getAnnouncementsForRoleService(
    schoolId,
    userId,
    role,
    filters,
    auditContext,
    res.statusCode,
    page,
    limit,
  );

  res.json({
    success: true,
    message: `Fetched announcements for ${role.toLowerCase()}`,
    data: result,
  });
}

export async function getAnnouncementById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const announcementId = req.params.announcementId as string;

  if (!schoolId) throw new Error("School ID is required");
  if (!announcementId) throw new Error("Announcement ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const announcement = await getAnnouncementByIdService(
    schoolId,
    announcementId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Fetched announcement",
    data: announcement,
  });
}

export async function updateAnnouncement(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const performedById = req.user?.id;
  const announcementId = req.params.announcementId as string;

  if (!schoolId) throw new Error("School ID is required");
  if (!performedById) throw new Error("Performer ID is required");
  if (!announcementId) throw new Error("Announcement ID is required");

  const { title, content, targetRoles, expiresAt, isActive } = req.body;

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const updated = await updateAnnouncementService(
    schoolId,
    performedById,
    announcementId,
    { title, content, targetRoles, expiresAt, isActive },
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Announcement updated successfully",
    data: updated,
  });
}

export async function deleteAnnouncement(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const performedById = req.user?.id;
  const announcementId = req.params.announcementId as string;

  if (!schoolId) throw new Error("School ID is required");
  if (!performedById) throw new Error("Performer ID is required");
  if (!announcementId) throw new Error("Announcement ID is required");

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const result = await deleteAnnouncementService(
    schoolId,
    performedById,
    announcementId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Announcement deleted successfully",
    data: result,
  });
}
