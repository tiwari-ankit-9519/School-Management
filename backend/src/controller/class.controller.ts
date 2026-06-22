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
  unassignClassTeacherService,
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

  const parsed = ClassSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!adminId) {
    res.status(400).json({
      success: false,
      message: "Admin ID or School ID is missing",
    });
    return;
  }

  res.status(HTTP_STATUS.CREATED);

  const newClass = await createClassService(
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const academicYearId = req.query.academicYearId as string;
  const name = req.query.name as string | undefined;
  const section = req.query.section as string | undefined;
  const roomNumber = req.query.roomNumber as string | undefined;
  const teacherId = req.query.teacherId as string | undefined;
  const capacityMin = req.query.capacityMin
    ? parseInt(req.query.capacityMin as string)
    : undefined;
  const capacityMax = req.query.capacityMax
    ? parseInt(req.query.capacityMax as string)
    : undefined;

  if (!academicYearId) {
    throw new Error("Academic year ID is required");
  }

  const filters = {
    academicYearId,
    name,
    section,
    roomNumber,
    teacherId,
    capacityMin,
    capacityMax,
  };

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const allClasses = await getAllClassesService(
    auditContext,
    res.statusCode,
    page,
    limit,
    filters,
  );
  res.json({
    success: true,
    message: `Fetched all classes for school for academicYear`,
    data: allClasses,
  });
}

export async function getSingleClass(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const classId = req.params.classId as string;
  const auditContext = buildAuditContext(req);
  if (!classId) {
    throw new Error("School ID is required");
  }
  res.status(HTTP_STATUS.OK);

  const fetchedClass = await getSingleClassService(
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

export async function unassignClassTeacher(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = AssignClassTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const adminId = req.user?.id;
  if (!adminId) {
    throw new Error("Admin ID is required");
  }

  const auditContext = buildAuditContext(req);

  await unassignClassTeacherService(
    parsed.data,
    adminId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Class Teacher unassigned successfully",
  });
}
