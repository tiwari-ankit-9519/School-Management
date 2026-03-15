import type { Request, Response, NextFunction } from "express";
import { createModuleLogger, logAudit, logSecurityEvent } from "../config/logger.config.js";
import { ZodError } from "zod";

const log = createModuleLogger("ErrorHandler");

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ─── Custom Error Classes ─────────────────────────────────────────────────────

export class AppError extends Error {
  statusCode: number;
  metadata: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  fields: string[];

  constructor(message: string, fields: string[] = []) {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  resource: string;

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ""} not found`, HTTP_STATUS.NOT_FOUND);
    this.name = "NotFoundError";
    this.resource = resource;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  retryAfter: number;

  constructor(retryAfter: number = 60) {
    super("Too many requests, please slow down", HTTP_STATUS.TOO_MANY_REQUESTS);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─── Prisma Error Types ───────────────────────────────────────────────────────

interface PrismaKnownError extends Error {
  code: string;
  meta?: { target?: string[] };
}

interface PrismaInitError extends Error {
  errorCode?: string;
}

// ─── Error Classification ─────────────────────────────────────────────────────

type ErrorType =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "DATABASE_VALIDATION_ERROR"
  | "DATABASE_INIT_ERROR"
  | "JWT_INVALID"
  | "JWT_EXPIRED"
  | "JWT_NOT_ACTIVE"
  | "CONNECTION_REFUSED"
  | "DNS_RESOLUTION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UNHANDLED_ERROR";

function classifyError(error: Error & { code?: string; statusCode?: number }): ErrorType {
  if (error instanceof ZodError) return "VALIDATION_ERROR";
  if (error.name === "PrismaClientKnownRequestError") return "DATABASE_ERROR";
  if (error.name === "PrismaClientValidationError") return "DATABASE_VALIDATION_ERROR";
  if (error.name === "PrismaClientInitializationError") return "DATABASE_INIT_ERROR";
  if (error.name === "JsonWebTokenError") return "JWT_INVALID";
  if (error.name === "TokenExpiredError") return "JWT_EXPIRED";
  if (error.name === "NotBeforeError") return "JWT_NOT_ACTIVE";
  if (error.code === "ECONNREFUSED") return "CONNECTION_REFUSED";
  if (error.code === "ENOTFOUND") return "DNS_RESOLUTION_FAILED";
  if (error.statusCode === 401) return "UNAUTHORIZED";
  if (error.statusCode === 403) return "FORBIDDEN";
  if (error.statusCode === 429) return "RATE_LIMITED";
  return "UNHANDLED_ERROR";
}

function getPrismaErrorDetails(error: PrismaKnownError): { status: HttpStatus; message: string } {
  switch (error.code) {
    case "P2000": return { status: HTTP_STATUS.BAD_REQUEST, message: "Input value too long for field" };
    case "P2001": return { status: HTTP_STATUS.NOT_FOUND, message: "Record not found" };
    case "P2002": {
      const fields = error.meta?.target?.join(", ") ?? "unknown field";
      return { status: HTTP_STATUS.CONFLICT, message: `A record with this ${fields} already exists` };
    }
    case "P2003": return { status: HTTP_STATUS.BAD_REQUEST, message: "Foreign key constraint violation" };
    case "P2004": return { status: HTTP_STATUS.BAD_REQUEST, message: "Database constraint violation" };
    case "P2005": return { status: HTTP_STATUS.BAD_REQUEST, message: "Invalid field value stored in database" };
    case "P2006": return { status: HTTP_STATUS.BAD_REQUEST, message: "Invalid value provided for field" };
    case "P2011": return { status: HTTP_STATUS.BAD_REQUEST, message: "Required field cannot be null" };
    case "P2012": return { status: HTTP_STATUS.BAD_REQUEST, message: "Missing required field" };
    case "P2014": return { status: HTTP_STATUS.BAD_REQUEST, message: "Relation violation — required relation missing" };
    case "P2015": return { status: HTTP_STATUS.NOT_FOUND, message: "Related record not found" };
    case "P2018": return { status: HTTP_STATUS.NOT_FOUND, message: "Required connected records not found" };
    case "P2025": return { status: HTTP_STATUS.NOT_FOUND, message: "Record not found or missing required relation" };
    case "P2034": return { status: HTTP_STATUS.CONFLICT, message: "Transaction conflict, please retry" };
    default: return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: "A database error occurred" };
  }
}

// ─── Error Handler ────────────────────────────────────────────────────────────

export async function errorHandler(
  error: Error & { code?: string; statusCode?: number; retryAfter?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const errorType = classifyError(error);
  const requestId = req.requestId ?? "unknown";
  const userId = req.user?.id ?? null;
  const schoolId = req.user?.schoolId ?? null;
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";

  const baseLogContext = {
    requestId,
    userId,
    schoolId,
    errorType,
    path: req.path,
    method: req.method,
    ip,
    userAgent: req.headers["user-agent"],
    stack: process.env.ENABLE_ERROR_STACK_TRACE === "true" ? error.stack : undefined,
  };

  // Zod Validation Error
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
      received: "received" in issue ? issue.received : undefined,
    }));

    log.warn("Validation error", {
      ...baseLogContext,
      errorCount: formattedErrors.length,
      errors: formattedErrors,
    });

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      requestId,
    });
    return;
  }

  // Prisma Known Error
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as unknown as PrismaKnownError;
    const { status, message } = getPrismaErrorDetails(prismaError);

    log.error("Prisma known error", {
      ...baseLogContext,
      prismaCode: prismaError.code,
      prismaMessage: prismaError.message,
      prismaMeta: prismaError.meta,
    });

    res.status(status).json({ success: false, message, requestId });
    return;
  }

  // Prisma Validation Error
  if (error.name === "PrismaClientValidationError") {
    log.error("Prisma validation error", { ...baseLogContext, error: error.message });

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid data provided to database operation",
      requestId,
    });
    return;
  }

  // Prisma Initialization Error
  if (error.name === "PrismaClientInitializationError") {
    const prismaInitError = error as unknown as PrismaInitError;

    log.error("Prisma initialization error — database may be unreachable", {
      ...baseLogContext,
      error: error.message,
      errorCode: prismaInitError.errorCode,
    });

    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      message: "Service temporarily unavailable",
      requestId,
    });
    return;
  }

  // JWT Errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError" ||
    error.name === "NotBeforeError"
  ) {
    logSecurityEvent(`JWT_ERROR_${errorType}`, ip, userId, {
      requestId,
      schoolId,
      path: req.path,
      method: req.method,
      errorName: error.name,
      errorMessage: error.message,
    });

    log.warn("JWT error", { ...baseLogContext, error: error.message, errorName: error.name });

    const jwtMessages: Record<string, string> = {
      TokenExpiredError: "Your session has expired, please log in again",
      JsonWebTokenError: "Invalid authentication token",
      NotBeforeError: "Authentication token is not yet active",
    };

    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: jwtMessages[error.name] ?? "Authentication failed",
      requestId,
    });
    return;
  }

  // 401 Unauthorized
  if (error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
    logSecurityEvent("UNAUTHORIZED_ACCESS_ATTEMPT", ip, userId, {
      requestId,
      schoolId,
      path: req.path,
      method: req.method,
      message: error.message,
    });

    log.warn("Unauthorized access attempt", { ...baseLogContext, error: error.message });

    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: error.message || "Unauthorized",
      requestId,
    });
    return;
  }

  // 403 Forbidden
  if (error.statusCode === HTTP_STATUS.FORBIDDEN) {
    logSecurityEvent("FORBIDDEN_ACCESS_ATTEMPT", ip, userId, {
      requestId,
      schoolId,
      path: req.path,
      method: req.method,
      role: req.user?.role,
      message: error.message,
    });

    log.warn("Forbidden access attempt", {
      ...baseLogContext,
      role: req.user?.role,
      error: error.message,
    });

    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: error.message || "You do not have permission to perform this action",
      requestId,
    });
    return;
  }

  // 429 Rate Limit
  if (error.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
    logSecurityEvent("RATE_LIMIT_EXCEEDED", ip, userId, {
      requestId,
      schoolId,
      path: req.path,
      method: req.method,
      retryAfter: error.retryAfter,
    });

    log.warn("Rate limit exceeded", { ...baseLogContext, retryAfter: error.retryAfter });

    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many requests, please slow down",
      retryAfter: error.retryAfter ?? 60,
      requestId,
    });
    return;
  }

  // Other 4xx Client Errors
  if (error.statusCode && error.statusCode < 500) {
    log.warn("Client error", {
      ...baseLogContext,
      statusCode: error.statusCode,
      error: error.message,
    });

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      requestId,
    });
    return;
  }

  // Unhandled 500
  log.error("Unhandled server error", {
    ...baseLogContext,
    error: error.message,
    errorName: error.name,
    stack: error.stack,
  });

  await logAudit("UNHANDLED_ERROR", userId ?? "system", null, {
    requestId,
    schoolId,
    errorType,
    errorMessage: error.message,
    path: req.path,
    method: req.method,
    ip,
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "An unexpected error occurred",
    requestId,
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
}

// ─── Not Found & Method Not Allowed ──────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.requestId ?? "unknown";
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  const userId = req.user?.id ?? null;

  log.warn("Route not found", {
    requestId,
    userId,
    schoolId: req.user?.schoolId ?? null,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    ip,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"] ?? null,
  });

  logSecurityEvent("ROUTE_NOT_FOUND", ip, userId, {
    requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    requestId,
  });
}

export function methodNotAllowedHandler(req: Request, res: Response): void {
  const requestId = req.requestId ?? "unknown";

  log.warn("Method not allowed", {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({
    success: false,
    message: `Method ${req.method} is not allowed on ${req.path}`,
    requestId,
  });
}