import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import { createAcademicYear } from "../controller/academic-year.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ACADEMIC_YEAR, "canCreate"),
  createAcademicYear,
);

export default router;
