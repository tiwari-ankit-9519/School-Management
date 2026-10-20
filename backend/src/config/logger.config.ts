import { AsyncLocalStorage } from "async_hooks";
import log4js, { Logger, LoggingEvent } from "log4js";
import os from "os";
import path from "path";

const logLevel = process.env.LOG_LEVEL ?? "info";
const isDevelopment = process.env.NODE_ENV === "development";
const serviceName = process.env.SERVICE_NAME ?? "school-management-system";
const nodeId = process.env.NODE_ID ?? `node-${os.hostname()}-${process.pid}`;
const logDir = process.env.LOG_DIR ?? "logs";
const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS ?? "14", 10);
const maxDataLength = parseInt(process.env.LOG_MAX_DATA_LENGTH ?? "8192", 10);
const includeLocation =
  isDevelopment || process.env.LOG_INCLUDE_LOCATION === "true";
const useColour = isDevelopment && process.stdout.isTTY === true;

export interface LogContextUser {
  id: string;
  role: string;
}

export interface LogContext {
  requestId: string;
  method?: string;
  path?: string;
  ip?: string;
  userId?: string;
  role?: string;
  controller?: string;
  traceId?: string;
  getUser?: () => LogContextUser | undefined;
}

export interface AppLogger extends Logger {
  http(message: unknown, ...args: unknown[]): void;
  audit(message: unknown, ...args: unknown[]): void;
  query(message: unknown, ...args: unknown[]): void;
}

interface ResolvedContext {
  requestId: string;
  userId: string;
  role: string;
  controller: string;
  method?: string;
  path?: string;
  ip?: string;
  traceId?: string;
}

interface LoggableRequest {
  method: string;
  originalUrl: string;
  user?: { id: string; role?: string };
}

interface LoggableResponse {
  statusCode: number;
}

const logContextStorage = new AsyncLocalStorage<LogContext>();

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "confirmpassword",
  "oldpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "otp",
  "pin",
  "cvv",
  "cardnumber",
  "authorization",
  "cookie",
]);

const SENSITIVE_PATTERNS: RegExp[] = [
  /\$argon2(?:id|i|d)\$[^\s'",]+/g,
  /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
];

const LEVEL_COLOURS: Record<string, string> = {
  TRACE: "90",
  DEBUG: "36",
  QUERY: "34",
  INFO: "32",
  HTTP: "35",
  WARN: "33",
  AUDIT: "96",
  ERROR: "31",
  FATAL: "1;31",
  MARK: "37",
};

const pad = (value: number, width = 2): string =>
  String(value).padStart(width, "0");

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function redactString(value: string): string {
  return SENSITIVE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    value,
  );
}

function truncate(text: string): string {
  if (text.length <= maxDataLength) return text;
  return `${text.slice(0, maxDataLength)}…[truncated ${text.length - maxDataLength} chars]`;
}

function toSerializable(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function")
    return `[Function ${value.name || "anonymous"}]`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  let result: unknown;
  if (Array.isArray(value)) {
    result = value.map((item) => toSerializable(item, seen));
  } else {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? "[REDACTED]"
        : toSerializable(entry, seen);
    }
    result = output;
  }

  seen.delete(value);
  return result;
}

