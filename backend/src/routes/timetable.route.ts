import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createTimeTable,
  getTimeTableForClass,
  swapTimeTableForClass,
  updatedTimeTable,
} from "../controller/timetable.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  createTimeTable,
);

router.patch(
  "/:id/update",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  updatedTimeTable,
);

router.patch(
  "/swap-class",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  swapTimeTableForClass,
);

router.get(
  "/:id/time-table",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getTimeTableForClass,
);

export default router;
