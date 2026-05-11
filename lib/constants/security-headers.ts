/**
 * Content Security Policy (CSP) configuration
 * Grouped by directive for better maintainability.
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    "blob:",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://connect.facebook.net",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://static.cloudflareinsights.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": [
    "'self'",
    "blob:",
    "data:",
    "https://*.supabase.co",
    "https://images.unsplash.com",
    "https://api.dicebear.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://www.facebook.com",
    "https://*.facebook.com",
    "https://*.facebook.net",
    "https://*.google.com",
    "https://*.gstatic.com",
  ],
  "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.google-analytics.com",
    "https://analytics.google.com",
    "https://stats.g.doubleclick.net",
    "https://api.dicebear.com",
    "https://www.facebook.com",
    "https://*.facebook.com",
    "https://www.google.com",
    "https://maps.googleapis.com",
    "https://cloudflareinsights.com",
    "wss://*.supabase.co",
  ],
  "frame-src": [
    "'self'",
    "https://www.google.com",
    "https://maps.google.com",
    "https://www.facebook.com",
  ],
  "media-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "child-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'", "https://www.facebook.com"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
} as const;

/**
 * Helper to generate CSP string from directives object
 */
export const generateCSP = (directives: any): string => {
  return Object.entries(directives)
    .map(([key, values]) => {
      const vals = values as string[];
      if (vals.length === 0) return key;
      return `${key} ${vals.join(" ")}`;
    })
    .join("; ");
};

/**
 * Standard Security Headers
 */
export const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: generateCSP(CSP_DIRECTIVES),
  },
];
