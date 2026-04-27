import { prisma } from "@/src/config/database.config";
import { createModuleLogger } from "@/src/config/logger.config";
import { createAuditLog, createSystemLog } from "@/src/utils/audit.util";
import { hashPassword, verifyPassword } from "@/src/utils/password";
import {
  generateAccessToken,
  getAccessTokenExpiry,
} from "@/src/utils/jwt.util";
import type { AuditContext } from "@/src/middlewares/request-logger.middleware";
import type { User } from "@prisma/client";
import type {
  ChangePasswordInput,
  LoginSchemaInput,
  ResetPasswordInput,
  SendResetPasswordInput,
} from "@/src/validations/input.validations";
import { randomBytes } from "crypto";
import {
  sendPasswordResetEmail,
  sendResetPasswordSuccessEmail,
} from "./email.service";

const log = createModuleLogger("LoginService");

export async function login(
  data: LoginSchemaInput,
  context: AuditContext,
  statusCode: number,
): Promise<{
  user: Omit<User, "passwordHash">;
  token: string;
}> {
  try {
    log.info("Starting service to login user", {
      email: data.email,
      ipAddress: context.ipAddress,
    });

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { regNumber: data.regNumber }] },
    });

    if (!user) {
      log.warn("Login failed. User does not exist", {
        email: data.email,
        regNumber: data.regNumber,
      });
      await createSystemLog({
        level: "ERROR",
        module: "LoginService",
        message: "Login failed. User does not exist",
        context,
        metadata: { email: data.email },
      });
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      log.warn("Login failed. Account is deactivated", {
        userId: user.id,
        email: data.email,
      });
      await createSystemLog({
        level: "ERROR",
        module: "LoginService",
        message: "Login failed. Account is deactivated",
        context,
        metadata: { userId: user.id, email: data.email },
      });
      throw new Error("Account is deactivated. Please contact support.");
    }

    if (user.role !== "SUPER_ADMIN" && user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { isActive: true },
      });

      if (!school?.isActive) {
        log.warn("Login failed. School is deactivated", {
          userId: user.id,
          schoolId: user.schoolId,
        });
        await createSystemLog({
          level: "ERROR",
          module: "LoginService",
          message: "Login failed. School is deactivated",
          context,
          metadata: { userId: user.id, schoolId: user.schoolId },
        });
        throw new Error(
          "Your school account has been deactivated. Please contact support.",
        );
      }
    }

    const isPasswordValid = await verifyPassword(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      log.warn("Login failed. Wrong password", {
        userId: user.id,
        email: data.email,
      });
      await createSystemLog({
        level: "ERROR",
        module: "LoginService",
        message: "Login failed. Wrong password",
        context,
        metadata: { userId: user.id, email: data.email },
      });
      throw new Error("Invalid credentials");
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: new Date(Date.now() + getAccessTokenExpiry() * 1000),
        isActive: true,
      },
    });

    const token = generateAccessToken({
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId ?? undefined,
      sessionId: session.id,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: context.ipAddress,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "LoginService",
      message: "User logged in successfully",
      context,
      statusCode,
      metadata: {
        userId: user.id,
        email: data.email,
        sessionId: session.id,
        role: user.role,
      },
      userId: user.id,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    log.info("User logged in successfully", {
      userId: user.id,
      email: data.email,
      sessionId: session.id,
      role: user.role,
    });

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to login", {
      error: err.message,
      email: data.email,
    });
    throw err;
  }
}

export async function logout(
  userId: string,
  token: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Trying to logout the user", {
      user: userId,
    });

    const userSession = await prisma.session.findUnique({
      where: { token },
    });

    if (!userSession || userSession.userId !== userId) {
      log.warn("Invalid session", {
        userSession,
      });
      throw new Error("Invalid session");
    }

    await prisma.session.update({
      where: { token },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "LoginService",
      message: "User logged in successfully",
      context,
      statusCode,
      metadata: {
        userId,
        userSession,
      },
      userId,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to logout", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
  }
}

