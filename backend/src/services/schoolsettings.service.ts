import { Prisma, SchoolConfig } from "@prisma/client";
import type { TransformationOptions } from "cloudinary";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { UpdateSchoolSettingsType } from "../validations/input.validations";
import {
  deleteFromCloudinary,
  extractPublicId,
  uploadToCloudinary,
} from "../config/cloudinary.config";

const log = createModuleLogger("SchoolSettingsService");

const LOGO_FOLDER = "school-logo";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const LOGO_TRANSFORMATION: TransformationOptions = [
  { width: 512, height: 512, crop: "fit" },
  { quality: "auto:good" },
  { fetch_format: "auto" },
];

const TRACKED_FIELDS = [
  "email",
  "phone",
  "website",
  "logoUrl",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "feeDueDay",
] as const;

const ADDRESS_FIELDS = ["address", "city", "state", "country", "pincode"];

const pickTracked = (config: SchoolConfig) =>
  Object.fromEntries(TRACKED_FIELDS.map((field) => [field, config[field]]));

async function getSchoolConfigOrThrow(adminId: string): Promise<SchoolConfig> {
  const settings = await prisma.schoolConfig.findFirst();
  if (!settings) {
    log.warn("School settings not found", { adminId });
    throw new Error("School settings not found");
  }
  return settings;
}

async function deleteStoredLogo(logoUrl: string | null): Promise<void> {
  if (!logoUrl) return;
  const publicId = extractPublicId(logoUrl);
  if (!publicId) {
    log.info("Previous logo is not a Cloudinary asset, skipping delete", {
      logoUrl,
    });
    return;
  }
  await deleteFromCloudinary(publicId);
}

export async function getSchoolSettingsService(
  adminId: string,
  statusCode: number,
  context: AuditContext,
): Promise<SchoolConfig> {
  try {
    log.info("Fetching school settings", {
      adminId,
      ipAddress: context.ipAddress,
    });

    const schoolConfig = await getSchoolConfigOrThrow(adminId);

    await createSystemLog({
      level: "INFO",
      message: "School settings fetched successfully",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: { adminId, schoolId: schoolConfig.id },
    });

    return schoolConfig;
  } catch (error) {
    const err = error as Error;
    log.error("Error fetching school settings", {
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function updateSchoolSettingsService(
  data: UpdateSchoolSettingsType,
  adminId: string,
  statusCode: number,
  context: AuditContext,
): Promise<SchoolConfig> {
  try {
    log.info("Updating school settings", {
      adminId,
      fields: Object.keys(data),
      ipAddress: context.ipAddress,
    });

    const settings = await getSchoolConfigOrThrow(adminId);

    const updateData: Prisma.SchoolConfigUpdateInput = {
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.website !== undefined && { website: data.website || null }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.pincode !== undefined && { pincode: data.pincode }),
      ...(data.feeDueDay !== undefined && { feeDueDay: data.feeDueDay }),
      ...(data.allowPartialPayments !== undefined && {
        allowPartialPayments: data.allowPartialPayments,
      }),
    };

    const updatedSettings = await prisma.schoolConfig.update({
      where: { id: settings.id },
      data: updateData,
    });

    const changedFields = Object.keys(updateData);
    const addressChanged = ADDRESS_FIELDS.some((field) =>
      changedFields.includes(field),
    );
    const feeDueDayChanged = changedFields.includes("feeDueDay");

    await createSystemLog({
      level: "INFO",
      message: "School settings updated successfully",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: {
        adminId,
        schoolId: updatedSettings.id,
        changedFields,
        addressChanged,
        feeDueDayChanged,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceId: updatedSettings.id,
      resourceType: "SchoolConfig",
      performedById: adminId,
      statusCode,
      context,
      oldValues: pickTracked(settings),
      newValues: pickTracked(updatedSettings),
      isSuccessful: true,
      module: "SchoolSettingsService",
    });

    log.info("School settings updated", { changedFields });
    return updatedSettings;
  } catch (error) {
    const err = error as Error;
    log.error("Error updating school settings", {
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function uploadSchoolLogoService(
  file: Express.Multer.File | undefined,
  adminId: string,
  statusCode: number,
  context: AuditContext,
): Promise<SchoolConfig> {
  try {
    if (!file) throw new Error("Logo file is required");
    if (!LOGO_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("Only PNG, JPEG or WEBP images are allowed");
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new Error("Logo must be 2 MB or smaller");
    }

    log.info("Uploading school logo", {
      adminId,
      ipAddress: context.ipAddress,
    });

    const settings = await getSchoolConfigOrThrow(adminId);
    const uploaded = await uploadToCloudinary(
      file,
      LOGO_FOLDER,
      LOGO_TRANSFORMATION,
    );

    let updatedSettings: SchoolConfig;
    try {
      updatedSettings = await prisma.schoolConfig.update({
        where: { id: settings.id },
        data: { logoUrl: uploaded.secureUrl },
      });
    } catch (error) {
      await deleteFromCloudinary(uploaded.publicId);
      throw error;
    }

    await deleteStoredLogo(settings.logoUrl);

    await createSystemLog({
      level: "INFO",
      message: "School logo updated",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: { adminId, publicId: uploaded.publicId },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceId: updatedSettings.id,
      resourceType: "SchoolConfig",
      performedById: adminId,
      statusCode,
      context,
      oldValues: { logoUrl: settings.logoUrl },
      newValues: { logoUrl: updatedSettings.logoUrl },
      isSuccessful: true,
      module: "SchoolSettingsService",
    });

    return updatedSettings;
  } catch (error) {
    const err = error as Error;
    log.error("Error uploading school logo", {
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function removeSchoolLogoService(
  adminId: string,
  statusCode: number,
  context: AuditContext,
): Promise<SchoolConfig> {
  try {
    log.info("Removing school logo", { adminId, ipAddress: context.ipAddress });

    const settings = await getSchoolConfigOrThrow(adminId);
    if (!settings.logoUrl) return settings;

    const updatedSettings = await prisma.schoolConfig.update({
      where: { id: settings.id },
      data: { logoUrl: null },
    });

    await deleteStoredLogo(settings.logoUrl);

    await createSystemLog({
      level: "INFO",
      message: "School logo removed",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: { adminId },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceId: updatedSettings.id,
      resourceType: "SchoolConfig",
      performedById: adminId,
      statusCode,
      context,
      oldValues: { logoUrl: settings.logoUrl },
      newValues: { logoUrl: null },
      isSuccessful: true,
      module: "SchoolSettingsService",
    });

    return updatedSettings;
  } catch (error) {
    const err = error as Error;
    log.error("Error removing school logo", {
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}
