import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest } from "next/server";

// 🌐 1. Connection: Initialize Upstash Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

/**
 * 🔍 Helper: Get Client real IP Address (Trust Proxy)
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  
  // Return null instead of 127.0.0.1 to trigger Fingerprint fallback
  return (req as any).ip ?? null;
}

/**
 * 🆔 Helper: Generate a unique fingerprint for anonymous users
 * Uses User-Agent and Accept-Language to differentiate users without IP
 */
export function getFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") || "unknown-ua";
  const lang = req.headers.get("accept-language") || "unknown-lang";
  
  // Simple concatenation (Base64 or Hash can be added if needed for length)
  return `fp:${ua.slice(0, 50)}:${lang.slice(0, 20)}`;
}

/**
 * 🆔 Helper: Generate fingerprint from standard Headers object (for Server Actions)
 */
export function getFingerprintFromHeaders(headersList: Headers): string {
  const ua = headersList.get("user-agent") || "unknown-ua";
  const lang = headersList.get("accept-language") || "unknown-lang";
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "no-ip";
  
  return `fp:${ip}:${ua.slice(0, 50)}:${lang.slice(0, 20)}`;
}

/**
 * 🛡️ 2. Rate Limiting Profiles (Enterprise Granular)
 */

// A. Auth: Brute-force protection (Login, OTP, etc.)
export const ratelimitAuth = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
}) : null;

// B. AI: Cost control for LLM calls (Gemini, AI Translation)
export const ratelimitAI = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/ai",
}) : null;

// C. Actions: Administrative tasks (Create, Update, Bulk Actions)
export const ratelimitActions = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/actions",
}) : null;

// D. General: Page navigation & non-sensitive API
export const ratelimitGeneral = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/general",
}) : null;

// Deprecated (for backward compatibility during migration)
export const ratelimitSensitive = ratelimitActions;

/**
 * 🔑 Check for Internal Bypass Key
 */
export function isInternalBypass(req: NextRequest): boolean {
  const bypassKey = process.env.INTERNAL_BYPASS_KEY;
  const headerKey = req.headers.get("x-internal-key");
  return !!bypassKey && headerKey === bypassKey;
}

/**
 * ⚪ Check if IP is in Whitelist
 */
export function isWhitelisted(ip: string | null): boolean {
  if (!ip) return false;
  const whitelist = process.env.WHITELIST_IPS?.split(",").map(i => i.trim());
  return whitelist?.includes(ip) ?? false;
}
