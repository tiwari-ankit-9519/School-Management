import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createTimeTable,
  getTimeTableForClass,
  swapTimeTableForClass,
  updatedTimeTable,
} from "../controller/timetable.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TIMETABLE, "canCreate"),
  createTimeTable,
);

router.patch(
  "/:timeTableId/update",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TIMETABLE, "canUpdate"),
  updatedTimeTable,
);

router.patch(
  "/swap-class",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TIMETABLE, "canUpdate"),
  swapTimeTableForClass,
);

router.get(
  "/:classId/time-table",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.TIMETABLE, "canRead"),
  getTimeTableForClass,
);

export default router;
