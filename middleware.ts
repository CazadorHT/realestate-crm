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
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // 1.5 🌏 Auto-Language Detection
  const hasLangCookie = request.cookies.has("app-language");
  let detectedLang: string | null = null;

  if (!hasLangCookie) {
    const acceptLang = request.headers.get("accept-language")?.toLowerCase();
    const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();

    if (country) {
      if (country === "CN" || country === "HK" || country === "TW") detectedLang = "cn";
      else if (country === "RU") detectedLang = "ru";
      else if (country === "TH") detectedLang = "th";
      else detectedLang = "en";
    }

    if (!detectedLang && acceptLang) {
      const primaryLang = acceptLang.split(',')[0];
      if (primaryLang.startsWith("th")) detectedLang = "th";
      else if (primaryLang.startsWith("en")) detectedLang = "en";
      else if (primaryLang.startsWith("zh")) detectedLang = "cn";
      else if (primaryLang.startsWith("ru")) detectedLang = "ru";
      
      // Fallback: Check if supported languages are mentioned anywhere in the string
      if (!detectedLang) {
        if (acceptLang.includes("th")) detectedLang = "th";
        else if (acceptLang.includes("en")) detectedLang = "en";
        else if (acceptLang.includes("zh")) detectedLang = "cn";
        else if (acceptLang.includes("ru")) detectedLang = "ru";
      }
    }
  }

  // 2. 🔑 Supabase Session
  const { response: authResponse, user } = await updateSession(request);
  let response = authResponse;
  
  if (response.status === 307 || response.status === 308) {
    return response;
  }

  // 3. 🛡️ Identification & Bypass
  const ip = getClientIp(request);
  const isWhitelistedIp = isWhitelisted(ip);
  const isBypassed = isInternalBypass(request);
  
  const ua = request.headers.get("user-agent")?.toLowerCase() || "";
  const isCrawler = 
    ua.includes("googlebot") || 
    ua.includes("google-certificates-bridge") ||
    ua.includes("google-compliance-checking") ||
    ua.includes("bingbot") || 
    ua.includes("tiktokbot") || 
    ua.includes("facebookexternalhit") || 
    ua.includes("facebot") || 
    ua.includes("facebookplatform") || 
    ua.includes("linebot");

  const isWebhook = 
    path.startsWith("/api/webhook") || 
    path.startsWith("/api/callback") || 
    path.startsWith("/auth/callback") ||
    path.startsWith("/api/auth/callback") ||
    path.startsWith("/api/line-webhook");

  const isBypassPath = isWebhook || isCrawler;

  // 4. 🚦 Rate Limiting
  if (!isWhitelistedIp && !isBypassed && !isBypassPath) {
    let identifier = user?.id || ip || getFingerprint(request);
    let limiter = ratelimitGeneral;
    let limiterName = "general";

    const isHeavyResource = ["analytics", "audit-logs", "executive", "inventory"].some(key => path.includes(key));
    const isPublicAPI = path.startsWith("/api/public");
    const isAiTarget = (path.includes("/ai-") || path.startsWith("/api/ai") || path.includes("/translate")) && 
                      !path.includes("-monitor") && !path.includes("-config") && !path.includes("smart-match");

    if (path.startsWith("/auth")) {
      limiter = ratelimitAuth;
      limiterName = "auth";
      identifier = ip || getFingerprint(request); 
    } else if (isAiTarget) {
      limiter = ratelimitAI;
      limiterName = "ai";
    } else if (isHeavyResource || isPublicAPI) {
      limiter = ratelimitActions;
      limiterName = isHeavyResource ? "heavy-resource" : "public-api";
    } else if (path.includes("/actions") || path.startsWith("/api/protected") || path.includes("-config") || path.includes("smart-match")) {
      limiter = ratelimitActions;
      limiterName = "actions";
    } else {
      // Priority 5: General Navigation (Compound Identifier to prevent global lockout)
      identifier = `${identifier}:${path}`;
    }

    if (limiter) {
      try {
        const { success, limit, reset, remaining } = await limiter.limit(identifier);
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

        if (!success) {
          const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
          const url = request.nextUrl.clone();
          url.pathname = "/blocking";
          url.searchParams.set("retry", retryAfterSeconds.toString());
          
          const blockingResponse = NextResponse.rewrite(url, {
            status: 429,
            headers: response.headers
          });
          
          blockingResponse.headers.set("Retry-After", retryAfterSeconds.toString());
          blockingResponse.headers.set("Cache-Control", "no-store");
          return applySecurityHeaders(request, blockingResponse);
        }
      } catch (e) {
        console.error("[SECURITY] Rate Limit Error:", e);
      }
    }
  }

  // 5. 🛡️ Security Headers
  response = applySecurityHeaders(request, response);

  if (detectedLang) {
    response.cookies.set("app-language", detectedLang, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  response.headers.forEach((value, key) => {
    finalResponse.headers.set(key, value);
  });

  return finalResponse;
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
