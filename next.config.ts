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
