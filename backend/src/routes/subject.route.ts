import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createSubject } from "../controller/subject.controller";

const router: Router = Router();

router.post(
  "/create",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  createSubject,
);

export default router;
