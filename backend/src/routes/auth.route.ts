import { Router } from "express";
import {
  loginUser,
  logoutUser,
  changePassword,
  sendResetPassword,
  resetPassword,
} from "../controller/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.post("/password-reset-request", sendResetPassword);
router.patch("/reset-password", resetPassword);
router.patch("/change-password", authenticate, changePassword);

export default router;
