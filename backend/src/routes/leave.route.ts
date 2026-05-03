import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
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
import { Module } from "@prisma/client";

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
  checkPermission(Module.LEAVE_REQUEST, "canCreate"),
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
  checkPermission(Module.LEAVE_REQUEST, "canRead"),
  getLeaveRequestsOfTeacherForModerator,
);

router.get(
  "/mod",
  authenticate,
  authorize("ADMIN"),
  checkPermission(Module.LEAVE_REQUEST, "canRead"),
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
  checkPermission(Module.LEAVE_REQUEST, "canApprove"),
  reviewLeaveRequestOfTeacherForModerator,
);

router.patch(
  "/:leaveId/mod",
  authenticate,
  authorize("ADMIN"),
  checkPermission(Module.LEAVE_REQUEST, "canApprove"),
  reviewLeaveRequestOfModeratorForAdmin,
);

export default router;
