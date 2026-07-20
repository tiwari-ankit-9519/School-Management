import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import { getSchoolSettingsService } from "../services/schoolsettings.service";

export async function getSchoolSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new Error("Admin ID is missing in the request");
  }

  const statusCode = HTTP_STATUS.OK;

  const auditContext = buildAuditContext(req);

  const schoolSettings = await getSchoolSettingsService(
    adminId,
    statusCode,
    auditContext,
  );

  res.json({
    success: true,
    message: "School settings fetched successfully",
    data: schoolSettings,
  });
}