function formatArg(value: unknown): string {
  if (typeof value === "string") return truncate(redactString(value));
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`;
  }
  const serialized = JSON.stringify(toSerializable(value));
  return truncate(serialized ?? String(value));
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function resolveContext(event: LoggingEvent): ResolvedContext {
  const store = logContextStorage.getStore();
  const eventContext: Record<string, unknown> = event.context ?? {};
  const user = store?.getUser?.();

  return {
    requestId: store?.requestId ?? asString(eventContext.requestId) ?? "-",
    userId: user?.id ?? store?.userId ?? asString(eventContext.userId) ?? "-",
    role: user?.role ?? store?.role ?? asString(eventContext.role) ?? "-",
    controller: store?.controller ?? asString(eventContext.controller) ?? "-",
    method: store?.method,
    path: store?.path,
    ip: store?.ip ?? asString(eventContext.ip),
    traceId: store?.traceId,
  };
}

function resolveLocation(event: LoggingEvent): string | undefined {
  if (!includeLocation || !event.fileName) return undefined;
  const fileName = path.basename(event.fileName);
  if (fileName.startsWith("logger.config")) return undefined;
  return `${fileName}:${event.lineNumber ?? 0}`;
}

function paint(text: string, levelStr: string, colour: boolean): string {
  if (!colour) return text;
  const code = LEVEL_COLOURS[levelStr] ?? "37";
  return `\x1b[${code}m${text}\x1b[0m`;
}

log4js.addLayout(
  "log4j2",
  (config: { colour?: boolean }) => (event: LoggingEvent) => {
    const ctx = resolveContext(event);
    const levelStr = event.level.levelStr;
    const levelText = paint(
      levelStr.padEnd(5),
      levelStr,
      config.colour ?? false,
    );
    const location = resolveLocation(event);
    const message = event.data.map(formatArg).join(" ");

    return `${formatTimestamp(event.startTime)} ${levelText} [pid:${event.pid}] [req:${ctx.requestId}] [user:${ctx.userId}] [ctrl:${ctx.controller}] ${event.categoryName}${location ? ` (${location})` : ""} - ${message}`;
  },
);

log4js.addLayout("json", () => (event: LoggingEvent) => {
  const ctx = resolveContext(event);
  const [first, ...rest] = event.data;

  return JSON.stringify({
    timestamp: event.startTime.toISOString(),
    level: event.level.levelStr,
    service: serviceName,
    nodeId,
    pid: event.pid,
    logger: event.categoryName,
    requestId: ctx.requestId,
    traceId: ctx.traceId,
    userId: ctx.userId,
    role: ctx.role,
    controller: ctx.controller,
    method: ctx.method,
    path: ctx.path,
    ip: ctx.ip,
    location: resolveLocation(event),
    message: typeof first === "string" ? redactString(first) : formatArg(first),
    data:
      rest.length > 0 ? rest.map((item) => toSerializable(item)) : undefined,
  });
});

const rollingFile = (filename: string, layoutType: "log4j2" | "json") => ({
  type: "dateFile" as const,
  filename: path.join(logDir, filename),
  pattern: "yyyy-MM-dd",
  keepFileExt: true,
  compress: true,
  numBackups: retentionDays,
  layout:
    layoutType === "log4j2"
      ? { type: "log4j2", colour: false }
      : { type: "json" },
});

log4js.configure({
  levels: {
    QUERY: { value: 15000, colour: "blue" },
    HTTP: { value: 25000, colour: "magenta" },
    AUDIT: { value: 35000, colour: "cyan" },
  },
  appenders: {
    console: {
      type: "stdout",
      layout: { type: "log4j2", colour: useColour },
    },
    appFile: rollingFile("app/app.log", "log4j2"),
    jsonFile: rollingFile("json/app.json.log", "json"),
    errorFile: rollingFile("error/error.log", "log4j2"),
    warnFile: rollingFile("warning/warning.log", "log4j2"),
    accessFile: rollingFile("access/access.log", "log4j2"),
    auditFile: rollingFile("audit/audit.log", "log4j2"),
    errors: {
      type: "logLevelFilter",
      appender: "errorFile",
      level: "error",
      maxLevel: "fatal",
    },
    warnings: {
      type: "logLevelFilter",
      appender: "warnFile",
      level: "warn",
      maxLevel: "warn",
    },
    access: {
      type: "logLevelFilter",
      appender: "accessFile",
      level: "http",
      maxLevel: "http",
    },
    audits: {
      type: "logLevelFilter",
      appender: "auditFile",
      level: "audit",
      maxLevel: "audit",
    },
  },
  categories: {
    default: {
      appenders: [
        "console",
        "appFile",
        "jsonFile",
        "errors",
        "warnings",
        "access",
        "audits",
      ],
      level: isDevelopment ? "debug" : logLevel,
      enableCallStack: includeLocation,
    },
  },
});

export function createModuleLogger(moduleName: string): AppLogger {
  return log4js.getLogger(moduleName) as AppLogger;
}

export const logger = createModuleLogger("App");
const httpLogger = createModuleLogger("HttpAccess");
const auditLogger = createModuleLogger("Audit");
const securityLogger = createModuleLogger("Security");
const databaseLogger = createModuleLogger("Database");

export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  return logContextStorage.run({ ...context }, fn);
}

export function getLogContext(): LogContext | undefined {
  return logContextStorage.getStore();
}

export function getRequestId(): string | undefined {
  return logContextStorage.getStore()?.requestId;
}

export function setLogContext(
  patch: Partial<Omit<LogContext, "requestId">>,
): void {
  const store = logContextStorage.getStore();
  if (store) Object.assign(store, patch);
}

export function withController<Args extends unknown[], R>(
  controllerName: string,
  handler: (...args: Args) => R,
): (...args: Args) => R {
  const label = handler.name
    ? `${controllerName}.${handler.name}`
    : controllerName;
  return (...args: Args): R => {
    setLogContext({ controller: label });
    return handler(...args);
  };
}

export function controllerContext(controllerName: string) {
  return (_req: unknown, _res: unknown, next: () => void): void => {
    setLogContext({ controller: controllerName });
    next();
  };
}

export function createRequestLogger(
  requestId: string,
  userId?: string,
  role?: string,
  ip?: string,
): AppLogger {
  const child = createModuleLogger("RequestLogger");
  child.addContext("requestId", requestId);
  child.addContext("userId", userId ?? "unauthenticated");
  if (role) child.addContext("role", role);
  if (ip) child.addContext("ip", ip);
  return child;
}

export function logRequest(
  req: LoggableRequest,
  res: LoggableResponse,
  duration: number,
): void {
  const summary = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
  const details = {
    statusCode: res.statusCode,
    duration,
    userId: req.user?.id ?? "unauthenticated",
    role: req.user?.role ?? "none",
  };

  if (res.statusCode >= 500) {
    httpLogger.error(`HTTP Request Failed | ${summary}`, details);
  } else if (res.statusCode >= 400) {
    httpLogger.warn(`HTTP Request Client Error | ${summary}`, details);
  } else {
    httpLogger.http(`HTTP Request | ${summary}`, details);
  }
}

export function logAudit(
  action: string,
  performedBy: string,
  target: string | null,
  details: unknown,
): void {
  auditLogger.audit(`AUDIT: ${action}`, { performedBy, target, details });
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  operation: string,
  isSlow: boolean,
): void {
  const details = { operation, duration, query };
  if (isSlow) {
    databaseLogger.warn(
      `Slow Database Query | op=${operation} duration=${duration}ms`,
      details,
    );
  } else {
    databaseLogger.query(
      `Database Query | op=${operation} duration=${duration}ms`,
      details,
    );
  }
}

export function logSecurityEvent(
  event: string,
  ip: string,
  userId: string | null,
  details: unknown,
): void {
  securityLogger.warn(`SECURITY: ${event}`, {
    ip,
    userId: userId ?? "unauthenticated",
    details,
  });
}

export function logSystemStartup(): void {
  logger.info(
    `System Starting Up | serviceName=${serviceName} nodeId=${nodeId} nodeVersion=${process.version}`,
  );
}

export function logSystemShutdown(reason: string): void {
  logger.info(
    `System Shutting Down | reason=${reason} uptime=${Math.floor(process.uptime())}s`,
  );
}

export function shutdownLogger(): Promise<void> {
  return new Promise((resolve) => {
    log4js.shutdown(() => resolve());
  });
}
