import winston from "winston";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import type { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(process.cwd(), "logs");
const subDirs = ["error", "warning", "info"];

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

subDirs.forEach((dir) => {
  const fullPath = path.join(logsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const logLevel = process.env.LOG_LEVEL ?? "info";
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const serviceName = process.env.SERVICE_NAME ?? "school-management-system";
const serviceVersion = process.env.SERVICE_VERSION ?? "1.0.0";
const nodeId = process.env.NODE_ID ?? `node-${os.hostname()}-${process.pid}`;

interface CustomLevels extends winston.config.AbstractConfigSetLevels {
  error: number;
  warn: number;
  info: number;
  http: number;
  audit: number;
  query: number;
  debug: number;
}

interface CallerInfo {
  fn: string;
  file: string;
  line: string;
  col: string;
}

interface MemoryUsage {
  rss: string;
  heapUsed: string;
  heapTotal: string;
  external: string;
}

type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "http"
  | "audit"
  | "query"
  | "debug";

type SanitizableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | SanitizableObject
  | SanitizableArray;

interface SanitizableObject {
  [key: string]: SanitizableValue;
}

type SanitizableArray = SanitizableValue[];

interface AuditDetails extends SanitizableObject {}
interface SecurityDetails extends SanitizableObject {}

interface AuthenticatedUser {
  id: string;
  schoolId: string;
  role: string;
  sessionId: string;
}

interface AuthenticatedRequest extends Request {
  requestId?: string;
  user?: AuthenticatedUser;
  context?: { ip: string };
}

const customLevels: { levels: CustomLevels; colors: Record<LogLevel, string> } =
  {
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      audit: 4,
      query: 5,
      debug: 6,
    },
    colors: {
      error: "red bold",
      warn: "yellow bold",
      info: "green",
      http: "magenta",
      audit: "cyan bold",
      query: "blue",
      debug: "white",
    },
  };

winston.addColors(customLevels.colors);

function onlyLevel(...levels: LogLevel[]): winston.Logform.Format {
  return winston.format((info) => {
    return levels.includes(info.level as LogLevel) ? info : false;
  })();
}

function getCallerInfo(): CallerInfo {
  const err = new Error();
  const stack = err.stack?.split("\n") ?? [];

  for (let i = 3; i < stack.length; i++) {
    const line = stack[i];
    if (
      !line.includes("logger.config") &&
      !line.includes("node_modules") &&
      !line.includes("winston")
    ) {
      const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
      if (match) {
        const fnName = match[1] ?? "anonymous";
        const filePath = match[2] ?? "unknown";
        const lineNum = match[3] ?? "0";
        const colNum = match[4] ?? "0";
        const relPath = filePath.includes(process.cwd())
          ? filePath.replace(process.cwd(), "").replace(/^\//, "")
          : filePath;
        return { fn: fnName, file: relPath, line: lineNum, col: colNum };
      }
    }
  }

  return { fn: "unknown", file: "unknown", line: "0", col: "0" };
}

function sanitizeMetadata(metadata: unknown): unknown {
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "creditCard",
    "cvv",
    "ssn",
    "otp",
  ];

  if (metadata === null || metadata === undefined) return metadata;
  if (typeof metadata !== "object") return metadata;

  if (Array.isArray(metadata)) {
    return metadata.map((item) => sanitizeMetadata(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(metadata)) {
    const lowerKey = key.toLowerCase();
    const value = (metadata as Record<string, unknown>)[key];
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getMemoryUsage(): MemoryUsage {
  const mem = process.memoryUsage();
  return {
    rss: formatBytes(mem.rss),
    heapUsed: formatBytes(mem.heapUsed),
    heapTotal: formatBytes(mem.heapTotal),
    external: formatBytes(mem.external),
  };
}

function flattenMetadata(obj: Record<string, unknown>, prefix = ""): string {
  return Object.entries(obj)
    .filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        v !== "none" &&
        v !== "unauthenticated",
    )
    .map(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
        return flattenMetadata(v as Record<string, unknown>, key);
      }
      if (typeof v === "string" && v.includes(" ")) {
        return `${key}="${v}"`;
      }
      return `${key}=${String(v)}`;
    })
    .filter(Boolean)
    .join(" ");
}

const LEVEL_LABEL: Record<string, string> = {
  error: "ERROR",
  warn: "WARN ",
  info: "INFO ",
  http: "HTTP ",
  audit: "AUDIT",
  query: "QUERY",
  debug: "DEBUG",
};

const MODULE_PAD = 20;

function buildLog4jLine(
  timestamp: string,
  level: string,
  message: string,
  metadata: Record<string, unknown>,
  withColor: boolean,
): string {
  const levelLabel = LEVEL_LABEL[level] ?? level.toUpperCase().padEnd(5);
  const module = (metadata["module"] as string | undefined) ?? "App";
  const pid = process.pid;
  const caller = metadata["caller"] as CallerInfo | undefined;

  const skip = new Set([
    "module",
    "service",
    "environment",
    "version",
    "nodeId",
    "hostname",
    "platform",
    "uptime",
    "memory",
    "pid",
    "caller",
    "splat",
    "level",
    "message",
    "timestamp",
  ]);

  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (!skip.has(k)) rest[k] = v;
  }

  const sanitized = sanitizeMetadata(rest) as Record<string, unknown>;
  const metaPart = flattenMetadata(sanitized);
  const callerPart = caller ? ` [${caller.file}:${caller.line}]` : "";
  const modulePadded = module.padEnd(MODULE_PAD);
  const metaSuffix = metaPart ? ` | ${metaPart}` : "";

  if (withColor) {
    const colorMap: Record<string, string> = {
      error: "\x1b[31m\x1b[1m",
      warn: "\x1b[33m\x1b[1m",
      info: "\x1b[32m",
      http: "\x1b[35m",
      audit: "\x1b[36m\x1b[1m",
      query: "\x1b[34m",
      debug: "\x1b[37m",
    };
    const reset = "\x1b[0m";
    const color = colorMap[level] ?? "";
    return `${color}${timestamp} [${levelLabel}] [${modulePadded}] [PID:${pid}]${callerPart} - ${message}${metaSuffix}${reset}`;
  }

  return `${timestamp} [${levelLabel}] [${modulePadded}] [PID:${pid}]${callerPart} - ${message}${metaSuffix}`;
}

const log4jConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    if (isDevelopment) {
      metadata["caller"] = getCallerInfo();
    }
    return buildLog4jLine(
      timestamp as string,
      level,
      message as string,
      metadata as Record<string, unknown>,
      true,
    );
  }),
);

