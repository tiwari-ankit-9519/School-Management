import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import {
  getSchoolSettingsService,
  updateSchoolSettingsService,
} from "../services/schoolsettings.service";
import { UpdateSchoolSettingsPayload } from "../validations/input.validations";

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

export async function updateSchoolSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = UpdateSchoolSettingsPayload.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid request payload",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  if (!adminId) {
    throw new Error("Admin ID is missing in the request");
  }

  const statusCode = HTTP_STATUS.OK;

  const auditContext = buildAuditContext(req);

  const updatedSettings = await updateSchoolSettingsService(
    parsed.data,
    adminId,
    statusCode,
    auditContext,
  );

  res.json({
    success: true,
    message: "School settings updated successfully",
    data: updatedSettings,
  });
}
