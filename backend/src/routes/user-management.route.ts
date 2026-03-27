import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createModerator,
  createTeacherApplication,
} from "../controller/user-management.controller";
import { upload } from "../config/cloudinary.config";

const router: Router = Router();

router.post(
  "/moderator/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createModerator,
);

router.post(
  "/teacher/apply",
  upload.array("documents", 5),
  createTeacherApplication,
);

export default router;
