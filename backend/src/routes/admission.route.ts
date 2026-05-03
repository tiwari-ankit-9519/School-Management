import { Router } from "express";
import { upload } from "../config/cloudinary.config";
import {
  approveAdmissionApplication,
  getAdmissionApplication,
  getAllAdmissionApplication,
  rejectAdmissionnApplication,
  resubmitAdmissionApplication,
  submitAdmissionApplication,
} from "../controller/admission.controller";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/:id",
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
  "/:id",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canRead"),
  getAdmissionApplication,
);

router.patch(
  "/:id/waitlist",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  rejectAdmissionnApplication,
);

router.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  rejectAdmissionnApplication,
);

router.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  approveAdmissionApplication,
);

router.patch(
  "/:id/resubmit",
  upload.fields([
    { name: "documents", maxCount: 5 },
    { name: "photoUrl", maxCount: 1 },
    { name: "guardianPhoto", maxCount: 1 },
  ]),
  resubmitAdmissionApplication,
);

export default router;
