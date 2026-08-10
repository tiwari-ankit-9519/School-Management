import { SchoolConfig } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import { UpdateSchoolSettingsType } from "../validations/input.validations";

const log = createModuleLogger("SchoolSettingsService");

export async function getSchoolSettingsService(
  adminId: string,
  statusCode: number,
  context: AuditContext,
): Promise<SchoolConfig> {
  try {
    log.info(
      `Fetching school settings for adminId: ${adminId}, statusCode: ${statusCode}, context: ${JSON.stringify(context)}`,
    );

    const schoolConfig = await prisma.schoolConfig.findFirst();

    if (!schoolConfig) {
      log.warn(`School settings not found, statusCode: ${statusCode}`);
      throw new Error(`School settings not found for adminId: ${adminId}`);
    }

    await createSystemLog({
      level: "INFO",
      message: "School settings fetched successfully",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: {
        adminId,
        schoolId: schoolConfig.id,
        schoolName: schoolConfig.name,
        schoolAddress: schoolConfig.address,
      },
    });

    log.info(`Successfully fetched school settings, statusCode: ${statusCode}`);

    return schoolConfig;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Error fetching school settings for adminId: ${adminId}, statusCode: ${statusCode}, context: ${JSON.stringify(context)}. Error: ${err.message}`,
    );
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
    const settings = await prisma.schoolConfig.findFirst();

    if (!settings) {
      log.warn(`School settings not found, statusCode: ${statusCode}`);
      throw new Error(`School settings not found for adminId: ${adminId}`);
    }

    const updatedSettings = await prisma.schoolConfig.update({
      where: { id: settings.id },
      data: {
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
      },
    });

    await createSystemLog({
      level: "INFO",
      message: "School settings updated successfully",
      module: "SchoolSettingsService",
      context,
      statusCode,
      metadata: {
        adminId,
        schoolId: updatedSettings.id,
        schoolName: updatedSettings.name,
        schoolAddress: updatedSettings.address,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      resourceId: updatedSettings.id,
      resourceType: "SchoolConfig",
      performedById: adminId,
      statusCode,
      context,
      oldValues: {
        email: settings.email,
        phone: settings.phone,
        logoUrl: settings.logoUrl,
        website: settings.website,
      },
      newValues: {
        email: updatedSettings.email,
        phone: updatedSettings.phone,
        logoUrl: updatedSettings.logoUrl,
        website: updatedSettings.website,
      },
      isSuccessful: true,
      module: "SchoolSettingsService",
    });

    log.info(`Successfully updated school settings, statusCode: ${statusCode}`);

    return updatedSettings;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Error updating school settings, statusCode: ${statusCode}, context: ${JSON.stringify(context)}. Error: ${err.message}`,
    );
    throw err;
  }
}
