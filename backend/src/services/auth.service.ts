import { prisma } from "@/src/config/database.config";
import { createModuleLogger } from "@/src/config/logger.config";
import { createAuditLog, createSystemLog } from "@/src/utils/audit.util";
import { verifyPassword } from "@/src/utils/password";
import {
  generateAccessToken,
  getAccessTokenExpiry,
} from "@/src/utils/jwt.util";
import type { AuditContext } from "@/src/middlewares/request-logger.middleware";
import type { User } from "@prisma/client";
import type { LoginSchemaInput } from "@/src/validations/input.validations";

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
    log.info("Starting user login attempt", {
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
    log.error("Failed to login", {
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
  } catch (error) {}
}
