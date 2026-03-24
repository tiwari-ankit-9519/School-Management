import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createModerator } from "../controller/user-management.controller";

const router: Router = Router();

router.post(
  "/moderator/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createModerator,
);

export default router;
