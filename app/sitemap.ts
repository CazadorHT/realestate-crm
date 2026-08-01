import { MetadataRoute } from "next";

import { createPublicClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

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

  // 2. Fetch Active Properties
  const { data: properties } = await supabase
    .from("properties_core")
    .select("slug, updated_at")
    .eq("status", 1) // status 1 = Active/Available in v3
    .not("slug", "is", null);

  const propertyRoutes: MetadataRoute.Sitemap = (properties || []).map(
    (prop: any) => ({
      url: `${baseUrl}/properties/${prop.slug}`,
      lastModified: new Date(prop.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: getAlternates(`/properties/${prop.slug}`),
    }),
  );

  // 3. Fetch Published Blogs
  const { data: blogs } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null);

  const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((blog: any) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: getAlternates(`/blog/${blog.slug}`),
  }));

  // 4. Fetch Active Services
  const { data: services } = await supabase
    .from("cms_content_v3")
    .select("slug, updated_at")
    .eq("content_type", "service")
    .eq("status", "PUBLISHED")
    .not("slug", "is", null);

  const serviceRoutes: MetadataRoute.Sitemap = (services || []).map(
    (service: any) => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: service.updated_at
        ? new Date(service.updated_at)
        : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: getAlternates(`/services/${service.slug}`),
    }),
  );

  // 5. Fetch Active Transit Stations
  const { data: stations } = await supabase
    .from("ref_master_data")
    .select("metadata")
    .eq("type", "TRANSIT_STATION")
    .eq("is_active", true);

  const stationRoutes: MetadataRoute.Sitemap = (stations || [])
    .filter((s: any) => s.metadata?.slug)
    .map((s: any) => ({
      url: `${baseUrl}/near-station/${s.metadata.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates(`/near-station/${s.metadata.slug}`),
    }));

  // 6. Fetch Active Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, updated_at")
    .eq("is_active", true);

  const projectRoutes: MetadataRoute.Sitemap = (projects || []).map(
    (proj: any) => ({
      url: `${baseUrl}/projects/${proj.slug}`,
      lastModified: proj.updated_at ? new Date(proj.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates(`/projects/${proj.slug}`),
    }),
  );

  // 7. Fetch Active Popular Areas
  const { data: areas } = await supabase
    .from("popular_areas_v3")
    .select("slug, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const areaRoutes: MetadataRoute.Sitemap = (areas || []).map(
    (area: any) => ({
      url: `${baseUrl}/areas/${area.slug}`,
      lastModified: area.updated_at ? new Date(area.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: getAlternates(`/areas/${area.slug}`),
    }),
  );

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
