import { Router } from "express";
import { upload } from "../config/cloudinary.config";
import {
  getAdmissionApplication,
  getAllAdmissionApplication,
  submitAdmissionApplication,
} from "../controller/admission.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

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
  getAllAdmissionApplication,
);

router.get(
  "/:id",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getAdmissionApplication,
);

export default router;
