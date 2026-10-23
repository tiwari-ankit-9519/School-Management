import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getDashboardCalendar,
  getDashboardCounts,
  getDashboardOverview,
} from "../controller/dashboard.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("DashboardController"));

router.get(
  "/summary",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getDashboardCounts,
);

router.get(
  "/dashboard/overview",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getDashboardOverview,
);

router.get(
  "/dashboard/calendar",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getDashboardCalendar,
);

export default router;
