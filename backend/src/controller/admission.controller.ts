import { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { AdmissionApplicationSchema } from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";
import {
  getAdmissionApplicationService,
  getAllAdmissionApplicationService,
  submitAdmissionApplicationService,
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

  const schoolId = req.params.id as string;
  if (!schoolId) {
    throw new Error("School ID is required");
  }

  res.status(HTTP_STATUS.CREATED);

  const newAdmissionApplication = await submitAdmissionApplicationService(
    parsed.data,
    files,
    photoUrl,
    guardianPhotoUrl,
    schoolId,
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
  const schoolId = req.user?.schoolId;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as AdmissionStatus | undefined;

  res.status(HTTP_STATUS.OK);
  const applicaitons = await getAllAdmissionApplicationService(
    schoolId,
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
  const schoolId = req.user?.schoolId;
  const applicationId = req.params.id as string;
  const auditContext = buildAuditContext(req);
  if (!schoolId) {
    throw new Error("School ID is required");
  }
  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  res.status(HTTP_STATUS.OK);
  const application = await getAdmissionApplicationService(
    applicationId,
    schoolId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: `Fetched admission application with applicationId ${applicationId}`,
    data: application,
  });
}
