import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import {
  createRequestLogger,
  createModuleLogger,
  logRequest,
  logSecurityEvent,
} from "../config/logger.config.js";
import {
  getClientIp,
  parseUserAgent,
  extractRequestFingerprint,
  detectBot,
  isPrivateIp,
  isPotentialVpnOrProxy,
  sanitizeUserAgent,
  sanitizeReferrer,
} from "@/src/utils/request-parser.util";

interface ExtendedLogger {
  info: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
  http: (msg: string, ...args: any[]) => void;
  audit: (msg: string, ...args: any[]) => void;
}

const log = createModuleLogger("RequestLogger") as unknown as ExtendedLogger;

const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
  "proxy-authorization",
] as const;

const SENSITIVE_BODY_KEYS = [
  "password",
  "passwordHash",
  "confirmPassword",
  "oldPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "otp",
  "pin",
  "cvv",
  "cardNumber",
] as const;

const SKIP_LOG_PATHS = [
  "/health",
  "/ping",
  "/favicon.ico",
  "/metrics",
] as const;

const SLOW_REQUEST_THRESHOLD = parseInt(
  process.env.SLOW_REQUEST_THRESHOLD_MS ?? "3000",
);

const MAX_BODY_LOG_SIZE = parseInt(
  process.env.MAX_BODY_LOG_SIZE_BYTES ?? "2048",
);

interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
  platform: string;
  isMobile: boolean;
  isBot: boolean;
  raw: string;
}

interface RequestContext {
  ip: string;
  isPrivateIp: boolean;
  deviceInfo: DeviceInfo;
  fingerprint: string;
  referrer: string | null;
  origin: string | null;
  acceptLanguage: string | null;
  contentType: string | null;
  xRequestedWith: string | null;
  isVpnOrProxy: boolean;
}

interface AuthenticatedUser {
  id: string;
  role: string;
  sessionId: string;
}

interface SessionWithId {
  id?: string;
}

export interface AuthenticatedRequest extends Request {
  requestId?: string;
  startTime?: number;
  context?: RequestContext;
  deviceInfo?: DeviceInfo;
  fingerprint?: string;
  user?: AuthenticatedUser;
  isBot?: boolean;
  log?: any;
  session?: SessionWithId;
}

interface SanitizedHeaders {
  [key: string]: string | undefined;
}

type BodyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | BodyObject
  | BodyArray;

interface BodyObject {
  [key: string]: BodyValue;
}

type BodyArray = BodyValue[];

function buildRequestContext(req: AuthenticatedRequest): RequestContext {
  const ip = getClientIp(req);
  const rawUserAgent = req.headers["user-agent"] ?? "";
  const safeUserAgent = sanitizeUserAgent(rawUserAgent);
  const isBot = detectBot(safeUserAgent);
  const deviceInfo: DeviceInfo = { ...parseUserAgent(safeUserAgent), isBot };
  const fingerprint = extractRequestFingerprint(req);
  const referrer = sanitizeReferrer(
    req.headers["referer"] ?? req.headers["referrer"],
  );
  const origin = req.headers["origin"] ?? null;
  const acceptLanguage = req.headers["accept-language"] ?? null;
  const contentType = req.headers["content-type"] ?? null;
  const xRequestedWith = req.headers["x-requested-with"] ?? null;
  const isp = req.headers["x-isp"] ?? req.headers["x-org"] ?? null;
  const isVpnOrProxy = isPotentialVpnOrProxy(
    typeof isp === "string" ? isp : null,
  );

  return {
    ip,
    isPrivateIp: isPrivateIp(ip),
    deviceInfo,
    fingerprint,
    referrer: typeof referrer === "string" ? referrer : null,
    origin: typeof origin === "string" ? origin : null,
    acceptLanguage: typeof acceptLanguage === "string" ? acceptLanguage : null,
    contentType: typeof contentType === "string" ? contentType : null,
    xRequestedWith: typeof xRequestedWith === "string" ? xRequestedWith : null,
    isVpnOrProxy,
  };
}

function sanitizeHeaders(
  headers: Record<string, string | undefined>,
): SanitizedHeaders {
  const sanitized: SanitizedHeaders = { ...headers };
  SENSITIVE_HEADERS.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = "[REDACTED]";
    }
  });
  return sanitized;
}

function sanitizeBody(body: BodyValue): BodyValue {
  if (!body || typeof body !== "object") return body;
  const sanitized: BodyObject | BodyArray = Array.isArray(body)
    ? [...body]
    : { ...(body as BodyObject) };
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    const obj = sanitized as BodyObject;
    if (SENSITIVE_BODY_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
      obj[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = sanitizeBody(obj[key]);
    }
  }
  return sanitized;
}

function getBodySize(body: unknown): number {
  if (!body) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return 0;
  }
}

function shouldSkipLogging(path: string): boolean {
  return SKIP_LOG_PATHS.some((skip) => path.startsWith(skip));
}

