import { Role } from "@prisma/client";
import type { TransformationOptions } from "cloudinary";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import {
  deleteFromCloudinary,
  extractPublicId,
  uploadToCloudinary,
} from "../config/cloudinary.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { CACHE_KEYS, deleteCache } from "../utils/cache.util";

const log = createModuleLogger("ProfilePhotoService");

const PHOTO_FOLDER = "profile-photos";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const AVATAR_TRANSFORMATION: TransformationOptions = [
  { width: 400, height: 400, crop: "fill", gravity: "face" },
  { quality: "auto:good" },
  { fetch_format: "auto" },
];

type PhotoResourceType = "Student" | "Teacher" | "Parent" | "Admin";

interface PhotoOwner {
  id: string;
  photoUrl: string | null;
  resourceType: PhotoResourceType;
}

const photoSelect = { id: true, photoUrl: true } as const;

async function findPhotoOwner(userId: string, role: Role): Promise<PhotoOwner> {
  switch (role) {
    case Role.STUDENT: {
      const record = await prisma.student.findUnique({
        where: { userId },
        select: photoSelect,
      });
      if (!record) throw new Error("Student not found");
      return { ...record, resourceType: "Student" };
    }
    case Role.TEACHER: {
      const record = await prisma.teacher.findUnique({
        where: { userId },
        select: photoSelect,
      });
      if (!record) throw new Error("Teacher not found");
      return { ...record, resourceType: "Teacher" };
    }
    case Role.PARENT: {
      const record = await prisma.parent.findUnique({
        where: { userId },
        select: photoSelect,
      });
      if (!record) throw new Error("Parent not found");
      return { ...record, resourceType: "Parent" };
    }
    case Role.ADMIN:
    case Role.MODERATOR: {
      const record = await prisma.admin.findUnique({
        where: { userId },
        select: photoSelect,
      });
      if (!record) throw new Error("Admin not found");
      return { ...record, resourceType: "Admin" };
    }
    default:
      throw new Error(`Profile photo not supported for role: ${role}`);
  }
}

async function savePhotoUrl(
  userId: string,
  role: Role,
  photoUrl: string | null,
): Promise<void> {
  switch (role) {
    case Role.STUDENT:
      await prisma.student.update({ where: { userId }, data: { photoUrl } });
      return;
    case Role.TEACHER:
      await prisma.teacher.update({ where: { userId }, data: { photoUrl } });
      return;
    case Role.PARENT:
      await prisma.parent.update({ where: { userId }, data: { photoUrl } });
      return;
    case Role.ADMIN:
    case Role.MODERATOR:
      await prisma.$transaction([
        prisma.admin.update({ where: { userId }, data: { photoUrl } }),
        prisma.teacher.updateMany({ where: { userId }, data: { photoUrl } }),
      ]);
      return;
    default:
      throw new Error(`Profile photo not supported for role: ${role}`);
  }
}

async function isPhotoStillReferenced(photoUrl: string): Promise<boolean> {
  const [admissions, teacherApplications, students, teachers, parents, admins] =
    await Promise.all([
      prisma.admissionApplication.count({
        where: { OR: [{ photoUrl }, { guardianPhotoUrl: photoUrl }] },
      }),
      prisma.teacherApplication.count({ where: { photoUrl } }),
      prisma.student.count({ where: { photoUrl } }),
      prisma.teacher.count({ where: { photoUrl } }),
      prisma.parent.count({ where: { photoUrl } }),
      prisma.admin.count({ where: { photoUrl } }),
    ]);
  return (
    admissions + teacherApplications + students + teachers + parents + admins >
    0
  );
}

async function deletePhotoIfUnused(photoUrl: string): Promise<boolean> {
  if (await isPhotoStillReferenced(photoUrl)) {
    log.info("Previous photo is still referenced elsewhere, keeping it", {
      photoUrl,
    });
    return false;
  }
  const publicId = extractPublicId(photoUrl);
  if (!publicId) {
    log.warn("Could not extract Cloudinary public id from photo URL", {
      photoUrl,
    });
    return false;
  }
  await deleteFromCloudinary(publicId);
  return true;
}

export async function updateMyPhotoService(
  userId: string,
  role: Role,
  file: Express.Multer.File | undefined,
  context: AuditContext,
  statusCode: number,
): Promise<{ photoUrl: string }> {
  try {
    if (!file) throw new Error("Photo file is required");
    if (!PHOTO_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("Only JPEG, PNG or WEBP images are allowed");
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error("Photo must be 2 MB or smaller");
    }

    log.info(`Updating profile photo for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
      role,
    });

    const owner = await findPhotoOwner(userId, role);
    const uploaded = await uploadToCloudinary(
      file,
      PHOTO_FOLDER,
      AVATAR_TRANSFORMATION,
    );

    try {
      await savePhotoUrl(userId, role, uploaded.secureUrl);
    } catch (error) {
      await deleteFromCloudinary(uploaded.publicId);
      throw error;
    }

    const previousDeleted = owner.photoUrl
      ? await deletePhotoIfUnused(owner.photoUrl)
      : false;
    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfilePhotoService",
      message: "Profile photo updated",
      context,
      statusCode,
      metadata: {
        userId,
        role,
        publicId: uploaded.publicId,
        previousDeleted,
      },
    });

    await createAuditLog({
      context,
      module: "ProfilePhotoService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: owner.id,
      resourceType: owner.resourceType,
      oldValues: { photoUrl: owner.photoUrl },
      newValues: { photoUrl: uploaded.secureUrl },
      isSuccessful: true,
    });

    log.info(`Profile photo updated for user ${userId}`, { previousDeleted });
    return { photoUrl: uploaded.secureUrl };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to update profile photo", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function removeMyPhotoService(
  userId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
): Promise<{ photoUrl: null }> {
  try {
    log.info(`Removing profile photo for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
      role,
    });

    const owner = await findPhotoOwner(userId, role);
    if (!owner.photoUrl) {
      log.info("No profile photo to remove", { userId });
      return { photoUrl: null };
    }

    await savePhotoUrl(userId, role, null);
    const previousDeleted = await deletePhotoIfUnused(owner.photoUrl);
    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfilePhotoService",
      message: "Profile photo removed",
      context,
      statusCode,
      metadata: { userId, role, previousDeleted },
    });

    await createAuditLog({
      context,
      module: "ProfilePhotoService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: owner.id,
      resourceType: owner.resourceType,
      oldValues: { photoUrl: owner.photoUrl },
      newValues: { photoUrl: null },
      isSuccessful: true,
    });

    log.info(`Profile photo removed for user ${userId}`, { previousDeleted });
    return { photoUrl: null };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to remove profile photo", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}
