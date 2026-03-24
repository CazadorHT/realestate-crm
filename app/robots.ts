import { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/protected/", 
        "/api/", 
        "/admin/",
        "/*?sort=",
        "/*?view=",
        "/*?minPrice=",
        "/*?maxPrice=",
        "/*?bedrooms=",
        "/*?bathrooms=",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
