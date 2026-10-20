import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import { Response } from "express";
import { HTTP_STATUS } from "../utils/constants";
import { getDashboardCountsService } from "../services/dashboard.service";

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
