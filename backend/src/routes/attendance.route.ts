import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  getAdminsAttendance,
  getStudentAttendance,
  getTeachersAttendance,
  markModeratorAttendance,
  markStudentAttendance,
  markTeacherAttendance,
} from "../controller/attendance.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/student",
  authenticate,
  authorize("TEACHER"),
  markStudentAttendance,
);

router.post(
  "/teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER_ATTENDANCE, "canCreate"),
  markTeacherAttendance,
);

router.post(
  "/admins",
  authenticate,
  authorize("ADMIN"),
  checkPermission(Module.TEACHER_ATTENDANCE, "canCreate"),
  markModeratorAttendance,
);

router.get(
  "/students",
  authenticate,
  authorize("TEACHER"),
  getStudentAttendance,
);

router.get(
  "/teachers",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TEACHER_ATTENDANCE, "canRead"),
  getTeachersAttendance,
);

router.get(
  "/admins",
  authenticate,
  authorize("ADMIN"),
  checkPermission(Module.TEACHER_ATTENDANCE, "canRead"),
  getAdminsAttendance,
);

export default router;
