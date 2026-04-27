import log4js from "log4js";
import os from "os";

const logLevel = process.env.LOG_LEVEL ?? "info";
const isDevelopment = process.env.NODE_ENV === "development";
const serviceName = process.env.SERVICE_NAME ?? "school-management-system";
const nodeId = process.env.NODE_ID ?? `node-${os.hostname()}-${process.pid}`;

log4js.configure({
  levels: {
    HTTP: { value: 2500, colour: "magenta" },
    AUDIT: { value: 3500, colour: "cyan" },
    QUERY: { value: 1500, colour: "blue" },
  },
  appenders: {
    console: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: `%d{yyyy-MM-dd hh:mm:ss.SSS} [%[%-5p%]] [%-20c] [PID:%z] [%f{1}:%l] - %m`,
      },
    },
    errorFile: {
      type: "file",
      filename: "logs/error/error.log",
      maxLogSize: 10485760,
      backups: 10,
    },
    warnFile: {
      type: "file",
      filename: "logs/warning/warning.log",
      maxLogSize: 5242880,
      backups: 7,
    },
    infoFile: {
      type: "file",
      filename: "logs/info/info.log",
      maxLogSize: 10485760,
      backups: 7,
    },
    combinedFile: {
      type: "file",
      filename: "logs/combined.log",
      maxLogSize: 20971520,
      backups: 10,
    },
    justErrors: {
      type: "logLevelFilter",
      appender: "errorFile",
      level: "error",
      maxLevel: "error",
    },
    justWarns: {
      type: "logLevelFilter",
      appender: "warnFile",
      level: "warn",
      maxLevel: "warn",
    },
    justInfos: {
      type: "logLevelFilter",
      appender: "infoFile",
      level: "info",
      maxLevel: "info",
    },
  },
  categories: {
    default: {
      appenders: [
        "console",
        "justErrors",
        "justWarns",
        "justInfos",
        "combinedFile",
      ],
      level: isDevelopment ? "debug" : logLevel,
      enableCallStack: true,
    },
  },
});

export const logger = log4js.getLogger("App");

export function createRequestLogger(
  requestId: string,
  userId?: string,
  schoolId?: string,
  role?: string,
  ip?: string,
) {
  const child = log4js.getLogger("RequestLogger");
  child.addContext("requestId", requestId);
  child.addContext("userId", userId ?? "unauthenticated");
  return child;
}

export function createModuleLogger(moduleName: string) {
  return log4js.getLogger(moduleName);
}

export function logRequest(req: any, res: any, duration: number): void {
  const logData = `method=${req.method} url=${req.originalUrl} statusCode=${res.statusCode} duration=${duration}ms userId=${req.user?.id ?? "unauthenticated"}`;
  if (res.statusCode >= 500) {
    logger.error(`HTTP Request Failed | ${logData}`);
  } else if (res.statusCode >= 400) {
    logger.warn(`HTTP Request Client Error | ${logData}`);
  } else {
    (logger as any).http(`HTTP Request | ${logData}`);
  }
}

export function logAudit(
  action: string,
  performedBy: string,
  target: string | null,
  details: any,
): void {
  (logger as any).audit(
    `AUDIT: ${action} | performedBy=${performedBy} target=${target} details=${JSON.stringify(details)}`,
  );
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  operation: string,
  isSlow: boolean,
): void {
  const msg = `Database Query | op=${operation} duration=${duration}ms query="${query}"`;
  isSlow ? logger.warn(`Slow ${msg}`) : (logger as any).query(msg);
}

export function logSecurityEvent(
  event: string,
  ip: string,
  userId: string | null,
  details: any,
): void {
  logger.warn(
    `SECURITY: ${event} | ip=${ip} userId=${userId ?? "unauthenticated"} details=${JSON.stringify(details)}`,
  );
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

if (isDevelopment) {
  logSystemStartup();
}