const log4jFileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    info["pid"] = process.pid;
    info["nodeId"] = nodeId;
    info["hostname"] = os.hostname();
    info["uptime"] = Math.floor(process.uptime());
    info["memory"] = getMemoryUsage();
    info["caller"] = getCallerInfo();
    if (info["metadata"]) {
      info["metadata"] = sanitizeMetadata(info["metadata"] as SanitizableValue);
    }
    return info;
  })(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    return buildLog4jLine(
      timestamp as string,
      level,
      message as string,
      metadata as Record<string, unknown>,
      false,
    );
  }),
);

type WinstonTransport =
  | winston.transports.FileTransportInstance
  | winston.transports.ConsoleTransportInstance;

const baseTransports: WinstonTransport[] = [
  new winston.transports.File({
    filename: path.join(logsDir, "error", "error.log"),
    level: "error",
    format: winston.format.combine(onlyLevel("error"), log4jFileFormat),
    maxsize: 10485760,
    maxFiles: 10,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "warning", "warning.log"),
    level: "warn",
    format: winston.format.combine(onlyLevel("warn"), log4jFileFormat),
    maxsize: 5242880,
    maxFiles: 7,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "info", "info.log"),
    level: "info",
    format: winston.format.combine(onlyLevel("info"), log4jFileFormat),
    maxsize: 10485760,
    maxFiles: 7,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
    format: log4jFileFormat,
    maxsize: 20971520,
    maxFiles: 10,
    tailable: true,
  }),
  new winston.transports.Console({
    format: log4jConsoleFormat,
    stderrLevels: ["error"],
  }),
];

