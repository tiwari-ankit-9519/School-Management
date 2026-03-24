import { Router } from "express";
import {
  loginUser,
  logoutUser,
  changePassword,
} from "../controller/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.patch("/change-password", authenticate, changePassword);

export default router;
