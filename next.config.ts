import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Add your Next.js config here */

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [75, 90],
    remotePatterns: (() => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return [];

      const { hostname } = new URL(supabaseUrl);

      return [
        {
          protocol: "https",
          hostname,
          pathname: "/storage/v1/object/public/**",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
        },
        {
          protocol: "https",
          hostname: "api.dicebear.com",
        },
      ];
    })(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://api.dicebear.com https://www.google-analytics.com https://www.googletagmanager.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://api.dicebear.com",
              "frame-src 'self' https://www.google.com",
              "media-src 'self'",
              "worker-src 'self' blob:",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash",
    ],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
