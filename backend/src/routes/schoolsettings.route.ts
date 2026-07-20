import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { getSchoolSettings } from "../controller/schoolsettings.controller";

const router: Router = Router();

router.get("/settings", authenticate, authorize("ADMIN"), getSchoolSettings);

export default router;
