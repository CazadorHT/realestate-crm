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
  const path = pathname.toLowerCase();

  // 1. 🛡️ Check Path Exclusion (Static files & System paths)
  // [PERFORMANCE] Whitelist known static extensions to skip heavy session checks
  const STATIC_EXTENSIONS = [
    ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", 
    ".woff", ".woff2", ".ttf", ".eot", ".json", ".webp", ".mp4",
    ".map", ".txt", ".pdf", ".csv", ".mjs"
  ];
  const isStaticExtension = STATIC_EXTENSIONS.some(ext => path.endsWith(ext));
  
  const isExcludedPath = 
    path.startsWith("/_next") || 
    path.startsWith("/fonts") ||
    path.startsWith("/api/og") ||
    path.startsWith("/monitoring") ||
    path.includes("/blocking") ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    isStaticExtension;

  if (isExcludedPath) {
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
  const isWebhook = 
    path.startsWith("/api/webhook") || 
    path.startsWith("/api/callback") || 
    path.startsWith("/auth/callback") ||
    path.startsWith("/api/line-webhook");

  // 4. 🚦 Rate Limiting Check
  const HEAVY_RESOURCE_KEYWORDS = ["analytics", "audit-logs", "executive", "inventory"];
  const PUBLIC_API_PREFIX = "/api/public";

  if (!isWhitelistedIp && !isBypassed && !isWebhook) {
    // A. Select Identifier and Limiter
    let identifier = user?.id || ip || getFingerprint(request);
    let limiter = ratelimitGeneral;
    let limiterName = "general";

    const isHeavyResource = HEAVY_RESOURCE_KEYWORDS.some(key => path.includes(key));
    const isPublicAPI = path.startsWith(PUBLIC_API_PREFIX);

    // Narrowing AI check to avoid False Positives (e.g., detail, maintenance, available)
    const isAiTarget = (path.includes("/ai-") || path.startsWith("/api/ai") || path.includes("/translate")) && 
                      !path.includes("-monitor") && 
                      !path.includes("-config") &&
                      !path.includes("smart-match");

    if (path.startsWith("/auth")) {
      // Priority 1: Auth (Brute-force protection)
      limiter = ratelimitAuth;
      limiterName = "auth";
      identifier = ip || getFingerprint(request); 
    } else if (isAiTarget) {
      // Priority 2: AI Generation (Cost Control) - Monitoring paths are exempted
      limiter = ratelimitAI;
      limiterName = "ai";
    } else if (isHeavyResource || isPublicAPI) {
      // Priority 3: Heavy Resources & Public API (Scraping & DB Load Protection)
      limiter = ratelimitActions;
      limiterName = isHeavyResource ? "heavy-resource" : "public-api";
    } else if (path.includes("/actions") || path.startsWith("/api/protected") || path.includes("-config") || path.includes("smart-match")) {
      // Priority 4: Protected Actions & Admin Configs
      limiter = ratelimitActions;
      limiterName = "actions";
    } else {
      // Priority 5: General Navigation (Compound Identifier)
      limiter = ratelimitGeneral;
      limiterName = "general";
      identifier = `${identifier}:${path}`;
    }

    // B. Hit Redis
    if (limiter) {
      try {
        const { success, limit, reset, remaining } = await limiter.limit(identifier);

        // [ELITE] Always attach rate limit headers even on success
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

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
          
          const blockingResponse = NextResponse.rewrite(url, {
            status: 429,
            headers: response.headers // Carry over the rate limit headers
          });
          
          blockingResponse.headers.set("Retry-After", retryAfterSeconds.toString());
          blockingResponse.headers.set("Cache-Control", "no-store");

          // 🛡️ [ELITE HARDENING] Apply Security Headers even to the blocking response
          return applySecurityHeaders(request, blockingResponse);
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
