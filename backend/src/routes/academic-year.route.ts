import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createAcademicYear } from "../controller/academic-year.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createAcademicYear,
);

export default router;
