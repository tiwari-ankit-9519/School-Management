import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  CreateHolidaySchema,
  HolidayListQuery,
  UpdateHolidaySchema,
} from "../validations/input.validations";
import {
  HolidayAttendanceConflictError,
  createHolidayService,
  deleteHolidayService,
  getAllHolidaysService,
  updateHolidayService,
} from "../services/holiday.service";
import { HTTP_STATUS } from "../utils/constants";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) throw new Error("User ID is required");
  return userId;
};

const requireHolidayId = (req: AuthenticatedRequest): string | null => {
  const holidayId = req.params.holidayId;
  return typeof holidayId === "string" && holidayId ? holidayId : null;
};

const sendAttendanceConflict = (
  res: Response,
  error: HolidayAttendanceConflictError,
): void => {
  res.status(HTTP_STATUS.CONFLICT).json({
    success: false,
    code: "ATTENDANCE_EXISTS",
    message: error.message,
    data: { date: error.date, ...error.counts },
  });
};

export async function createHoliday(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = CreateHolidaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const userId = requireUserId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.CREATED);

  try {
    const result = await createHolidayService(
      userId,
      parsed.data,
      auditContext,
      res.statusCode,
    );
    res.json({
      success: true,
      message:
        result.convertedAttendance > 0
          ? `Holiday created. ${result.convertedAttendance} attendance records were marked as holiday`
          : "Holiday created",
      data: result,
    });
  } catch (error) {
    if (error instanceof HolidayAttendanceConflictError) {
      sendAttendanceConflict(res, error);
      return;
    }
    throw error;
  }
}

export async function updateHoliday(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = UpdateHolidaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const holidayId = requireHolidayId(req);
  if (!holidayId) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, message: "Holiday ID is required" });
    return;
  }

  const userId = requireUserId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  try {
    const result = await updateHolidayService(
      userId,
      holidayId,
      parsed.data,
      auditContext,
      res.statusCode,
    );
    res.json({
      success: true,
      message:
        result.convertedAttendance > 0
          ? `Holiday updated. ${result.convertedAttendance} attendance records were marked as holiday`
          : "Holiday updated",
      data: result,
    });
  } catch (error) {
    if (error instanceof HolidayAttendanceConflictError) {
      sendAttendanceConflict(res, error);
      return;
    }
    throw error;
  }
}

export async function getAllHolidays(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = HolidayListQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid filters",
      errors: parsed.error.issues,
    });
    return;
  }

  const userId = requireUserId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  const holidayList = await getAllHolidaysService(
    userId,
    auditContext,
    res.statusCode,
    parsed.data,
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
  const holidayId = requireHolidayId(req);
  if (!holidayId) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, message: "Holiday ID is required" });
    return;
  }

  const userId = requireUserId(req);
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);

  await deleteHolidayService(userId, holidayId, auditContext, res.statusCode);

  res.json({
    success: true,
    message: "Holiday deleted successfully",
  });
}
