import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getMyProfile,
  getMyToday,
  removeMyPhoto,
  updateMyPhoto,
  updateMyProfile,
} from "../controller/profile.controller";
import { controllerContext } from "../config/logger.config";
import { upload } from "../config/cloudinary.config";

const router: Router = Router();

router.use(controllerContext("ProfileController"));

router.get(
  "/me",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  getMyProfile,
);

router.get(
  "/me/today",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  getMyToday,
);

router.patch(
  "/me",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  updateMyProfile,
);

router.patch(
  "/me/photo",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  upload.single("photo"),
  updateMyPhoto,
);

router.delete(
  "/me/photo",
  authenticate,
  authorize("ADMIN", "MODERATOR", "TEACHER", "STUDENT", "PARENT"),
  removeMyPhoto,
);

export default router;
