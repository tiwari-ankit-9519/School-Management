import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import {
  getSchoolSettingsService,
  removeSchoolLogoService,
  updateSchoolSettingsService,
  uploadSchoolLogoService,
} from "../services/schoolsettings.service";
import { UpdateSchoolSettingsPayload } from "../validations/input.validations";

const requireAdminId = (req: AuthenticatedRequest): string => {
  const adminId = req.user?.id;
  if (!adminId) throw new Error("Admin ID is missing in the request");
  return adminId;
};

export async function getSchoolSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const schoolSettings = await getSchoolSettingsService(
    adminId,
    res.statusCode,
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

  const adminId = requireAdminId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const updatedSettings = await updateSchoolSettingsService(
    parsed.data,
    adminId,
    res.statusCode,
    auditContext,
  );

  res.json({
    success: true,
    message: "School settings updated successfully",
    data: updatedSettings,
  });
}

export async function uploadSchoolLogo(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const updatedSettings = await uploadSchoolLogoService(
    req.file,
    adminId,
    res.statusCode,
    auditContext,
  );

  res.json({
    success: true,
    message: "School logo updated successfully",
    data: updatedSettings,
  });
}

export async function removeSchoolLogo(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const updatedSettings = await removeSchoolLogoService(
    adminId,
    res.statusCode,
    auditContext,
  );

  res.json({
    success: true,
    message: "School logo removed successfully",
    data: updatedSettings,
  });
}
