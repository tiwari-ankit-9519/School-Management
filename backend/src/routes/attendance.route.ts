import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getAdminsAttendance,
  getStudentAttendance,
  getTeachersAttendance,
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
  "/admins",
  authenticate,
  authorize("ADMIN"),
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
  authorize("MODERATOR", "ADMIN"),
  getTeachersAttendance,
);
router.get("/admins", authenticate, authorize("ADMIN"), getAdminsAttendance);

export default router;