export async function changePasswordService(
  data: ChangePasswordInput,
  userId: string,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Password reset service starting", {
      userId,
      ipAddress: context.ipAddress,
    });

    const userExists = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        passwordHash: true,
        email: true,
        regNumber: true,
      },
    });

    if (!userExists) {
      log.warn("User does not exists with the email or regNumber", {
        userId,
      });
      throw new Error("User does not exists");
    }

    const isPasswordValid = await verifyPassword(
      data.oldPassword,
      userExists.passwordHash,
    );

    if (!isPasswordValid) {
      log.warn("Current password does not match", {
        userId: userExists.id,
      });
      throw new Error("Password does not match existing password");
    }

    const isSamePassword = await verifyPassword(
      data.newPassword,
      userExists.passwordHash,
    );

    if (isSamePassword) {
      log.warn("New password must be different from old password", {
        userId: userExists.id,
      });
      throw new Error("New password must be different from old password");
    }

    const newHashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: {
        id: userExists.id,
      },
      data: {
        passwordHash: newHashedPassword,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "Authentication",
      message: "Password reset successfully",
      context,
      statusCode,
      metadata: {
        userId: userExists.id,
      },
    });

    await createAuditLog({
      context,
      action: "PASSWORD_RESET",
      module: "Authentication",
      performedById: userExists.id,
      resourceId: userExists.id,
      resourceType: "Password reset",
      isSuccessful: true,
      statusCode,
    });

    log.info("Password has been reset");

    await sendResetPasswordSuccessEmail({
      email: userExists.email ?? "",
      regNumber: userExists.regNumber,
      ipAddress: context.ipAddress,
      changedAt: new Date(),
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to reset password", {
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function sendResetPasswordService(
  data: SendResetPasswordInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Starting service to send password reset email", {
      userEmail: data.email,
      userRegNumber: data.regNumber,
      userPhone: data.phone,
      ipAddress: context.ipAddress,
    });

    const conditions = [];

    if (data.email) {
      conditions.push({ email: data.email });
    }
    if (data.regNumber) {
      conditions.push({ regNumber: data.regNumber });
    }
    if (data.phone) {
      conditions.push({ phone: data.phone });
    }

    const userExists = await prisma.user.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (!userExists) {
      log.warn("User does not exists", {
        userEmail: data.email,
        userRegNumber: data.regNumber,
        userPhone: data.phone,
      });
      throw new Error("User does not exists");
    }

    const resetToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await prisma.passwordReset.create({
      data: {
        userId: userExists.id,
        token: resetToken,
        expiresAt: expires,
        ipAddress: context.ipAddress,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "PasswordResetEmail",
      message: "Password reset email sent successfully",
      context,
      statusCode,
      metadata: {
        userEmail: data.email,
        userRegNumber: data.regNumber,
        userPhone: data.phone,
      },
    });

    log.info("Password reset email sent successfully");
    await sendPasswordResetEmail({
      email: userExists.email ?? "",
      regNumber: userExists.regNumber,
      expiresInMinutes: 60,
      resetToken,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to send reset password email", {
      userEmail: data.email,
      userRegNumber: data.regNumber,
      userPhone: data.phone,
      ipAddress: context.ipAddress,
    });
  }
}

export async function resetPasswordService(
  data: ResetPasswordInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info("Starting password reset service", {
      userEmail: data.email,
      userRegNumber: data.regNumber,
      ipAddress: context.ipAddress,
    });
    const conditions = [];

    if (data.email) {
      conditions.push({ email: data.email });
    }
    if (data.regNumber) {
      conditions.push({ regNumber: data.regNumber });
    }

    const userExists = await prisma.user.findFirst({
      where: {
        OR: conditions,
      },
      select: {
        id: true,
        passwordHash: true,
        email: true,
        regNumber: true,
      },
    });

    if (!userExists) {
      log.warn("User does not exists", {
        userEmail: data.email,
        userRegNumber: data.regNumber,
      });
      throw new Error("User does not exists");
    }

    const verificationToken = await prisma.passwordReset.findUnique({
      where: {
        token: data.token,
      },
    });

    if (!verificationToken) {
      log.warn("Invalid or expired reset link", {
        userEmail: data.email,
        userRegNumber: data.regNumber,
      });
      throw new Error("Invalid or expired reset link");
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.passwordReset.deleteMany({
        where: {
          userId: userExists.id,
        },
      });
      log.warn("Reset link has expired. Please request a new one.");
      throw new Error("Reset link has expired. Please request a new one.");
    }

    const newHashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: {
        id: userExists.id,
      },
      data: {
        passwordHash: newHashedPassword,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "PasswordReset",
      message: "Password reset successful",
      context,
      statusCode,
      metadata: {
        userEmail: data.email,
        userRegNumber: data.regNumber,
      },
    });

    log.info("Password reset successful");
    await sendResetPasswordSuccessEmail({
      email: userExists.email ?? "",
      regNumber: userExists.regNumber,
      ipAddress: context.ipAddress,
      changedAt: new Date(),
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to reset password", {
      userEmail: data.email,
      userRegNumber: data.regNumber,
      ipAddress: context.ipAddress,
    });
  }
}
