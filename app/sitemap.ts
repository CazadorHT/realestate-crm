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

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/properties/pet-friendly-condo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties/office-for-rent`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties/prime-cbd`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/properties/luxury-villa`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
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
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((prop: { slug: string; updated_at: string; image_url?: string }) => ({
    url: `${baseUrl}/properties/${prop.slug}`,
    lastModified: new Date(prop.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
    images: prop.image_url ? [prop.image_url] : undefined,
  }));

  // 3. Fetch Published Blogs (Cached long-term, purged on-demand)
  const blogs = await getAllBlogSlugs();
  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog: { slug: string; updated_at: string; cover_image?: string }) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    images: blog.cover_image ? [blog.cover_image] : undefined,
  }));

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
    ...propertyRoutes,
    ...blogRoutes,
    ...serviceRoutes,
    ...stationRoutes,
    ...projectRoutes,
    ...areaRoutes,
  ];
}
