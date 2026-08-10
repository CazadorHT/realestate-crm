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
  serverExternalPackages: ["jsdom", "isomorphic-dompurify"],
  /* Add your Next.js config here */

  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 2592000,
    qualities: [40, 75, 80, 90, 100],
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
          hostname,
          pathname: "/storage/v1/render/image/public/**",
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
        {
          protocol: "https",
          hostname: "platform-lookaside.fbsbx.com",
        },
        {
          protocol: "https",
          hostname: "**.fbcdn.net",
        },
        {
          protocol: "https",
          hostname: "cdn.vccasset.com",
        },
        {
          protocol: "https",
          hostname: "vccasset.com",
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
      bodySizeLimit: "10mb",
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
  // Disabled tunnelRoute to prevent routing telemetry/replays through Vercel Serverless Bandwidth
  // tunnelRoute: "/monitoring",

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



