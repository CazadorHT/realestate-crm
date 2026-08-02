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
 * [PREMIUM HARDENING] This middleware protects against:
 * 1. Brute-force (Auth rate limits)
 * 2. AI Scraping & Cost Abuse (AI rate limits)
 * 3. Crawler blocking issues (White-listing Google/FB bots)
 * 4. CSP Violations (Centralized security headers)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = pathname.toLowerCase();

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

  // 2. 🔑 Supabase Session Management (Auth Refresh)
  // [OPTIMIZATION] Only run session management on protected & auth routes
  const isPublicApi = path.startsWith("/api/public");
  const isAuthOrProtected = 
    path.startsWith("/protected") || 
    path.startsWith("/auth") || 
    path.startsWith("/api/protected") ||
    path.startsWith("/api/admin");
  
  let response = NextResponse.next();
  let user = null;

  if (isAuthOrProtected) {
    const { response: authResponse, user: sessionUser } = await updateSession(request);
    response = authResponse;
    user = sessionUser;
    
    if (response.status === 307 || response.status === 308) {
      return response;
    }
  }

  // 🌏 Auto-Language Detection & URL Path Localization
  const SUPPORTED_LOCALES = ["th", "en", "cn", "ru"];
  const pathParts = pathname.split("/");
  const firstPart = pathParts[1]?.toLowerCase();
  const isLocalePath = SUPPORTED_LOCALES.includes(firstPart);
  
  let detectedLang: string | null = null;
  let pathnameWithoutLocale = pathname;

  if (isLocalePath) {
    detectedLang = firstPart;
    pathnameWithoutLocale = "/" + pathParts.slice(2).join("/");
    if (pathnameWithoutLocale === "") {
      pathnameWithoutLocale = "/";
    }
  }

  const hasLangCookie = request.cookies.has("app-language");
  const currentCookieLang = request.cookies.get("app-language")?.value;

  // Set detectedLang if not matching the current path prefix
  if (!isPublicApi) {
    if (isLocalePath && detectedLang !== currentCookieLang) {
      response.cookies.set("app-language", detectedLang!, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    } else if (!isLocalePath && !hasLangCookie) {
      if (isCrawler) {
        // Force Thai language for search crawlers/bots on root paths to ensure Google indexes the Thai version
        detectedLang = "th";
      } else {
        // Auto-detect browser/IP language on default root paths
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
          
          if (!detectedLang) {
            if (acceptLang.includes("th")) detectedLang = "th";
            else if (acceptLang.includes("en")) detectedLang = "en";
            else if (acceptLang.includes("zh")) detectedLang = "cn";
            else if (acceptLang.includes("ru")) detectedLang = "ru";
          }
        }
      }

      if (detectedLang) {
        response.cookies.set("app-language", detectedLang, {
          path: "/",
          maxAge: 31536000,
          sameSite: "lax",
        });
      }
    }
  }

  // Active language for downstream routing
  const activeLang = detectedLang || currentCookieLang || "th";

  // 3. 🛡️ Identification & Bypass Logic
  const ip = getClientIp(request);
  const isWhitelistedIp = isWhitelisted(ip);
  const isBypassed = isInternalBypass(request);
  
  // Use isCrawler declared at the top

  const isWebhook = ["/api/webhook", "/api/callback", "/auth/callback", "/api/auth/callback", "/api/line-webhook"].some(p => path.startsWith(p));
  const isBypassPath = isWebhook || isCrawler;

  // 4. 🚦 Rate Limiting Check
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
      identifier = `${identifier}:${path}`;
    }

    if (limiter) {
      try {
        const { success, limit, reset, remaining } = await limiter.limit(identifier);
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

        if (!success) {
          // 📊 [SECURITY LOG] Stdout Logging for "Elite" Monitoring
          console.error(JSON.stringify({
            event: "rate_limit_blocked",
            ip,
            userId: user?.id || "anonymous",
            path: pathname,
            limiter: limiterName,
            timestamp: new Date().toISOString(),
          }));

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

          // 🛡️ [ELITE HARDENING] Apply Security Headers even to the blocking response
          return applySecurityHeaders(request, blockingResponse);
        }
      } catch (redisError) {
        console.error("[SECURITY] Redis Rate Limit Error (Fail-open):", redisError);
      }
    }
  }

  // 5. 🛡️ Final Prep: Apply Security Headers & Pass x-pathname
  try {
    // [CRITICAL] Create a fresh next response to modify request headers safely
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    // Inject active language into Cookie header for downstream Server Components
    let cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader.includes("app-language=")) {
      cookieHeader = cookieHeader.replace(/app-language=[^;]*/, `app-language=${activeLang}`);
    } else {
      cookieHeader = cookieHeader ? `${cookieHeader}; app-language=${activeLang}` : `app-language=${activeLang}`;
    }
    requestHeaders.set("cookie", cookieHeader);

    let finalResponse;
    if (isLocalePath) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathnameWithoutLocale;
      finalResponse = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    } else {
      finalResponse = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Sync cookies from authResponse/language logic to the final response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    // Sync security headers
    applySecurityHeaders(request, finalResponse);
    
    // Sync ratelimit headers if they exist
    const rateLimitHeaders = ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"];
    rateLimitHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) finalResponse.headers.set(h, val);
    });

    // 🛡️ [GOOGLE OAUTH FIX] Explicitly set Content-Type and X-Robots-Tag for legal pages
    // This prevents Google's bot from thinking the page is a download/document.
    const isLegalPath = pathname.startsWith("/privacy-policy") || pathname.startsWith("/terms");
    if (isLegalPath) {
      finalResponse.headers.set("Content-Type", "text/html; charset=utf-8");
      finalResponse.headers.set("X-Robots-Tag", "all");
    }

    return finalResponse;
  } catch (syncError) {
    console.error("[SECURITY] Middleware Final Sync Error (Fail-open):", syncError);
    // 🛡️ [FAIL-OPEN] Return the original response if sync fails to prevent 500 error
    return response;
  }
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
