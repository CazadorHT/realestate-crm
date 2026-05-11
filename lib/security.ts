import { type NextRequest, NextResponse } from "next/server";
import { SECURITY_HEADERS } from "./constants/security-headers";

/**
 * Apply Premium Security Headers & Content Security Policy (CSP)
 * Synchronized with lib/constants/security-headers.ts
 */
export function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  // 1. Apply all standard security headers from constants
  SECURITY_HEADERS.forEach(({ key, value }) => {
    response.headers.set(key, value);
  });

  // 2. Permissions Policy (Block sensitive device access)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  return response;
}
