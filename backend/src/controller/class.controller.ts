import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { HTTP_STATUS } from "../utils/constants";
import {
  assignClassTeacherService,
  createClassService,
  getAllClassesService,
  getSingleClassService,
} from "../services/class.service";
import {
  AssignClassTeacherSchema,
  ClassSchema,
} from "../validations/input.validations";

export async function createClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const adminId = req.user?.id;
  const schoolId = req.user?.schoolId;
  const academicYearId = req.params.academicYearId as string;

  const parsed = ClassSchema.safeParse(req.body);

  if (!academicYearId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Academic year ID is required",
    });
    return;
  }

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!adminId || !schoolId) {
    res.status(400).json({
      success: false,
      message: "Admin ID or School ID is missing",
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);

  const newClass = await createClassService(
    academicYearId,
    schoolId,
    adminId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Class created successfully",
    data: newClass,
  });
}

export async function assignClassTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const moderatorId = req.user?.id;
  const parsed = AssignClassTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  await assignClassTeacherService(
    moderatorId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Teacher with id ${parsed.data.teacherId} is assigned as class teacher to class with id ${parsed.data.classId}`,
  });
}

export async function getAllClasses(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const schoolId = req.user?.schoolId;
  const academicYearId = req.params.id as string;
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!academicYearId) {
    throw new Error("Academic Year is required");
  }
  res.status(HTTP_STATUS.OK);
  const allClasses = await getAllClassesService(
    schoolId,
    academicYearId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Fetched all classes for school with schoolId ${schoolId} for academicYear ${academicYearId}`,
    data: allClasses,
  });
}

export async function getSingleClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const schoolId = req.user?.schoolId;
  const classId = req.params.id as string;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!classId) {
    throw new Error("School ID is required");
  }
  res.status(HTTP_STATUS.OK);

  const fetchedClass = await getSingleClassService(
    schoolId,
    classId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Class with id ${classId} fetched successfully`,
    data: fetchedClass,
  });
}
