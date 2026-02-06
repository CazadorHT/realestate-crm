import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // 1. Supabase Auth & Session Refresh
  const response = await updateSession(request);

  // 2. Security Headers
  // Security Headers with proper CSP for Maps, Supabase, and external assets
  const contentSecurityPolicyHeaderValue = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://images.unsplash.com https://www.google-analytics.com;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://maps.googleapis.com wss://*.supabase.co https://www.google-analytics.com;
    frame-src 'self' https://maps.google.com https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue.replace(/\s{2,}/g, " ").trim(),
  );

  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Permissions Policy (Restrict sensitive features)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  return response;
}

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
