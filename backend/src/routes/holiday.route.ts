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
} from "../controller/holiday.controller";
import { Module } from "@prisma/client";

const router: Router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.HOLIDAY, "canCreate"),
  createHoliday,
);

router.get("/", authenticate, getAllHolidays);

router.delete(
  "/:holidayId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  checkPermission(Module.HOLIDAY, "canDelete"),
  deleteHoliday,
);

export default router;
