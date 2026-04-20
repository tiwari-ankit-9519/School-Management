import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  markModeratorAttendance,
  markStudentAttendance,
  markTeacherAttendance,
} from "../controller/attendance.controller";

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
  authorize("MODERATOR", "ADMIN"),
  markTeacherAttendance,
);

router.post(
  "/moderator",
  authenticate,
  authorize("ADMIN"),
  markModeratorAttendance,
);

export default router;
