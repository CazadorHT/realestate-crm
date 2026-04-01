import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applySecurityHeaders } from "./proxy";
import { 
  getClientIp, 
  isWhitelisted, 
  isInternalBypass, 
  ratelimitGeneral, 
  ratelimitSensitive 
} from "@/lib/redis";

/**
 * 🔒 Centralized Security Middleware (Rate Limit + Auth + CSP)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 🛡️ Check Path Exclusion (Static files, fonts, public)
  const isStaticFile = 
    pathname.startsWith("/_next") || 
    pathname.includes("/favicon.ico") ||
    pathname.includes(".") || // image extensions/static
    pathname.startsWith("/fonts") ||
    pathname.includes("/blocking"); // Exclude blocking page from itself


  if (isStaticFile) {
    return NextResponse.next();
  }

  // 2. 🛡️ Identification & Bypass Logic
  const ip = getClientIp(request);
  const isWhitelistedIp = isWhitelisted(ip);
  const isBypassed = isInternalBypass(request);

  // 3. 🚦 Rate Limiting Check (Internal or Whitelisted Skip)
  if (!isWhitelistedIp && !isBypassed) {
    // A. Define sensitivity (API and Auth are STRICT)
    const isSensitivePath = 
      pathname.startsWith("/api") || 
      pathname.startsWith("/auth") ||
      pathname.includes("/actions");

    const ratelimit = isSensitivePath ? ratelimitSensitive : ratelimitGeneral;

    // B. Hit Redis (With Error Handling for Reliability)
    if (ratelimit) {
      try {
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

        // C. 🚫 Handle Rate Limit Exceeded
        if (!success) {
          console.warn(`[SECURITY] Rate Limit Hit: IP=${ip} Path=${pathname}`);
          
          // Rewrite to a friendly /blocking page (UX)
          const url = request.nextUrl.clone();
          url.pathname = "/blocking";
          
          const response = NextResponse.rewrite(url, {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Cache-Control": "no-store",
            }
          });
          return response;
        }
      } catch (redisError) {
        // FAIL-OPEN: If Redis is down, we allow the request to pass 
        // to avoid blocking legitimate users during a Redis outage.
        console.error("[SECURITY] Redis Rate Limit Error:", redisError);
      }
    }

  }

  // 4. 🔑 Supabase Session Management (Auth Refresh)
  let response = await updateSession(request);

  // 5. 🛡️ Apply Security Headers (CSP, etc.)
  response = applySecurityHeaders(request, response);

  return response;
}

/**
 * ⚙️ Next.js Middleware Matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
