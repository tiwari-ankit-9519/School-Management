import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import {
  AssignTeacherToSubjectSchema,
  SubjectSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  assignTeacherToSubjectService,
  createSubjectService,
  getAllSubjectsService,
  getSingleSubjectService,
  unassignTeacherFromSubjectService,
} from "../services/subject.service";

export async function createSubject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = SubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  const adminId = req.user?.id;
  if (!adminId) {
    throw new Error("School Id or Admin Id is required");
  }

  res.status(HTTP_STATUS.CREATED);

  const subject = await createSubjectService(
    adminId,
    parsed.data,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Subject created successfully",
    data: subject,
  });
}

export async function assignTeacherToSubject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const subjectId = req.params.subjectId as string;
  const moderatorId = req.user?.id;

  const parsed = AssignTeacherToSubjectSchema.safeParse(req.body);
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
  if (!subjectId) {
    throw new Error("Subject ID is required");
  }

  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.CREATED);
  await assignTeacherToSubjectService(
    subjectId,
    parsed.data,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Teacher assigned to subject successfully",
  });
}

export async function unassignTeacherFromSubject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const subjectId = req.params.subjectId as string;
  const moderatorId = req.user?.id;

  const parsed = AssignTeacherToSubjectSchema.safeParse(req.body);
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
  if (!subjectId) {
    throw new Error("Subject ID is required");
  }

  const auditContext = buildAuditContext(req);

  await unassignTeacherFromSubjectService(
    subjectId,
    parsed.data,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.status(HTTP_STATUS.OK);

  res.json({
    success: false,
    message: "Teacher unassigned from subject",
  });
}

export async function getAllSubjects(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive =
    req.query.isActive === "true"
      ? true
      : req.query.isActive === "false"
        ? false
        : undefined;
  const auditContext = buildAuditContext(req);

  res.status(HTTP_STATUS.OK);

  const allSubjects = await getAllSubjectsService(
    auditContext,
    res.statusCode,
    page,
    limit,
    isActive,
  );

  res.json({
    success: true,
    message: "Fetched all subjects",
    data: allSubjects,
  });
}

export async function GetSingleSubject(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const subjectId = req.params.subjectId as string;
  res.status(HTTP_STATUS.OK);

  const subject = await getSingleSubjectService(
    subjectId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Subject fecthed with id ${subjectId}`,
    data: subject,
  });
}
