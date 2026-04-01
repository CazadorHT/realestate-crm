import { type NextRequest, NextResponse } from "next/server";

/**
 * Apply Premium Security Headers & Content Security Policy (CSP)
 */
export function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  // 1. Content Security Policy (CSP)
  // Hardened for Maps, Supabase, Google Tag Manager, and Meta Assets
  const contentSecurityPolicyHeaderValue = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""} https://images.unsplash.com https://www.google-analytics.com https://www.facebook.com;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""} https://maps.googleapis.com wss://*.supabase.co https://www.google-analytics.com https://www.facebook.com;
    frame-src 'self' https://maps.google.com https://www.google.com https://www.facebook.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://www.facebook.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue.replace(/\s{2,}/g, " ").trim(),
  );

  // 2. Standard Security Hardening
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // 3. Permissions Policy (Block sensitive device access)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  return response;
}
