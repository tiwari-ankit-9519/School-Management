import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { HTTP_STATUS } from "../utils/constants";
import {
  getAllTeachersService,
  getSingleTeacherService,
} from "../services/teacher.service";
import { EmploymentStatus, Gender } from "@prisma/client";

export async function getAllTeachers(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const status = req.query.status as EmploymentStatus | undefined;
  const gender = req.query.gender as Gender | undefined;
  const city = req.query.city as string | undefined;
  const state = req.query.state as string | undefined;
  const qualification = req.query.qualification as string | undefined;
  const experience = req.query.experience
    ? parseInt(req.query.experience as string)
    : undefined;

  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const filters = {
    status,
    gender,
    city,
    state,
    qualification,
    experience,
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const allTeachers = await getAllTeachersService(
    schoolId,
    page,
    limit,
    auditContext,
    res.statusCode,
    filters,
  );

  res.json({
    success: true,
    message: `All teachers fetched for school with id ${schoolId}`,
    data: allTeachers,
  });
}

export async function getSingleTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const teacherId = req.params.id as string;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!teacherId) {
    throw new Error("Teacher ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const teacher = await getSingleTeacherService(
    schoolId,
    teacherId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Fetched teacher with id ${teacherId} for school ${schoolId}`,
    data: teacher,
  });
}
