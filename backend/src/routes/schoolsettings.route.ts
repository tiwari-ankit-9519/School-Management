import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getSchoolSettings,
  updateSchoolSettings,
} from "../controller/schoolsettings.controller";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("SchoolSettingController"));

router.get("/settings", authenticate, authorize("ADMIN"), getSchoolSettings);
router.patch(
  "/settings",
  authenticate,
  authorize("ADMIN"),
  updateSchoolSettings,
);

export default router;
