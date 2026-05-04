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
  const status = req.query.status as EmploymentStatus | undefined;
  const gender = req.query.gender as Gender | undefined;
  const city = req.query.city as string | undefined;
  const state = req.query.state as string | undefined;
  const qualification = req.query.qualification as string | undefined;
  const experience = req.query.experience
    ? parseInt(req.query.experience as string)
    : undefined;

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
    page,
    limit,
    auditContext,
    res.statusCode,
    filters,
  );

  res.json({
    success: true,
    message: `All teachers fetched for school`,
    data: allTeachers,
  });
}

export async function getSingleTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const teacherId = req.params.teacherId as string;
  if (!teacherId) {
    throw new Error("Teacher ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const teacher = await getSingleTeacherService(
    teacherId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Fetched teacher with id ${teacherId}`,
    data: teacher,
  });
}
