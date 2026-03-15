import type { Request } from "express";
import { UAParser } from "ua-parser-js";
import { createModuleLogger } from "../config/logger.config.js";

const log = createModuleLogger("RequestParserUtil");

const MAX_USER_AGENT_LENGTH = 500;
const MAX_REFERRER_LENGTH = 2048;

const BOT_PATTERNS: RegExp[] = [
  /bot|crawler|spider|crawling|scraper|archiver/i,
  /facebookexternalhit|twitterbot|linkedinbot|slackbot/i,
  /googlebot|bingbot|yandexbot|duckduckbot|baiduspider/i,
  /python-requests|python-urllib|go-http-client|java\/\d/i,
  /wget|curl|libcurl|httpie|axios\/\d|node-fetch/i,
  /postman|insomnia|paw|restsharp|okhttp/i,
  /headlesschrome|phantomjs|selenium|puppeteer|playwright/i,
  /scanbot|nmap|masscan|zgrab|nuclei/i,
];

const MOBILE_DEVICE_TYPES: string[] = ["mobile", "tablet"];

const KNOWN_VPN_ISP_PATTERNS: RegExp[] = [
  /nordvpn|expressvpn|cyberghost|surfshark|protonvpn/i,
  /mullvad|ipvanish|pia|private\s+internet\s+access/i,
  /digitalocean|linode|vultr|hetzner|ovh|aws|google\s+cloud|azure/i,
  /tor\s+exit|tor\s+network/i,
];

export interface DeviceInfo {
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

export interface RequestContext {
  ip: string;
  isPrivateIp: boolean;
  deviceInfo: DeviceInfo;
  fingerprint: string;
  referrer: string | null;
  acceptLanguage: string | null;
  origin: string | null;
  contentType: string | null;
  xRequestedWith: string | null;
}

export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ips = raw
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip && !isPrivateIp(ip) && isValidIp(ip));

    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  const trueClientIp = req.headers["true-client-ip"];
  if (typeof trueClientIp === "string" && isValidIp(trueClientIp.trim())) {
    return trueClientIp.trim();
  }

  const fastlyIp = req.headers["fastly-client-ip"];
  if (typeof fastlyIp === "string" && isValidIp(fastlyIp.trim())) {
    return fastlyIp.trim();
  }

  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    return normalizeIp(socketIp);
  }

  return "unknown";
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return buildEmptyDeviceInfo();
  }

  const sanitized = sanitizeUserAgent(userAgent);
  const isBot = detectBot(sanitized);

  try {
    const parser = new UAParser(sanitized);
    const result = parser.getResult();

    const deviceType = result.device.type ?? "desktop";
    const isMobile = MOBILE_DEVICE_TYPES.includes(deviceType);

    return {
      browser: result.browser.name ?? "Unknown",
      browserVersion: result.browser.version ?? "Unknown",
      os: result.os.name ?? "Unknown",
      osVersion: result.os.version ?? "Unknown",
      device: result.device.model ?? result.device.vendor ?? "Unknown",
      deviceType,
      platform: result.os.name ?? "Unknown",
      isMobile,
      isBot,
      raw: sanitized,
    };
  } catch (error) {
    const err = error as Error;
    log.warn("Failed to parse user agent", {
      error: err.message,
      userAgent: sanitized.substring(0, 100),
    });

    return buildEmptyDeviceInfo(isBot, sanitized);
  }
}

export function sanitizeUserAgent(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown";
  return userAgent
    .substring(0, MAX_USER_AGENT_LENGTH)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

export function detectBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function isValidIp(ip: string | undefined): boolean {
  if (!ip) return false;

  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/;

  if (ipv4Pattern.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  return ipv6Pattern.test(ip);
}

export function isPrivateIp(ip: string | undefined): boolean {
  if (!ip) return true;

  const privateRanges: RegExp[] = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^0\.0\.0\.0$/,
    /^169\.254\./,
  ];

  return privateRanges.some((range) => range.test(ip));
}

export function normalizeIp(ip: string | undefined): string {
  if (!ip) return "unknown";

  if (ip.startsWith("::ffff:")) {
    const extracted = ip.replace("::ffff:", "");
    if (isValidIp(extracted)) return extracted;
  }

  return ip;
}

export function isPotentialVpnOrProxy(isp: string | null | undefined): boolean {
  if (!isp) return false;
  return KNOWN_VPN_ISP_PATTERNS.some((pattern) => pattern.test(isp));
}

export function sanitizeReferrer(
  referrer: string | string[] | undefined,
): string | null {
  if (!referrer) return null;
  const raw = Array.isArray(referrer) ? referrer[0] : referrer;
  return raw.substring(0, MAX_REFERRER_LENGTH).trim();
}

export function extractRequestFingerprint(req: Request): string {
  const ip = getClientIp(req);
  const userAgent = sanitizeUserAgent(req.headers["user-agent"]);
  const acceptLanguage = req.headers["accept-language"] ?? "";
  const acceptEncoding = req.headers["accept-encoding"] ?? "";
  const accept = req.headers["accept"] ?? "";

  const raw = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}:${accept}`;

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}



function getHeader(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function parseFullRequestContext(req: Request): RequestContext {
  const ip = getClientIp(req);
  const rawUserAgent = req.headers["user-agent"] ?? "";
  const deviceInfo = parseUserAgent(rawUserAgent);
  const fingerprint = extractRequestFingerprint(req);

  return {
    ip,
    isPrivateIp: isPrivateIp(ip),
    deviceInfo,
    fingerprint,
    referrer: sanitizeReferrer(req.headers["referer"] ?? req.headers["referrer"]),
    acceptLanguage: getHeader(req.headers["accept-language"]),
    origin: getHeader(req.headers["origin"]),
    contentType: getHeader(req.headers["content-type"]),
    xRequestedWith: getHeader(req.headers["x-requested-with"]),
  };
}

function buildEmptyDeviceInfo(isBot: boolean = false, raw: string = "Unknown"): DeviceInfo {
  return {
    browser: "Unknown",
    browserVersion: "Unknown",
    os: "Unknown",
    osVersion: "Unknown",
    device: "Unknown",
    deviceType: "unknown",
    platform: "Unknown",
    isMobile: false,
    isBot,
    raw,
  };
}