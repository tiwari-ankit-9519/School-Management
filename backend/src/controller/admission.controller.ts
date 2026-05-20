import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  AdmissionApplicationSchema,
  RejectAdmissionApplicationSchema,
  ResubmitAdmissionApplicationSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  approveAdmissionApplicationService,
  getAdmissionApplicationService,
  getAllAdmissionApplicationService,
  rejectAdmissionnApplicationService,
  resubmitAdmissionApplicationService,
  submitAdmissionApplicationService,
  waitlistAdmissionApplicationService,
} from "../services/admission.service";
import { AdmissionStatus } from "@prisma/client";

export async function submitAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (req.body.documents && typeof req.body.documents === "string") {
    try {
      req.body.documents = JSON.parse(req.body.documents);
    } catch {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ path: ["documents"], message: "Invalid documents format" }],
      });
      return;
    }
  }
  const auditContext = buildAuditContext(req);
  const parsed = AdmissionApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const uploadedFiles =
    (req.files as {
      documents?: Express.Multer.File[];
      photoUrl?: Express.Multer.File[];
      guardianPhoto?: Express.Multer.File[];
    }) ?? {};

  const files = uploadedFiles.documents ?? [];
  const photoUrl = uploadedFiles.photoUrl?.[0];
  const guardianPhotoUrl = uploadedFiles.guardianPhoto?.[0];

  res.status(HTTP_STATUS.CREATED);

  const newAdmissionApplication = await submitAdmissionApplicationService(
    parsed.data,
    files,
    photoUrl,
    guardianPhotoUrl,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Admission application applied successfully",
    data: newAdmissionApplication,
  });
}

export async function getAllAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as AdmissionStatus | undefined;

  res.status(HTTP_STATUS.OK);
  const applicaitons = await getAllAdmissionApplicationService(
    auditContext,
    res.statusCode,
    page,
    limit,
    status,
  );

  res.json({
    success: true,
    message: `Applications fetched successfully`,
    data: applicaitons,
  });
}

export async function getAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const applicationId = req.params.applicationId as string;
  const auditContext = buildAuditContext(req);
  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  res.status(HTTP_STATUS.OK);
  const application = await getAdmissionApplicationService(
    applicationId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Fetched admission application with applicationId ${applicationId}`,
    data: application,
  });
}

export async function rejectAdmissionnApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const moderatorId = req.user?.id;
  const applicationId = req.params.applicationId as string;
  const parsed = RejectAdmissionApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      errors: parsed.error.issues,
    });
    return;
  }

  if (!applicationId) {
    throw new Error("Application ID is required");
  }
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }

  res.status(HTTP_STATUS.OK);

  await rejectAdmissionnApplicationService(
    applicationId,
    moderatorId,
    parsed.data.rejectionReason,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Application with applicationId ${applicationId} is rejected`,
  });
}

export async function resubmitAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const applicationId = req.params.applicationId as string;
  if (req.body.documents && typeof req.body.documents === "string") {
    try {
      req.body.documents = JSON.parse(req.body.documents);
    } catch {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ path: ["documents"], message: "Invalid documents format" }],
      });
      return;
    }
  }

  const files = (req.files as Express.Multer.File[]) ?? [];

  if (!applicationId) {
    throw new Error("Application ID is required");
  }
  const parsed = ResubmitAdmissionApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  res.status(HTTP_STATUS.OK);
  const updatedAdmissionApplication = await resubmitAdmissionApplicationService(
    applicationId,
    parsed.data,
    files,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Admission application resubmitted",
    data: updatedAdmissionApplication,
  });
}

export async function approveAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const applicationId = req.params.applicationId as string;
  const reviewerId = req.user?.id;
  const { classId } = req.body;
  const auditContext = buildAuditContext(req);

  if (!applicationId) {
    throw new Error(`Applicaiton ID is required`);
  }
  if (!reviewerId) {
    throw new Error(`Reviewer ID is required`);
  }
  if (!classId) {
    throw new Error(`Class ID is required`);
  }

  res.status(HTTP_STATUS.CREATED);

  const newStudent = await approveAdmissionApplicationService(
    applicationId,
    reviewerId,
    auditContext,
    classId,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Enrollment done for applicationId ${applicationId}`,
    data: newStudent,
  });
}

export async function waitlistAdmissionApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const applicationId = req.params.applicationId as string;
  const { waitlistReason } = req.body;
  if (!waitlistReason) {
    throw new Error("Reason is required");
  }
  const moderatorId = req.user?.id;
  if (!moderatorId) {
    throw new Error("Moderator ID is required");
  }
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  await waitlistAdmissionApplicationService(
    applicationId,
    waitlistReason,
    moderatorId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Application is put to waitlist",
  });
}