function categorizeRequest(_method: string, path: string): string {
  if (path.includes("/auth/")) return "AUTH";
  if (path.includes("/admin/")) return "ADMIN";
  if (path.includes("/super-admin/")) return "SUPER_ADMIN";
  if (path.includes("/student/")) return "STUDENT";
  if (path.includes("/teacher/")) return "TEACHER";
  if (path.includes("/parent/")) return "PARENT";
  if (path.includes("/fee/")) return "FEE";
  if (path.includes("/admission/")) return "ADMISSION";
  if (path.includes("/document/")) return "DOCUMENT";
  if (path.includes("/notification/")) return "NOTIFICATION";
  if (path.includes("/health") || path.includes("/metrics")) return "SYSTEM";
  return "GENERAL";
}

const SUSPICIOUS_PATTERNS: RegExp[] = [
  /(\.\.|\/etc\/passwd|\/etc\/shadow)/i,
  /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,
  /(<script|javascript:|on\w+\s*=)/i,
  /(\.php|\.asp|\.aspx|\.jsp|\.cgi)$/i,
  /(wp-admin|wp-login|phpmyadmin|adminer)/i,
  /(\$\{|%24%7B|\{\{|%7B%7B)/i,
];

function isSuspiciousPath(path: string): boolean {
  try {
    const decoded = decodeURIComponent(path);
    return SUSPICIOUS_PATTERNS.some(
      (pattern) => pattern.test(path) || pattern.test(decoded),
    );
  } catch {
    return true;
  }
}

export function requestIdMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  req.requestId =
    (req.headers["x-request-id"] as string | undefined) ??
    (req.headers["x-correlation-id"] as string | undefined) ??
    crypto.randomUUID();
  req.startTime = Date.now();
  req.context = buildRequestContext(req);
  req.deviceInfo = req.context.deviceInfo;
  req.fingerprint = req.context.fingerprint;

  res.setHeader("X-Request-ID", req.requestId);

  if (req.context.deviceInfo.isBot) {
    const botMsg = `Bot traffic detected on request entry | requestId=${req.requestId} ip=${req.context.ip} isPrivateIp=${req.context.isPrivateIp} isVpnOrProxy=${req.context.isVpnOrProxy} fingerprint=${req.context.fingerprint} path=${req.path} userAgent=${req.context.deviceInfo.raw} browser=${req.context.deviceInfo.browser} os=${req.context.deviceInfo.os} deviceType=${req.context.deviceInfo.deviceType}`;
    log.warn(botMsg);
    logSecurityEvent("BOT_TRAFFIC_DETECTED", req.context.ip, null, {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      fingerprint: req.context.fingerprint,
      userAgent: req.context.deviceInfo.raw,
      isVpnOrProxy: req.context.isVpnOrProxy,
    });
  }

  next();
}

export function requestContextMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  req.log = createRequestLogger(
    req.requestId ?? crypto.randomUUID(),
    req.user?.id,
    req.user?.role,
    req.context?.ip ?? "unknown",
  );
  next();
}

export function requestLoggerMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (shouldSkipLogging(req.path)) {
    return next();
  }

  const category = categorizeRequest(req.method, req.path);
  const bodySize = getBodySize(req.body);
  const sanitizedBody =
    bodySize > 0 && bodySize <= MAX_BODY_LOG_SIZE
      ? sanitizeBody(req.body as BodyValue)
      : bodySize > MAX_BODY_LOG_SIZE
        ? { _truncated: true, _sizeBytes: bodySize }
        : undefined;

  const context = req.context ?? buildRequestContext(req);
  const {
    ip,
    deviceInfo,
    fingerprint,
    isPrivateIp: privateIp,
    isVpnOrProxy,
  } = context;

  const incomingLog = `Incoming request | requestId=${req.requestId} category=${category} method=${req.method} path=${req.path} originalUrl=${req.originalUrl} ip=${ip} isPrivateIp=${privateIp} isVpnOrProxy=${isVpnOrProxy} fingerprint=${fingerprint} device.isBot=${deviceInfo.isBot} device.deviceType=${deviceInfo.deviceType}`;

  log.http(incomingLog);

  const originalJson = res.json.bind(res);
  const originalEnd = res.end.bind(res);
  let responseBody: { success?: boolean; message?: string } | undefined;

  res.json = function (body: unknown): Response {
    responseBody = body as typeof responseBody;
    if (!res.headersSent) {
      const duration = Date.now() - (req.startTime ?? Date.now());
      res.setHeader("X-Response-Time", `${duration}ms`);
    }
    return originalJson(body);
  };

  res.end = function (...args: Parameters<typeof res.end>): Response {
    if (!res.headersSent) {
      const duration = Date.now() - (req.startTime ?? Date.now());
      res.setHeader("X-Response-Time", `${duration}ms`);
    }
    return originalEnd(...args) as Response;
  } as typeof res.end;

  res.on("finish", () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    const isSlow = duration > SLOW_REQUEST_THRESHOLD;
    const statusCode = res.statusCode;
    const contentLength = res.getHeader("content-length");

    const baseData = `requestId=${req.requestId} category=${category} method=${req.method} path=${req.path} originalUrl=${req.originalUrl} statusCode=${statusCode} duration=${duration}ms userId=${req.user?.id ?? "unauthenticated"} role=${req.user?.role ?? "none"} ip=${ip} fingerprint=${fingerprint} isBot=${deviceInfo.isBot} isSlow=${isSlow}`;

    if (isSlow) {
      log.warn(
        `Slow request detected | ${baseData} threshold=${SLOW_REQUEST_THRESHOLD}ms`,
      );
    }

    logRequest(req, res, duration);

    if (statusCode === 401) {
      logSecurityEvent("UNAUTHORIZED_REQUEST", ip, req.user?.id ?? null, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        fingerprint,
        isVpnOrProxy,
      });
    }

    if (statusCode === 403) {
      logSecurityEvent("FORBIDDEN_REQUEST", ip, req.user?.id ?? null, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        role: req.user?.role,
        fingerprint,
        isVpnOrProxy,
      });
    }

    if (statusCode === 429) {
      logSecurityEvent("RATE_LIMIT_HIT", ip, req.user?.id ?? null, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        fingerprint,
        isVpnOrProxy,
        isBot: deviceInfo.isBot,
      });
    }

    if (statusCode >= 500) {
      log.error(`Server error response | ${baseData}`);
    } else if (statusCode >= 400) {
      log.warn(`Client error response | ${baseData}`);
    } else {
      log.http(
        `Request completed | ${baseData} contentLength=${contentLength ?? 0}`,
      );
    }
  });

  res.on("error", (error: Error) => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    log.error(
      `Response stream error | requestId=${req.requestId} method=${req.method} path=${req.path} duration=${duration}ms ip=${ip} error=${error.message}`,
    );
  });

  next();
}

