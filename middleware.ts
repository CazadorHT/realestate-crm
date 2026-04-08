import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applySecurityHeaders } from "@/lib/security";
import { 
  getClientIp, 
  getFingerprint,
  isWhitelisted, 
  isInternalBypass, 
  ratelimitGeneral, 
  ratelimitAuth,
  ratelimitAI,
  ratelimitActions
} from "@/lib/redis";

/**
 * 🔒 Centralized Security Middleware (Auth -> Rate Limit -> CSP)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 🛡️ Check Path Exclusion (Static files, fonts, public)
  const isStaticFile = 
    pathname.startsWith("/_next") || 
    pathname.includes("/favicon.ico") ||
    pathname.includes(".") || 
    pathname.startsWith("/fonts") ||
    pathname.includes("/blocking");


  if (isStaticFile) {
    return NextResponse.next();
  }

  // 2. 🔑 Supabase Session Management (Auth Refresh)
  // [OPTIMIZATION] Returns both response and user context to avoid redundant hits
  const { response: authResponse, user } = await updateSession(request);
  let response = authResponse;
  
  // If updateSession returned a redirect, honor it immediately
  if (response.status === 307 || response.status === 308) {
    return response;
  }

  // 3. 🛡️ Identification & Bypass Logic
  const ip = getClientIp(request);
  const isWhitelistedIp = isWhitelisted(ip);
  const isBypassed = isInternalBypass(request);
  
  // [SAFETY] Critical Webhooks/Callbacks should NEVER be blocked by Rate Limit
  const isWebhook = pathname.includes("/webhook") || pathname.includes("/callback");

  // 4. 🚦 Rate Limiting Check (Internal or Whitelisted Skip)
  if (!isWhitelistedIp && !isBypassed && !isWebhook) {
    // A. Select Identifier and Limiter
    let identifier = user?.id || ip || getFingerprint(request);
    let limiter = ratelimitGeneral;
    let limiterName = "general";

    if (pathname.startsWith("/auth")) {
      limiter = ratelimitAuth;
      limiterName = "auth";
      identifier = ip || getFingerprint(request); // Auth is always IP-bound to prevent broad user blocks
    } else if (pathname.includes("ai") || pathname.includes("translate")) {
      limiter = ratelimitAI;
      limiterName = "ai";
    } else if (pathname.includes("/actions") || pathname.startsWith("/api/protected")) {
      limiter = ratelimitActions;
      limiterName = "actions";
    } else {
      // General Limit: Use Compound Identifier (ID/IP + Path) to avoid false positives
      limiter = ratelimitGeneral;
      limiterName = "general";
      identifier = `${identifier}:${pathname}`;
    }

    // B. Hit Redis
    if (limiter) {
      try {
        const { success, limit, reset, remaining } = await limiter.limit(identifier);

        if (!success) {
          const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);

          // 📊 [SECURITY LOG] Stdout Logging for "Elite" Monitoring
          console.error(JSON.stringify({
            event: "rate_limit_blocked",
            ip,
            userId: user?.id || "anonymous",
            path: pathname,
            limiter: limiterName,
            timestamp: new Date().toISOString(),
          }));
          
          const url = request.nextUrl.clone();
          url.pathname = "/blocking";
          // [PREMIUM UX] Pass the retry time to the blocking page for the countdown
          url.searchParams.set("retry", retryAfterSeconds.toString());
          
          return NextResponse.rewrite(url, {
            status: 429,
            headers: {
              "Retry-After": retryAfterSeconds.toString(),
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Cache-Control": "no-store",
            }
          });
        }
      } catch (redisError) {
        console.error("[SECURITY] Redis Rate Limit Error (Fail-open):", redisError);
      }
    }
  }

  // 5. 🛡️ Apply Security Headers (CSP, etc.)
  response = applySecurityHeaders(request, response);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
