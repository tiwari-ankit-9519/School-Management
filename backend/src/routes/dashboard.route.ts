import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { getDashboardCounts } from "../controller/dashboard.controller";

const router: Router = Router();

router.get(
  "/summary",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getDashboardCounts,
);

export default router;