export const logger = winston.createLogger({
  level: isDevelopment ? "debug" : logLevel,
  levels: customLevels.levels,
  defaultMeta: {
    service: serviceName,
    version: serviceVersion,
    environment: process.env.NODE_ENV ?? "development",
    nodeId,
  },
  transports: baseTransports,
  exitOnError: false,
  silent: process.env.DISABLE_LOGS === "true",
});

logger.setMaxListeners(30);

logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, "error", "exceptions.log"),
    format: log4jFileFormat,
    maxsize: 5242880,
    maxFiles: 10,
  }),
  new winston.transports.Console({
    format: log4jConsoleFormat,
  }),
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, "error", "rejections.log"),
    format: log4jFileFormat,
    maxsize: 5242880,
    maxFiles: 10,
  }),
  new winston.transports.Console({
    format: log4jConsoleFormat,
  }),
);

export function createRequestLogger(
  requestId: string,
  userId: string | undefined,
  schoolId: string | undefined,
  role: string | undefined,
  ip: string | undefined,
): winston.Logger {
  return logger.child({
    requestId,
    userId: userId ?? "unauthenticated",
    schoolId: schoolId ?? "none",
    role: role ?? "none",
    ip,
  });
}

export function createModuleLogger(moduleName: string): winston.Logger {
  return logger.child({ module: moduleName });
}

export function logRequest(
  req: AuthenticatedRequest,
  res: Response,
  duration: number,
): void {
  const logData = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.context?.ip ?? req.socket?.remoteAddress,
    userAgent: req.headers["user-agent"],
    userId: req.user?.id ?? "unauthenticated",
    schoolId: req.user?.schoolId ?? "none",
    role: req.user?.role ?? "none",
    contentLength: res.getHeader("content-length") ?? 0,
    referer: req.headers["referer"] ?? "none",
  };

  if (res.statusCode >= 500) {
    logger.error("HTTP Request Failed", logData);
  } else if (res.statusCode >= 400) {
    logger.warn("HTTP Request Client Error", logData);
  } else {
    logger.http("HTTP Request", logData);
  }
}

export function logAudit(
  action: string,
  performedBy: string,
  target: string | null,
  details: AuditDetails,
): void {
  logger.log("audit", `AUDIT: ${action}`, {
    action,
    performedBy,
    target,
    ...(sanitizeMetadata(details) as AuditDetails),
    auditTimestamp: new Date().toISOString(),
  });
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  operation: string,
  isSlow: boolean,
): void {
  const logData = {
    query,
    duration: `${duration}ms`,
    operation,
    isSlow: isSlow ?? false,
  };

  if (isSlow) {
    logger.warn("Slow Database Query", logData);
  } else {
    logger.log("query", "Database Query", logData);
  }
}

export function logSecurityEvent(
  event: string,
  ip: string,
  userId: string | null,
  details: SecurityDetails,
): void {
  logger.warn(`SECURITY: ${event}`, {
    securityEvent: event,
    ip,
    userId: userId ?? "unauthenticated",
    ...(sanitizeMetadata(details) as SecurityDetails),
    securityTimestamp: new Date().toISOString(),
  });
}

export function logSystemStartup(): void {
  logger.info("System Starting Up", {
    serviceName,
    serviceVersion,
    nodeId,
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    pid: process.pid,
    env: process.env.NODE_ENV,
    cpus: os.cpus().length,
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    logLevel: isDevelopment ? "debug" : logLevel,
    logsDirectory: logsDir,
  });
}

export function logSystemShutdown(reason: string): void {
  logger.info("System Shutting Down", {
    reason,
    uptime: `${Math.floor(process.uptime())}s`,
    memory: getMemoryUsage(),
    timestamp: new Date().toISOString(),
  });
}

if (isDevelopment) {
  logSystemStartup();
}
