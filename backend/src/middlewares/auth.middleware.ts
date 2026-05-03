import type { Response, NextFunction } from "express";
import { prisma } from "@/src/config/database.config";
import { verifyAccessToken } from "@/src/utils/jwt.util";
import {
  createModuleLogger,
  logSecurityEvent,
} from "@/src/config/logger.config";
import type { AuthenticatedRequest } from "@/src/middlewares/request-logger.middleware";
import type { Module, Role } from "@prisma/client";

const log = createModuleLogger("AuthMiddleware");
const ACCESS_TOKEN_COOKIE = "access_token";

type PermissionAction =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete"
  | "canApprove"
  | "canExport";

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[ACCESS_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      logSecurityEvent(
        "MISSING_AUTH_TOKEN",
        req.context?.ip ?? "unknown",
        null,
        {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
        },
      );
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const err = error as Error;
      const isExpired = err.message.includes("expired");
      logSecurityEvent(
        isExpired ? "EXPIRED_ACCESS_TOKEN" : "INVALID_ACCESS_TOKEN",
        req.context?.ip ?? "unknown",
        null,
        {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          error: err.message,
        },
      );
      res.status(401).json({
        success: false,
        message: isExpired
          ? "Session expired, please login again"
          : "Invalid authentication token",
      });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      select: {
        id: true,
        isActive: true,
        expiresAt: true,
        userId: true,
      },
    });

    if (!session) {
      logSecurityEvent(
        "SESSION_NOT_FOUND",
        req.context?.ip ?? "unknown",
        decoded.userId,
        {
          requestId: req.requestId,
          sessionId: decoded.sessionId,
          path: req.path,
        },
      );
      res.status(401).json({
        success: false,
        message: "Session not found, please login again",
      });
      return;
    }

    if (!session.isActive) {
      logSecurityEvent(
        "INACTIVE_SESSION_ACCESS",
        req.context?.ip ?? "unknown",
        decoded.userId,
        {
          requestId: req.requestId,
          sessionId: decoded.sessionId,
          path: req.path,
        },
      );
      res.status(401).json({
        success: false,
        message: "Session has been terminated, please login again",
      });
      return;
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      logSecurityEvent(
        "EXPIRED_SESSION_ACCESS",
        req.context?.ip ?? "unknown",
        decoded.userId,
        {
          requestId: req.requestId,
          sessionId: decoded.sessionId,
          path: req.path,
        },
      );
      res.status(401).json({
        success: false,
        message: "Session expired, please login again",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        schoolId: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      logSecurityEvent(
        "AUTH_USER_NOT_FOUND",
        req.context?.ip ?? "unknown",
        decoded.userId,
        {
          requestId: req.requestId,
          path: req.path,
          userId: decoded.userId,
        },
      );
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (!user.isActive) {
      logSecurityEvent(
        "INACTIVE_USER_ACCESS_ATTEMPT",
        req.context?.ip ?? "unknown",
        user.id,
        {
          requestId: req.requestId,
          path: req.path,
          userId: user.id,
          role: user.role,
        },
      );
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
      return;
    }

    if (user.role !== "SUPER_ADMIN" && user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { isActive: true },
      });
      if (!school?.isActive) {
        logSecurityEvent(
          "INACTIVE_SCHOOL_ACCESS_ATTEMPT",
          req.context?.ip ?? "unknown",
          user.id,
          {
            requestId: req.requestId,
            path: req.path,
            userId: user.id,
            schoolId: user.schoolId,
          },
        );
        res.status(403).json({
          success: false,
          message:
            "Your school account has been deactivated. Please contact support.",
        });
        return;
      }
    }

    req.user = {
      id: user.id,
      schoolId: user.schoolId ?? "",
      role: user.role,
      sessionId: decoded.sessionId,
    };

    log.debug("User authenticated successfully", {
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId,
      sessionId: decoded.sessionId,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    const err = error as Error;
    log.error("Authentication middleware error", {
      error: err.message,
      requestId: req.requestId,
      path: req.path,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
}

export function authorize(...roles: Role[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      logSecurityEvent(
        "UNAUTHORIZED_ROLE_ACCESS",
        req.context?.ip ?? "unknown",
        req.user.id,
        {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          userRole: req.user.role,
          requiredRoles: roles,
        },
      );
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}

export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  prisma.user
    .findUnique({
      where: { id: req.user.id },
      select: { isVerified: true },
    })
    .then((user) => {
      if (!user?.isVerified) {
        logSecurityEvent(
          "UNVERIFIED_USER_ACCESS",
          req.context?.ip ?? "unknown",
          req.user!.id,
          {
            requestId: req.requestId,
            path: req.path,
          },
        );
        res.status(403).json({
          success: false,
          message: "Please verify your account before accessing this resource",
        });
        return;
      }
      next();
    })
    .catch((error: Error) => {
      log.error("requireVerified middleware error", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    });
}

const IMPLICIT_ACCESS_ROLES: Role[] = ["STUDENT", "PARENT"];

export function checkPermission(module: Module, action: PermissionAction) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const { role, id: userId } = req.user;

      if (role === "SUPER_ADMIN") {
        next();
        return;
      }

      if (IMPLICIT_ACCESS_ROLES.includes(role as Role)) {
        next();
        return;
      }

      const permission = await prisma.userPermission.findUnique({
        where: {
          userId_module: { userId, module },
        },
        select: {
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canApprove: true,
          canExport: true,
        },
      });

      if (permission?.[action]) {
        next();
        return;
      }

      logSecurityEvent(
        "PERMISSION_CHECK_DENIED",
        req.context?.ip ?? "unknown",
        userId,
        {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          userRole: role,
          module,
          action,
          hadPermissionRow: !!permission,
        },
      );

      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    } catch (error) {
      const err = error as Error;
      log.error("Permission check middleware error", {
        error: err.message,
        requestId: req.requestId,
        module,
        action,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error during permission check",
      });
    }
  };
}
