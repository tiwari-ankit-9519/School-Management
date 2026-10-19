import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createAcademicYear,
  getAcademicYear,
} from "../controller/academic-year.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";
import { ro } from "zod/v4/locales";

const router: Router = Router();

router.use(controllerContext("AcademicyearController"));

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.ACADEMIC_YEAR, "canCreate"),
  createAcademicYear,
);

router.get(
  "/all",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getAcademicYear,
);

export default router;
