import { Response } from "express";
import { Role } from "@prisma/client";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { HTTP_STATUS } from "../utils/constants";
import { getDashboardCountsService } from "../services/dashboard.service";
import {
  getDashboardCalendarService,
  getDashboardOverviewService,
} from "../services/dashboard-overview.service";
import { DashboardCalendarQuery } from "../validations/input.validations";

const requireIdentity = (req: AuthenticatedRequest) => {
  const userId = req.user?.id;
  const role = req.user?.role as Role | undefined;
  if (!userId) throw new Error("User ID is required");
  if (!role) throw new Error("Role is required");
  return { userId, role };
};

export async function getDashboardCounts(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new Error("Admin ID is required");
  }
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  const summary = await getDashboardCountsService(
    adminId,
    auditContext,
    res.statusCode,
  );

  res.json({
    success: true,
    message: "Summary fetched successfully",
    data: summary,
  });
}

export async function getDashboardOverview(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { userId, role } = requireIdentity(req);

  const overview = await getDashboardOverviewService(userId, role);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Dashboard overview fetched successfully",
    data: overview,
  });
}

export async function getDashboardCalendar(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = DashboardCalendarQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid month",
      errors: parsed.error.issues,
    });
    return;
  }

  requireIdentity(req);

  const calendar = await getDashboardCalendarService(parsed.data.month);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Dashboard calendar fetched successfully",
    data: calendar,
  });
}
