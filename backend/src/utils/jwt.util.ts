import "dotenv/config";
import jwt from "jsonwebtoken";
import { createModuleLogger } from "../config/logger.config.js";

const log = createModuleLogger("JWT");

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not configured");
}

const ACCESS_TOKEN_SECRET: string = process.env.JWT_ACCESS_SECRET;
const ACCESS_TOKEN_EXPIRY: string = process.env.ACCESS_TOKEN_EXPIRY ?? "15m";

if (ACCESS_TOKEN_SECRET.length < 32) {
  log.warn("JWT_ACCESS_SECRET should be at least 32 characters for security");
}

type ExpiryUnit = "s" | "m" | "h" | "d";

const EXPIRY_MULTIPLIERS: Record<ExpiryUnit, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const value = parseInt(match[1], 10);
  const unit = match[2] as ExpiryUnit;
  return value * EXPIRY_MULTIPLIERS[unit];
}

export interface TokenPayload {
  userId: string;
  role: string;
  schoolId?: string;
  sessionId: string;
}

export interface DecodedToken extends TokenPayload {
  tokenType: "access";
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(
      { ...payload, tokenType: "access" },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: parseExpiry(ACCESS_TOKEN_EXPIRY),
        issuer: "school-management-system",
        audience: "school-management-user",
      },
    );

    log.debug("Access token generated", {
      userId: payload.userId,
      sessionId: payload.sessionId,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    return token;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to generate access token", {
      error: err.message,
      userId: payload.userId,
    });
    throw new Error("Failed to generate access token");
  }
}

export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "school-management-system",
      audience: "school-management-user",
    }) as DecodedToken;

    if (decoded.tokenType !== "access") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    const err = error as Error;
    log.warn("Access token verification failed", { error: err.message });
    throw err;
  }
}

export function getAccessTokenExpiry(): number {
  return parseExpiry(ACCESS_TOKEN_EXPIRY);
}