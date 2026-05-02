import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { CreateHolidaySchema } from "../validations/input.validations";
import {
  createHolidayService,
  deleteHolidayService,
  getAllHolidaysService,
} from "../services/holiday.service";
import { HTTP_STATUS } from "../utils/constants";

export async function createHoliday(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  const parsed = CreateHolidaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);
  const newHoliday = await createHolidayService(
    schoolId,
    moderatorId,
    parsed.data,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Holiday created",
    data: newHoliday,
  });
}

export async function getAllHolidays(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const month = parseInt(req.query.month as string) || undefined;
  const year = parseInt(req.query.year as string) || undefined;

  const filters = {
    month,
    year,
  };

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  res.status(HTTP_STATUS.OK);

  const holidayList = await getAllHolidaysService(
    schoolId,
    moderatorId,
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched list of holidays",
    data: holidayList,
  });
}

export async function deleteHoliday(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  const holidayId = req.query.holidayId as string;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  res.status(HTTP_STATUS.OK);

  await deleteHolidayService(
    schoolId,
    moderatorId,
    holidayId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Holiday deleted successfully",
  });
}
