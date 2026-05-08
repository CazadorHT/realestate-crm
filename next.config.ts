import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/constants/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  /* Add your Next.js config here */

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    qualities: [60, 75, 80, 90],
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
        {
          protocol: "https",
          hostname: "**.livinginsider.com",
        },
        {
          protocol: "https",
          hostname: "**.pgimgs.com",
        },
        {
          protocol: "https",
          hostname: "**.wikimedia.org",
        },
        {
          protocol: "https",
          hostname: "**.freepik.com",
        },
      ];
    })(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
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
      "@tiptap/react",
      "@tiptap/starter-kit",
      "framer-motion",
      "recharts",
    ],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withAnalyzer(
  withSentryConfig(nextConfig, {

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "vc-connect-asset",
  project: "vc-connect-portal",
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // For modern Sentry SDK options
  sourcemaps: {
    disable: false,
  },

  // Note: Some of these options might not work with Turbopack yet, 
  // but we keep them for standard Webpack builds/Production.
  webpack: {
    reactComponentAnnotation: { enabled: true },
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
}));



