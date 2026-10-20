import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getSchoolSettings,
  removeSchoolLogo,
  updateSchoolSettings,
  uploadSchoolLogo,
} from "../controller/schoolsettings.controller";
import { controllerContext } from "../config/logger.config";
import { upload } from "../config/cloudinary.config";

const router: Router = Router();

router.use(controllerContext("SchoolSettingController"));

router.get("/settings", authenticate, authorize("ADMIN"), getSchoolSettings);

router.patch(
  "/settings",
  authenticate,
  authorize("ADMIN"),
  updateSchoolSettings,
);

router.patch(
  "/settings/logo",
  authenticate,
  authorize("ADMIN"),
  upload.single("logo"),
  uploadSchoolLogo,
);

router.delete(
  "/settings/logo",
  authenticate,
  authorize("ADMIN"),
  removeSchoolLogo,
);

export default router;
