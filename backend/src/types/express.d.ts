import type { createRequestLogger } from "@/src/config/logger.config";

declare namespace Express {
  interface Request {
    requestId?: string;
    startTime?: number;
    fingerprint?: string;
    isBot?: boolean;
    context?: {
      ip: string;
      isPrivateIp: boolean;
      isVpnOrProxy: boolean;
      deviceInfo: {
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
      };
      fingerprint: string;
      referrer: string | null;
      origin: string | null;
      acceptLanguage: string | null;
      contentType: string | null;
      xRequestedWith: string | null;
    };
    deviceInfo?: {
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
    };
    user?: {
      id: string;
      schoolId: string;
      role: string;
    };
    log?: ReturnType<typeof createRequestLogger>;
    session?: {
      id?: string;
    };
  }
}

export interface AuthenticatedUser {
  id: string;
  schoolId: string;
  role: string;
}

export interface AuthenticatedRequest extends Express.Request {
  requestId?: string;
  user?: AuthenticatedUser;
  context?: Express.Request["context"];
}
