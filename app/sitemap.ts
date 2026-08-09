import { MetadataRoute } from "next";

import { createPublicClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";
import { getAllStationSlugs } from "@/features/public/stations";
import { getAllProjectSlugs } from "@/features/public/projects";
import { getAllAreaSlugs } from "@/features/public/areas";
import { getAllPropertySlugs } from "@/lib/services/properties";
import { getAllBlogSlugs, getAllServiceSlugs } from "@/lib/services/blog";

export const revalidate = 31536000; // Cache Sitemap generation for 1 year (tag-invalidated on update)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const supabase = createPublicClient();

  // Helper to generate alternate language objects for search engine indexing
  const getAlternates = (path: string) => {
    // Ensure trailing slash is clean
    const cleanPath = path === "/" ? "" : path;
    return {
      languages: {
        th: `${baseUrl}/th${cleanPath}`,
        en: `${baseUrl}/en${cleanPath}`,
        cn: `${baseUrl}/cn${cleanPath}`,
        ru: `${baseUrl}/ru${cleanPath}`,
      },
    };
  };

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: getAlternates("/"),
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: getAlternates("/properties"),
    },
    {
      url: `${baseUrl}/properties/pet-friendly-condo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/properties/pet-friendly-condo"),
    },
    {
      url: `${baseUrl}/properties/office-for-rent`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/properties/office-for-rent"),
    },
    {
      url: `${baseUrl}/properties/luxury-villa`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/properties/luxury-villa"),
    },
    {
      url: `${baseUrl}/near-station`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: getAlternates("/near-station"),
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: getAlternates("/projects"),
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates("/services"),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/blog"),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: getAlternates("/contact"),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: getAlternates("/about"),
    },
    {
      url: `${baseUrl}/deposit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates("/deposit"),
    },
  ];

  // 2. Fetch Active Properties (Cached 1 year)
  const properties = await getAllPropertySlugs();
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((prop: { slug: string; updated_at: string }) => ({
    url: `${baseUrl}/properties/${prop.slug}`,
    lastModified: new Date(prop.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: getAlternates(`/properties/${prop.slug}`),
  }));

  // 3. Fetch Published Blogs (Cached 1 year)
  const blogs = await getAllBlogSlugs();
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog: { slug: string; updated_at: string }) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: getAlternates(`/blog/${blog.slug}`),
  }));

  // 4. Fetch Active Services (Cached 1 year)
  const services = await getAllServiceSlugs();
  const serviceRoutes: MetadataRoute.Sitemap = services.map((service: { slug: string; updated_at: string }) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: getAlternates(`/services/${service.slug}`),
  }));

  // 5. Fetch Active Transit Stations (Cached 1 year)
  const stationSlugs = await getAllStationSlugs();
  const stationRoutes: MetadataRoute.Sitemap = stationSlugs.map((slug: string) => ({
    url: `${baseUrl}/near-station/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: getAlternates(`/near-station/${slug}`),
  }));

  // 6. Fetch Active Projects (Cached 1 year)
  const projectSlugs = await getAllProjectSlugs();
  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map((slug: string) => ({
    url: `${baseUrl}/projects/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: getAlternates(`/projects/${slug}`),
  }));

  // 7. Fetch Active Popular Areas (Cached 1 year)
  const areaSlugs = await getAllAreaSlugs();
  const areaRoutes: MetadataRoute.Sitemap = areaSlugs.map((slug: string) => ({
    url: `${baseUrl}/areas/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: getAlternates(`/areas/${slug}`),
  }));

  return [
    ...staticRoutes,
    ...propertyRoutes,
    ...blogRoutes,
    ...serviceRoutes,
    ...stationRoutes,
    ...projectRoutes,
    ...areaRoutes,
  ];
}
