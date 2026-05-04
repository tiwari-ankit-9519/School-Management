import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  CreateTimeTableSchema,
  UpdateTimeTableSchema,
} from "../validations/input.validations";
import {
  createTimeTableService,
  getTimeTableForClassService,
  swapTimeTableForClassService,
  updateTimeTableForClassService,
} from "../services/timetable.service";
import { HTTP_STATUS } from "../utils/constants";
import { DayOfWeek } from "@prisma/client";

export async function createTimeTable(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const parsed = CreateTimeTableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const moderatorId = req.user?.id;
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  res.status(HTTP_STATUS.CREATED);
  const newTimetable = await createTimeTableService(
    parsed.data,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Time Table created",
    data: newTimetable,
  });
}

export async function getTimeTableForClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const auditContext = buildAuditContext(req);
  const classId = req.params.classId as string;
  const dayOfWeek = req.query.dayOfWeek as DayOfWeek | undefined;
  if (!classId) {
    throw new Error("Class ID is required");
  }

  res.status(HTTP_STATUS.OK);

  const allTimeTable = await getTimeTableForClassService(
    classId,
    page,
    limit,
    auditContext,
    res.statusCode,
    dayOfWeek,
  );

  res.json({
    success: true,
    message: `Fetched time table for class ${classId}`,
    data: allTimeTable,
  });
}

export async function updatedTimeTable(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const timeTableId = req.params.timeTableId as string;
  const moderatorId = req.user?.id;
  const auditContext = buildAuditContext(req);
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  const parsed = UpdateTimeTableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  res.status(HTTP_STATUS.OK);

  const updateTimeTable = await updateTimeTableForClassService(
    timeTableId,
    parsed.data,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Updated time table with id ${timeTableId}`,
    data: updateTimeTable,
  });
}

export async function swapTimeTableForClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { timetableId1, timetableId2 } = req.body;
  const moderatorId = req.user?.id;
  const auditContext = buildAuditContext(req);
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  res.status(HTTP_STATUS.CREATED);

  const swappedTimeTable = await swapTimeTableForClassService(
    timetableId1,
    timetableId2,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Classes sawpped successfully`,
    data: swappedTimeTable,
  });
}
