import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createHoliday,
  deleteHoliday,
  getAllHolidays,
} from "../controller/holiday.controller";

const router: Router = Router();

router.post("/", authenticate, authorize("ADMIN", "MODERATOR"), createHoliday);
router.get("/", authenticate, getAllHolidays);
router.delete(
  "/:holidayId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  deleteHoliday,
);

export default router;
