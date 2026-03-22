import type { Response } from "express";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "@/src/middlewares/request-logger.middleware";
import {
  approveApplication,
  getAllApplications,
  getSingleApplication,
  schoolApplicationRegistration,
  viewSchoolApplicationStatus,
  rejectApplication,
  requestMoreInfo,
  resubmitApplication,
} from "@/src/services/school-application.service";
import { SchoolApplicationStatus } from "@prisma/client";
import {
  RejectSchoolApplicationSchema,
  RequestMoreInfoSchema,
  ResubmitApplicationSchema,
  SchoolApplicationSchema,
} from "@/src/validations/input.validations";

export async function schoolApplicationRegistrationController(
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

  const parsed = SchoolApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const files = (req.files as Express.Multer.File[]) ?? [];
  const auditContext = buildAuditContext(req);
  const application = await schoolApplicationRegistration(
    parsed.data,
    files,
    auditContext,
    res.statusCode,
  );
  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
}

export async function viewApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  const application = await viewSchoolApplicationStatus(id, auditContext);

  res.status(200).json({
    success: true,
    message: "Application status fetched successfully",
    data: application,
  });
}

export async function getApplications(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as SchoolApplicationStatus | undefined;

  const applications = await getAllApplications(
    auditContext,
    res.statusCode,
    page,
    limit,
    status,
  );

  res.status(200).json({
    success: true,
    message: "Applications fetched successfully",
    data: applications,
  });
}

export async function getApplication(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  const application = await getSingleApplication(
    id,
    auditContext,
    res.statusCode,
  );

  res.status(200).json({
    success: true,
    message: "Application fetched successfully",
    data: application,
  });
}

export async function approveApplicationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  const school = await approveApplication(
    id,
    req.user!.id,
    auditContext,
    res.statusCode,
  );

  res.status(200).json({
    success: true,
    message: "Application approved successfully",
    data: school,
  });
}

export async function rejectApplicationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const parsed = RejectSchoolApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  await rejectApplication(
    id,
    req.user!.id,
    parsed.data.rejectionReason,
    auditContext,
    res.statusCode,
  );

  res.status(200).json({
    success: true,
    message: "Application rejected successfully",
  });
}

export async function requestMoreInfoController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const parsed = RequestMoreInfoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);

  await requestMoreInfo(
    id,
    req.user!.id,
    parsed.data.notes,
    parsed.data.moreInfoFields,
    auditContext,
    res.statusCode,
  );

  res.status(200).json({
    success: true,
    message: "More information requested successfully",
  });
}

export async function resubmitApplicationController(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Application ID is required",
    });
    return;
  }

  const parsed = ResubmitApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  const auditContext = buildAuditContext(req);

  const application = await resubmitApplication(
    id,
    parsed.data,
    files,
    auditContext,
    res.statusCode,
  );

  res.status(200).json({
    success: true,
    message: "Application resubmitted successfully",
    data: application,
  });
}
