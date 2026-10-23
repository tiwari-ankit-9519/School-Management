import { Router } from "express";
import {
  authenticate,
  authorize,
  checkPermission,
} from "../middlewares/auth.middleware";
import {
  createHoliday,
  deleteHoliday,
  getAllHolidays,
  updateHoliday,
} from "../controller/holiday.controller";
import { Module } from "@prisma/client";
import { controllerContext } from "../config/logger.config";

const router: Router = Router();

router.use(controllerContext("HolidayController"));

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.HOLIDAY, "canCreate"),
  createHoliday,
);

router.get("/", authenticate, getAllHolidays);

router.patch(
  "/:holidayId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.HOLIDAY, "canUpdate"),
  updateHoliday,
);

router.delete(
  "/:holidayId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.HOLIDAY, "canDelete"),
  deleteHoliday,
);

export default router;
