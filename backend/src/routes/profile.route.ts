import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getMyProfile,
  updateMyProfile,
} from "../controller/profile.controller";

const router: Router = Router();

router.get(
  "/me",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "MODERATOR",
    "TEACHER",
    "STUDENT",
    "PARENT",
  ),
  getMyProfile,
);

router.patch(
  "/me",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "MODERATOR",
    "TEACHER",
    "STUDENT",
    "PARENT",
  ),
  updateMyProfile,
);

export default router;
