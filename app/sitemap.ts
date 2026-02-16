import { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const supabase = createAdminClient();

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
  ];

  // 2. Fetch Active Properties
  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "ACTIVE")
    .not("slug", "is", null);

  const propertyRoutes: MetadataRoute.Sitemap = (properties || []).map(
    (prop) => ({
      url: `${baseUrl}/properties/${prop.slug}`,
      lastModified: new Date(prop.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  // 3. Fetch Published Blogs
  const { data: blogs } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null);

  const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // 4. Fetch Active Services
  const { data: services } = await supabase
    .from("services")
    .select("slug, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const serviceRoutes: MetadataRoute.Sitemap = (services || []).map(
    (service) => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: service.updated_at
        ? new Date(service.updated_at)
        : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...propertyRoutes, ...blogRoutes, ...serviceRoutes];
}
