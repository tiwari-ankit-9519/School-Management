import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createClass } from "../controller/class.controller";

const router: Router = Router();

router.post(
  "/:academicYearId/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createClass,
);

export default router;
