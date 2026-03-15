import { Router } from "express";
import { upload } from "@/src/config/cloudinary.config";
import {
  approveApplicationController,
  getApplication,
  getApplications,
  rejectApplicationController,
  requestMoreInfoController,
  resubmitApplicationController,
  schoolApplicationRegistrationController,
  viewApplication,
} from "@/src/controller/school-application.controller";
import { authenticate, authorize } from "@/src/middlewares/auth.middleware";

const router: Router = Router();

router.post(
  "/",
  upload.array("documents", 5),
  schoolApplicationRegistrationController,
);

router.get("/:id/status", viewApplication);

router.patch(
  "/:id/resubmit",
  upload.array("documents", 5),
  resubmitApplicationController,
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  getApplications,
);

router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  getApplication,
);

router.patch(
  "/:id/approve",
  authenticate,
  authorize("SUPER_ADMIN"),
  approveApplicationController,
);

router.patch(
  "/:id/reject",
  authenticate,
  authorize("SUPER_ADMIN"),
  rejectApplicationController,
);

router.patch(
  "/:id/more-info",
  authenticate,
  authorize("SUPER_ADMIN"),
  requestMoreInfoController,
);

export default router;