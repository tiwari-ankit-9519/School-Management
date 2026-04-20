import express from "express";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction, Application } from "express";

import {
  securityHeaders,
  corsMiddleware,
  enforceHttpsMiddleware,
  requestSizeLimitMiddleware,
  securityResponseHeadersMiddleware,
} from "@/src/middlewares/security.middleware";

import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  requestContextMiddleware,
  suspiciousRequestMiddleware,
} from "@/src/middlewares/request-logger.middleware";

import {
  errorHandler,
  notFoundHandler,
  methodNotAllowedHandler,
} from "@/src/middlewares/error.middleware";

import {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  documentUploadRateLimit,
  notificationRateLimit,
  adminRateLimit,
  sseRateLimit,
  strictRateLimit,
} from "@/src/middlewares/rate-limit.middleware.js";

import { checkRedisConnection } from "./config/redis.config.js";
import { createModuleLogger } from "./config/logger.config.js";
import authRoute from "@/src/routes/auth.route.js";
import schoolApplicationRoute from "@/src/routes/school-application.route.js";
import academicYearRoute from "@/src/routes/academic-year.route.js";
import classRoute from "@/src/routes/class.route.js";
import subjectRoute from "@/src/routes/subject.route.js";
import usersRoute from "@/src/routes/user-management.route.js";
import admissionRoute from "@/src/routes/admission.route.js";
import teacherRoute from "@/src/routes/teacher.route.js";
import timetableRoute from "@/src/routes/timetable.route.js";
import attendanceRoute from "@/src/routes/attendance.route.js";

const log = createModuleLogger("Server");

const API_PREFIX = process.env.API_PREFIX ?? "/api/v1";
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

const app: Application = express();

app.set("trust proxy", process.env.TRUST_PROXY ?? 1);
app.set("x-powered-by", false);
app.disable("etag");

app.use(enforceHttpsMiddleware);
app.use(securityHeaders);
app.use(securityResponseHeadersMiddleware);
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(requestSizeLimitMiddleware);

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT ?? "1mb",
    strict: true,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URL_ENCODED_LIMIT ?? "1mb",
  }),
);

app.use(
  cookieParser(process.env.COOKIE_SECRET, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  } as cookieParser.CookieParseOptions),
);

if (isDevelopment) {
  app.use(
    morgan("dev", {
      skip: (req) => req.path === "/health" || req.path === "/ping",
    }),
  );
}

app.use(requestLoggerMiddleware);
app.use(suspiciousRequestMiddleware);
app.use(generalRateLimit);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const redisAlive = await checkRedisConnection();

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      version: process.env.SERVICE_VERSION ?? "1.0.0",
      services: {
        database: "ok",
        redis: redisAlive ? "ok" : "degraded",
      },
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
    };

    const statusCode = redisAlive ? 200 : 207;
    return res.status(statusCode).json(health);
  } catch (error) {
    const err = error as Error;
    log.error("Health check failed", { error: err.message });
    return res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Service unavailable",
    });
  }
});

app.get("/ping", (_req: Request, res: Response) => {
  return res.status(200).json({ pong: true, ts: Date.now() });
});

app.use(`${API_PREFIX}/auth/login`, authRateLimit);
app.use(`${API_PREFIX}/auth/password-reset`, passwordResetRateLimit);
app.use(`${API_PREFIX}/documents`, documentUploadRateLimit);
app.use(`${API_PREFIX}/notifications`, notificationRateLimit);
app.use(`${API_PREFIX}/sse`, sseRateLimit);
app.use(`${API_PREFIX}/admin`, adminRateLimit);
app.use(`${API_PREFIX}/admin/permissions`, strictRateLimit);
app.use(`${API_PREFIX}/super-admin`, strictRateLimit);

app.use(requestContextMiddleware);

app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/school-application`, schoolApplicationRoute);
app.use(`${API_PREFIX}/school/academic-year`, academicYearRoute);
app.use(`${API_PREFIX}/school/class`, classRoute);
app.use(`${API_PREFIX}/school/subject`, subjectRoute);
app.use(`${API_PREFIX}/school/users`, usersRoute);
app.use(`${API_PREFIX}/school/admission`, admissionRoute);
app.use(`${API_PREFIX}/school/teacher`, teacherRoute);
app.use(`${API_PREFIX}/school/timetable`, timetableRoute);
app.use(`${API_PREFIX}/school/attendance`, attendanceRoute);

app.use((req: Request, res: Response, _next: NextFunction) => {
  const knownPaths = [
    `${API_PREFIX}/auth`,
    `${API_PREFIX}/school-application`,
    `${API_PREFIX}/school/academic-year`,
    `${API_PREFIX}/school/class`,
    `${API_PREFIX}/school/subject`,
    `${API_PREFIX}/school/users`,
    `${API_PREFIX}/school/admission`,
    `${API_PREFIX}/school/teacher`,
    `${API_PREFIX}/school/timetable`,
    `${API_PREFIX}/school/attendance`,
    "/health",
    "/ping",
  ];

  const pathMatches = knownPaths.some((p) => req.path.startsWith(p));

  if (pathMatches) {
    return methodNotAllowedHandler(req, res);
  }

  return notFoundHandler(req, res);
});

app.use(errorHandler);

export { app };
