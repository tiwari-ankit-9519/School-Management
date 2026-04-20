import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getAllTeachers,
  getSingleTeacher,
} from "../controller/teacher.controller";

const router: Router = Router();

router.get(
  "/all-teachers",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getAllTeachers,
);

router.get(
  "/:id",
  authenticate,
  authorize("MODERATOR", "ADMIN"),
  getSingleTeacher,
);

export default router;
