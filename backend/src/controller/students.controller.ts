import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  getAllStudentsListService,
  getSingleStudentDetailService,
} from "../services/students.service";
import { HTTP_STATUS } from "../utils/constants";
import { EnrollmentStatus, Gender } from "@prisma/client";

export async function getAllStudentsList(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const moderatorId = req.user?.id;
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const classId = req.query.classId as string | undefined;
  const academicYearId = req.query.academicYearId as string | undefined;
  const status = req.query.status as EnrollmentStatus | undefined;
  const gender = req.query.gender as Gender | undefined;

  const filters = {
    classId,
    academicYearId,
    status,
    gender,
  };

  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  res.status(HTTP_STATUS.OK);
  const allStudents = await getAllStudentsListService(
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
    message: "Fetched all students of school",
    data: allStudents,
  });
}

export async function getSingleStudentDetail(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const studentId = req.params.id as string;
  const schoolId = req.user?.schoolId;
  const academicYearId = req.query.academicYearId as string | undefined;

  if (!studentId) {
    throw new Error("Student ID is required");
  }
  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const filters = {
    academicYearId,
  };

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const studentDetail = await getSingleStudentDetailService(
    studentId,
    schoolId,
    auditContext,
    res.statusCode,
    filters,
  );

  res.json({
    success: true,
    message: "Fetched student details successfully",
    data: studentDetail,
  });
}
