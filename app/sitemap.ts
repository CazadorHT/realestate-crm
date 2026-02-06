import { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com";
  const supabase = createAdminClient();

  // Fetch all properties for the sitemap
  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  const propertyEntries: MetadataRoute.Sitemap =
    properties?.map((property) => ({
      url: `${baseUrl}/properties/${property.slug}`,
      lastModified: new Date(property.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...propertyEntries,
  ];
}
