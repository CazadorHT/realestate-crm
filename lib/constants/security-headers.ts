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
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
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
  ],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.google-analytics.com",
    "https://analytics.google.com",
    "https://stats.g.doubleclick.net",
    "https://api.dicebear.com",
  ],
  "frame-src": ["'self'", "https://www.google.com"],
  "media-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
} as const;

/**
 * Helper to generate CSP string from directives object
 */
export const generateCSP = (directives: typeof CSP_DIRECTIVES): string => {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
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
