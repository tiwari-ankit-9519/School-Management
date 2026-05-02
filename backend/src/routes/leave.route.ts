import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  applyLeaveRequestByModerator,
  applyLeaveRequestByTeacher,
  applyLeaveRequestForStudent,
  getLeaveRequestsOfModeratorForAdmin,
  getLeaveRequestsOfStudentForClassTeacher,
  getLeaveRequestsOfTeacherForModerator,
  getMyLeaveRequests,
  reviewLeaveRequestOfModeratorForAdmin,
  reviewLeaveRequestOfStudentByClassTeacher,
  reviewLeaveRequestOfTeacherForModerator,
} from "../controller/leave.controller";

const router: Router = Router();

router.post(
  "/student",
  authenticate,
  authorize("STUDENT"),
  applyLeaveRequestForStudent,
);
router.post(
  "/teacher",
  authenticate,
  authorize("TEACHER"),
  applyLeaveRequestByTeacher,
);
router.post(
  "/mod",
  authenticate,
  authorize("MODERATOR"),
  applyLeaveRequestByModerator,
);

router.get(
  "/student",
  authenticate,
  authorize("TEACHER"),
  getLeaveRequestsOfStudentForClassTeacher,
);
router.get(
  "/teacher",
  authenticate,
  authorize("MODERATOR"),
  getLeaveRequestsOfTeacherForModerator,
);
router.get(
  "/mod",
  authenticate,
  authorize("ADMIN"),
  getLeaveRequestsOfModeratorForAdmin,
);

router.get(
  "/my",
  authenticate,
  authorize("STUDENT", "TEACHER", "MODERATOR"),
  getMyLeaveRequests,
);

router.patch(
  "/:leaveId/student",
  authenticate,
  authorize("TEACHER"),
  reviewLeaveRequestOfStudentByClassTeacher,
);
router.patch(
  "/:leaveId/teacher",
  authenticate,
  authorize("MODERATOR"),
  reviewLeaveRequestOfTeacherForModerator,
);
router.patch(
  "/:leaveId/mod",
  authenticate,
  authorize("ADMIN"),
  reviewLeaveRequestOfModeratorForAdmin,
);

export default router;
