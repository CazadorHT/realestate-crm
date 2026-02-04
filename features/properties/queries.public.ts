// features/properties/queries.public.ts
import { createClient } from "@/lib/supabase/server";
import type { PropertyWithImages } from "./types";

export async function getPublicPropertyWithImagesBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        is_cover,
        sort_order,
        created_at
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  // ✅ public ไม่คืน storage_path
  return data as unknown as Omit<PropertyWithImages, "property_images"> & {
    property_images: Array<{
      id: string;
      property_id: string;
      image_url: string | null;
      is_cover: boolean | null;
      sort_order: number | null;
      created_at: string;
    }>;
  };
}

export async function searchPropertiesForBot(query: string, limit = 5) {
  const supabase = await createClient();
  const keywords = query.trim().split(/\s+/).filter(Boolean);

  if (keywords.length === 0) return [];

  const term = keywords[0]; // Take main keyword for MVP
  // Using OR filter for title, popular_area, description
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      title,
      price,
      rental_price,
      listing_type,
      property_images (
        image_url,
        is_cover,
        sort_order
      ),
      bedrooms, 
      bathrooms,
      size_sqm,
      popular_area
    `,
    )
    .eq("status", "ACTIVE")
    .or(
      `title.ilike.%${term}%,popular_area.ilike.%${term}%,description.ilike.%${term}%`,
    )
    .limit(limit);

  if (error) {
    console.error("Search bot error:", error);
    return [];
  }

  // Sort images and return
  return (data || []).map((p) => {
    if (p.property_images && Array.isArray(p.property_images)) {
      p.property_images.sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    }
    return p;
  });
}
