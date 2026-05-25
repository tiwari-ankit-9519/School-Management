import { Response } from "express";
import {
  login,
  logout,
  changePasswordService,
  sendResetPasswordService,
  resetPasswordService,
} from "@/src/services/auth.service";
import {
  AuthenticatedRequest,
  buildAuditContext,
} from "../middlewares/request-logger.middleware";
import {
  ChangePasswordSchema,
  ResetPasswordSchema,
  SendResetPasswordSchema,
} from "../validations/input.validations";
import { HTTP_STATUS } from "../utils/constants";

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

  res.status(200);

  await logout(req.user!.id, req.user!.sessionId, auditContext, res.statusCode);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("User ID is required");
  }
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  await changePasswordService(
    parsed.data,
    userId,
    auditContext,
    res.statusCode,
  );
  res.json({
    success: true,
    message: "Password reset successfully",
  });
}

export async function sendResetPassword(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = SendResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }

  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  await sendResetPasswordService(parsed.data, auditContext, res.statusCode);
  res.json({
    success: true,
    message: "Password reset mail sent successfully",
  });
}

export async function resetPassword(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const auditContext = buildAuditContext(req);
  res.status(HTTP_STATUS.OK);
  await resetPasswordService(parsed.data, auditContext, res.statusCode);
  res.json({
    success: true,
    message: "Password reset successfully",
  });
}
