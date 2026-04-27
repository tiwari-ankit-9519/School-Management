import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getAllStudentsList,
  getSingleStudentDetail,
} from "../controller/students.controller";

const router: Router = Router();

router.get(
  "/all",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getAllStudentsList,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  getSingleStudentDetail,
);

export default router;
