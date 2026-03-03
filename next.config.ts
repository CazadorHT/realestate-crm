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
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"], // แนะนำให้เพิ่มเพื่อให้ประสิทธิภาพสูงสุด
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
    ],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
