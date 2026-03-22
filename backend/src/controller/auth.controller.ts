import { Response } from "express";
import { login, logout } from "@/src/services/auth.service";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";

export async function loginUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);
  const { user, token } = await login(req.body, auditContext, res.statusCode);
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });
  res.status(200).json({
    success: true,
    message: "Login Successful",
    data: {
      user,
      accessToken: token,
    },
  });
}

export async function logoutUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const auditContext = buildAuditContext(req);

  await logout(req.user!.id, req.user!.sessionId, auditContext, res.statusCode);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
