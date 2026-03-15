import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";
import { createModuleLogger, logSecurityEvent } from "../config/logger.config.js";

const log = createModuleLogger("SecurityMiddleware");

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const cdnUrl = process.env.CDN_URL || null;
const cloudinaryUrl = "https://res.cloudinary.com";

const imgSrcDirectives: string[] = ["'self'", "data:", "blob:", cloudinaryUrl];
if (cdnUrl) imgSrcDirectives.push(cdnUrl);

const mediaSrcDirectives: string[] = ["'self'", cloudinaryUrl];
if (cdnUrl) mediaSrcDirectives.push(cdnUrl);

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      styleSrcElem: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      imgSrc: imgSrcDirectives,
      mediaSrc: mediaSrcDirectives,
      connectSrc: [
        "'self'",
        ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : []),
        ...allowedOrigins,
      ],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
      blockAllMixedContent: isProduction ? [] : null,
    },
    reportOnly: false,
  },

  hsts: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,

  frameguard: {
    action: "deny",
  },

  noSniff: true,

  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },

  crossOriginEmbedderPolicy: isProduction
    ? { policy: "require-corp" }
    : false,

  crossOriginOpenerPolicy: {
    policy: "same-origin",
  },

  crossOriginResourcePolicy: {
    policy: isProduction ? "same-origin" : "cross-origin",
  },

  originAgentCluster: true,

  dnsPrefetchControl: {
    allow: false,
  },

  ieNoOpen: true,

  hidePoweredBy: true,
});

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  const isAllowedOrigin =
    isDevelopment ||
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes("*");

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Request-ID, X-Correlation-ID"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Vary", "Origin");
  } else {
    log.warn("Blocked request from disallowed origin", {
      requestId: (req as any).requestId,
      origin,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    logSecurityEvent("CORS_ORIGIN_BLOCKED", req.ip ?? "unknown", (req as any).user?.id ?? null, {
      requestId: (req as any).requestId,
      origin,
      path: req.path,
      method: req.method,
    });
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export function enforceHttpsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isProduction) {
    return next();
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps =
    req.secure ||
    forwardedProto === "https" ||
    (typeof forwardedProto === "string" && forwardedProto.includes("https"));

  if (!isHttps) {
    log.warn("HTTP request blocked, redirecting to HTTPS", {
      requestId: (req as any).requestId,
      ip: req.ip,
      host: req.headers.host,
      path: req.path,
    });

    const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
    res.redirect(301, httpsUrl);
    return;
  }

  next();
}

export function requestSizeLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentLength = parseInt(req.headers["content-length"] || "0");
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE_BYTES || "10485760");

  if (contentLength > maxSize) {
    log.warn("Request size limit exceeded", {
      requestId: (req as any).requestId,
      ip: req.ip,
      contentLength,
      maxSize,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id ?? null,
    });

    logSecurityEvent(
      "REQUEST_SIZE_LIMIT_EXCEEDED",
      req.ip ?? "unknown",
      (req as any).user?.id ?? null,
      {
        requestId: (req as any).requestId,
        contentLength,
        maxSize,
        path: req.path,
      }
    );

    res.status(413).json({
      success: false,
      message: "Request payload too large",
      requestId: (req as any).requestId,
    });
    return;
  }

  next();
}

export function securityResponseHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader("X-Request-ID", (req as any).requestId || "unknown");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  res.removeHeader("ETag");

  if (isProduction) {
    res.setHeader("Expect-CT", "max-age=86400, enforce");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
    );
  }

  next();
}