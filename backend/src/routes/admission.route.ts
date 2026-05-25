import { Router } from "express";
import { upload } from "../config/cloudinary.config";
import {
  approveAdmissionApplication,
  confirmSlotOffer,
  declineSlotOffer,
  getAdmissionApplication,
  getAdmissionClass,
  getAllAdmissionApplication,
  rejectAdmissionApplication,
  resubmitAdmissionApplication,
  submitAdmissionApplication,
  waitlistAdmissionApplication,
  withdrawStudent,
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

router.patch(
  "/withdraw/:enrollmentId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ADMISSION_APPLICATION, "canApprove"),
  withdrawStudent,
);

router.get(
  "/class-name",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getAdmissionClass,
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
  rejectAdmissionApplication,
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

router.patch("/:applicationId/confirm-slot", confirmSlotOffer);

router.patch("/:applicationId/decline-slot", declineSlotOffer);

export default router;
