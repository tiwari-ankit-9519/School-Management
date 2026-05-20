import { Router } from "express";
import { upload } from "../config/cloudinary.config";
import {
  approveAdmissionApplication,
  getAdmissionApplication,
  getAllAdmissionApplication,
  rejectAdmissionnApplication,
  resubmitAdmissionApplication,
  submitAdmissionApplication,
  waitlistAdmissionApplication,
} from "../controller/admission.controller";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/",
  upload.fields([
    { name: "documents", maxCount: 5 },
    { name: "photoUrl", maxCount: 1 },
    { name: "guardianPhoto", maxCount: 1 },
  ]),
  submitAdmissionApplication,
);

router.get(
  "/all",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canRead"),
  getAllAdmissionApplication,
);

router.get(
  "/:applicationId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canRead"),
  getAdmissionApplication,
);

router.patch(
  "/:applicationId/waitlist",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  waitlistAdmissionApplication,
);

router.patch(
  "/:applicationId/reject",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  rejectAdmissionnApplication,
);

router.patch(
  "/:applicationId/approve",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  approveAdmissionApplication,
);

router.patch(
  "/:applicationId/resubmit",
  upload.fields([
    { name: "documents", maxCount: 5 },
    { name: "photoUrl", maxCount: 1 },
    { name: "guardianPhoto", maxCount: 1 },
  ]),
  resubmitAdmissionApplication,
);

export default router;
