import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  assignClassTeacher,
  createClass,
  getAllClasses,
  getSingleClass,
} from "../controller/class.controller";

const router: Router = Router();

router.post(
  "/:academicYearId/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createClass,
);

router.post(
  "/assign-class-teacher",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  assignClassTeacher,
);

router.get(
  "/:id/all-classes",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getAllClasses,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getSingleClass,
);

export default router;