export function suspiciousRequestMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void | Response {
  const context = req.context ?? buildRequestContext(req);
  const { ip, deviceInfo, fingerprint, isVpnOrProxy } = context;
  const path = req.originalUrl;
  const suspicious = isSuspiciousPath(path);

  if (suspicious) {
    const suspMsg = `Suspicious request pattern detected | requestId=${req.requestId} ip=${ip} fingerprint=${fingerprint} isVpnOrProxy=${isVpnOrProxy} path=${path} method=${req.method} isBot=${deviceInfo.isBot}`;
    logSecurityEvent("SUSPICIOUS_REQUEST_PATTERN", ip, req.user?.id ?? null, {
      requestId: req.requestId,
      method: req.method,
      path,
      fingerprint,
      isVpnOrProxy,
    });
    log.warn(suspMsg);
    return res.status(400).json({
      success: false,
      message: "Bad request",
      requestId: req.requestId,
    });
  }

  if (deviceInfo.isBot) {
    req.isBot = true;
  }

  next();
}

export interface AuditContext {
  ipAddress: string;
  isPrivateIp: boolean;
  isVpnOrProxy: boolean;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
  platform: string;
  isMobile: boolean;
  isBot: boolean;
  requestId: string | undefined;
  sessionId: string | null;
  method: string;
  endpoint: string;
  fingerprint: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  traceId?: string;
  spanId?: string;
}

export function buildAuditContext(req: AuthenticatedRequest): AuditContext {
  const context = req.context ?? buildRequestContext(req);
  const {
    ip,
    deviceInfo,
    fingerprint,
    isPrivateIp: privateIp,
    isVpnOrProxy,
  } = context;

  return {
    ipAddress: ip,
    isPrivateIp: privateIp,
    isVpnOrProxy,
    userAgent: deviceInfo.raw,
    browser: deviceInfo.browser,
    browserVersion: deviceInfo.browserVersion,
    os: deviceInfo.os,
    osVersion: deviceInfo.osVersion,
    device: deviceInfo.device,
    deviceType: deviceInfo.deviceType,
    platform: deviceInfo.platform,
    isMobile: deviceInfo.isMobile,
    isBot: deviceInfo.isBot,
    requestId: req.requestId,
    sessionId: req.session?.id ?? null,
    method: req.method,
    endpoint: req.originalUrl,
    fingerprint,
    country: req.headers["x-country"] as string | undefined,
    region: req.headers["x-region"] as string | undefined,
    city: req.headers["x-city"] as string | undefined,
    latitude: req.headers["x-latitude"]
      ? parseFloat(req.headers["x-latitude"] as string)
      : undefined,
    longitude: req.headers["x-longitude"]
      ? parseFloat(req.headers["x-longitude"] as string)
      : undefined,
    isp: req.headers["x-isp"] as string | undefined,
    traceId: req.headers["x-trace-id"] as string | undefined,
    spanId: req.headers["x-span-id"] as string | undefined,
  };
}
