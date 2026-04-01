import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest } from "next/server";

// 🌐 1. Connection: Initialize Upstash Redis
// Handle missing env vars gracefully (Fail-open)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;


/**
 * 🔍 Helper: Get Client real IP Address (Trust Proxy)
 * Vercel and other proxies set x-forwarded-for.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  
  return (req as any).ip ?? "127.0.0.1";
}

/**
 * 🛡️ 2. Rate Limiting Profiles
 */

// B. Sensitive Limit (Authen, AI, Save Actions - 5 requests per 10 seconds)
export const ratelimitSensitive = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/sensitive",
}) : null;

// A. General Limit (Browsing pages - 30 requests per 10 seconds)
export const ratelimitGeneral = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/general",
}) : null;

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
export function isWhitelisted(ip: string): boolean {
  const whitelist = process.env.WHITELIST_IPS?.split(",").map(i => i.trim());
  return whitelist?.includes(ip) ?? false;
}
