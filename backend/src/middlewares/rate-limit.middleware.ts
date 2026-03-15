import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";
import { createModuleLogger, logSecurityEvent } from "../config/logger.config.js";

const log = createModuleLogger("RateLimitMiddleware");
const isDevelopment = process.env.NODE_ENV === "development";

interface AuthenticatedUser {
  id: string;
  schoolId: string;
  role: string;
}

interface DeviceInfo {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: string;
  isMobile?: boolean;
  isBot?: boolean;
}

interface RequestContext {
  ip?: string;
  fingerprint?: string;
  deviceInfo?: DeviceInfo;
}

interface AuthenticatedRequest extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
  context?: RequestContext;
  fingerprint?: string;
  deviceInfo?: DeviceInfo;
}

function buildRateLimitHandler(limitName: string, message: string) {
  return async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const ip = req.context?.ip ?? req.ip ?? "unknown";
    const userId = req.user?.id ?? null;
    const schoolId = req.user?.schoolId ?? null;
    const role = req.user?.role ?? null;
    const fingerprint = req.fingerprint ?? req.context?.fingerprint ?? null;
    const deviceInfo: DeviceInfo = req.deviceInfo ?? req.context?.deviceInfo ?? {};
    const retryAfter = res.getHeader("Retry-After");

    log.warn("Rate limit exceeded", {
      limitName,
      requestId: req.requestId,
      ip,
      userId,
      schoolId,
      role,
      fingerprint,
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      deviceType: deviceInfo.deviceType,
      isMobile: deviceInfo.isMobile,
      isBot: deviceInfo.isBot,
      retryAfter,
    });

    logSecurityEvent("RATE_LIMIT_EXCEEDED", ip, userId, {
      limitName,
      requestId: req.requestId,
      schoolId,
      role,
      fingerprint,
      method: req.method,
      path: req.originalUrl,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      isMobile: deviceInfo.isMobile,
      isBot: deviceInfo.isBot,
      retryAfter,
    });

    return res.status(429).json({
      success: false,
      message,
      retryAfter,
      requestId: req.requestId,
    });
  };
}

function buildKeyGenerator(prefix: string) {
  return (req: AuthenticatedRequest): string => {
    const userId = req.user?.id;
    const fingerprint = req.fingerprint ?? req.context?.fingerprint;

    if (userId) {
      return `${prefix}:user:${userId}`;
    }

    if (fingerprint) {
      return `${prefix}:fp:${fingerprint}`;
    }

    return `${prefix}:ip:${ipKeyGenerator(req.ip ?? "unknown")}`;
  };
}

function buildSkipFunction(skipInDevelopment: boolean = false) {
  return (req: AuthenticatedRequest): boolean => {
    if (skipInDevelopment && isDevelopment) return true;
    const ip = req.context?.ip ?? req.ip ?? "";
    if (ip === "127.0.0.1" || ip === "::1") return true;
    return false;
  };
}

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("general"),
  skip: buildSkipFunction(true),
  handler: buildRateLimitHandler(
    "GENERAL",
    "Too many requests, please try again later",
  ),
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "5"),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: buildKeyGenerator("auth"),
  skip: buildSkipFunction(false),
  handler: buildRateLimitHandler(
    "AUTH",
    "Too many authentication attempts, please try again after 15 minutes",
  ),
});

export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: buildKeyGenerator("password-reset"),
  skip: buildSkipFunction(false),
  handler: buildRateLimitHandler(
    "PASSWORD_RESET",
    "Too many password reset attempts, please try again after 1 hour",
  ),
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX ?? "10"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("strict"),
  skip: buildSkipFunction(false),
  handler: buildRateLimitHandler(
    "STRICT",
    "Rate limit exceeded, please slow down",
  ),
});

export const documentUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX ?? "20"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("document-upload"),
  skip: buildSkipFunction(true),
  handler: buildRateLimitHandler(
    "DOCUMENT_UPLOAD",
    "Too many upload attempts, please try again after 1 hour",
  ),
});

export const notificationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.NOTIFICATION_RATE_LIMIT_MAX ?? "30"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("notification"),
  skip: buildSkipFunction(true),
  handler: buildRateLimitHandler(
    "NOTIFICATION",
    "Too many notification requests, please slow down",
  ),
});

export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX ?? "50"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("admin"),
  skip: buildSkipFunction(false),
  handler: buildRateLimitHandler(
    "ADMIN",
    "Too many admin requests, please slow down",
  ),
});

export const sseRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SSE_RATE_LIMIT_MAX ?? "5"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator("sse"),
  skip: buildSkipFunction(true),
  handler: buildRateLimitHandler(
    "SSE_CONNECT",
    "Too many SSE connection attempts, please try again later",
  ),
});