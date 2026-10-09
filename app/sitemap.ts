import { MetadataRoute } from "next";

import { createPublicClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";
import { getAllStationSlugs } from "@/features/public/stations";
import { getAllProjectSlugs } from "@/features/public/projects";
import { getAllAreaSlugs } from "@/features/public/areas";
import { getAllPropertySlugs } from "@/lib/services/properties";
import { getAllBlogSlugs, getAllServiceSlugs } from "@/lib/services/blog";

export const revalidate = 31536000; // Cache Sitemap generation (on-demand revalidated on property/blog CRUD)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const supabase = createPublicClient();

  // 1. Core Static & Category Routes (Multilingual)
  const corePaths = [
    { path: "", priority: 1, freq: "daily" as const },
    { path: "/properties", priority: 0.9, freq: "daily" as const },
    { path: "/properties/pet-friendly-condo", priority: 0.8, freq: "daily" as const },
    { path: "/properties/office-for-rent", priority: 0.8, freq: "daily" as const },
    { path: "/properties/prime-cbd", priority: 0.9, freq: "daily" as const },
    { path: "/properties/luxury-villa", priority: 0.8, freq: "daily" as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const item of corePaths) {
    const alternatesLanguages: Record<string, string> = {
      th: `${baseUrl}${item.path || ""}`,
      en: `${baseUrl}/en${item.path}`,
      "zh-Hans": `${baseUrl}/zh${item.path}`,
      ru: `${baseUrl}/ru${item.path}`,
      "x-default": `${baseUrl}${item.path || ""}`,
    };

    // Thai / Default Route
    staticRoutes.push({
      url: `${baseUrl}${item.path || "/"}`,
      lastModified: now,
      changeFrequency: item.freq,
      priority: item.priority,
      alternates: { languages: alternatesLanguages },
    });

    // Foreign Language Routes
    for (const lang of ["en", "zh", "ru"] as const) {
      staticRoutes.push({
        url: `${baseUrl}/${lang}${item.path}`,
        lastModified: now,
        changeFrequency: item.freq,
        priority: Number((item.priority - 0.1).toFixed(1)),
        alternates: { languages: alternatesLanguages },
      });
    }
  }

  // Other utility static routes (Mono-language)
  const otherStaticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/near-station`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/deposit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 2. Fetch Active Properties (Cached long-term, purged on-demand)
  const properties = await getAllPropertySlugs();
  const propertyRoutes: MetadataRoute.Sitemap = [];

  for (const prop of properties) {
    const rawSlug = encodeURIComponent(prop.slug);
    const lastMod = new Date(prop.updated_at);
    const images = prop.image_url ? [prop.image_url] : undefined;

    // Build alternates mapping only for languages with actual translated content
    const alternatesLanguages: Record<string, string> = {
      th: `${baseUrl}/properties/${rawSlug}`,
      "x-default": `${baseUrl}/properties/${rawSlug}`,
    };
    if (prop.has_en) {
      alternatesLanguages.en = `${baseUrl}/en/properties/${rawSlug}`;
    }
    if (prop.has_zh) {
      alternatesLanguages["zh-Hans"] = `${baseUrl}/zh/properties/${rawSlug}`;
    }
    if (prop.has_ru) {
      alternatesLanguages.ru = `${baseUrl}/ru/properties/${rawSlug}`;
    }

    // Default Thai Route (Always indexable)
    propertyRoutes.push({
      url: `${baseUrl}/properties/${rawSlug}`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.7,
      images,
      alternates: {
        languages: alternatesLanguages,
      },
    });

    // English Route (Only included if translated)
    if (prop.has_en) {
      propertyRoutes.push({
        url: `${baseUrl}/en/properties/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "weekly",
        priority: 0.7,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }

    // Chinese Route (Only included if translated)
    if (prop.has_zh) {
      propertyRoutes.push({
        url: `${baseUrl}/zh/properties/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "weekly",
        priority: 0.7,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }

    // Russian Route (Only included if translated)
    if (prop.has_ru) {
      propertyRoutes.push({
        url: `${baseUrl}/ru/properties/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "weekly",
        priority: 0.7,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }
  }

  // 3. Fetch Published Blogs (Multilingual supported)
  const blogs = await getAllBlogSlugs();
  const blogRoutes: MetadataRoute.Sitemap = [];

  for (const blog of blogs) {
    const rawSlug = encodeURIComponent(blog.slug);
    const lastMod = blog.updated_at ? new Date(blog.updated_at) : new Date();
    const images = blog.cover_image ? [blog.cover_image] : undefined;

    const alternatesLanguages: Record<string, string> = {
      th: `${baseUrl}/blog/${rawSlug}`,
      "x-default": `${baseUrl}/blog/${rawSlug}`,
    };

    if (blog.has_en) {
      alternatesLanguages.en = `${baseUrl}/en/blog/${rawSlug}`;
    }
    if (blog.has_zh) {
      alternatesLanguages["zh-Hans"] = `${baseUrl}/zh/blog/${rawSlug}`;
    }
    if (blog.has_ru) {
      alternatesLanguages.ru = `${baseUrl}/ru/blog/${rawSlug}`;
    }

    // Default (Thai) route
    blogRoutes.push({
      url: `${baseUrl}/blog/${rawSlug}`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.7,
      images,
      alternates: {
        languages: alternatesLanguages,
      },
    });

    // English Route
    if (blog.has_en) {
      blogRoutes.push({
        url: `${baseUrl}/en/blog/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.6,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }

    // Chinese Route
    if (blog.has_zh) {
      blogRoutes.push({
        url: `${baseUrl}/zh/blog/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.6,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }

    // Russian Route
    if (blog.has_ru) {
      blogRoutes.push({
        url: `${baseUrl}/ru/blog/${rawSlug}`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.6,
        images,
        alternates: {
          languages: alternatesLanguages,
        },
      });
    }
  }

  // 4. Fetch Active Services
  const services = await getAllServiceSlugs();
  const serviceRoutes: MetadataRoute.Sitemap = services.map((service: { slug: string; updated_at: string }) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // 5. Fetch Active Transit Stations
  const stationSlugs = await getAllStationSlugs();
  const stationRoutes: MetadataRoute.Sitemap = stationSlugs.map((slug: string) => ({
    url: `${baseUrl}/near-station/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 6. Fetch Active Projects
  const projectSlugs = await getAllProjectSlugs();
  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map((slug: string) => ({
    url: `${baseUrl}/projects/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 7. Fetch Active Popular Areas
  const areaSlugs = await getAllAreaSlugs();
  const areaRoutes: MetadataRoute.Sitemap = areaSlugs.map((slug: string) => ({
    url: `${baseUrl}/areas/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...otherStaticRoutes,
    ...propertyRoutes,
    ...blogRoutes,
    ...serviceRoutes,
    ...stationRoutes,
    ...projectRoutes,
    ...areaRoutes,
  ];
}
