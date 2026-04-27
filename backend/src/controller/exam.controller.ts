import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { ExamScheduleSchema } from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import { createExamScheduleService } from "../services/exam.service";

export async function createExamSchedule(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  const classId = req.params.id as string;
  const parsed = ExamScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!moderatorId) {
    throw new Error("Modeator ID is required");
  }
  if (!classId) {
    throw new Error("Class ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);
  const examSchdeule = await createExamScheduleService(
    schoolId,
    moderatorId,
    classId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Exam Schedule created successfully",
    data: examSchdeule,
  });
}

export async function getExamScheduleForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {}
