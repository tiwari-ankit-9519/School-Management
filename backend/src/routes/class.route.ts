import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  assignClassTeacher,
  createClass,
  getAllClasses,
  getSingleClass,
} from "../controller/class.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.CLASS, "canCreate"),
  createClass,
);

router.post(
  "/assign-class-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.CLASS_TEACHER, "canCreate"),
  assignClassTeacher,
);

router.get(
  "/all",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.CLASS, "canRead"),
  getAllClasses,
);

router.get(
  "/:classId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.CLASS, "canRead"),
  getSingleClass,
);

export default router;
