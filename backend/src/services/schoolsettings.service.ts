import { SchoolConfig } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { prisma } from "../config/database.config";
import { createSystemLog } from "../utils/audit.util";

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
