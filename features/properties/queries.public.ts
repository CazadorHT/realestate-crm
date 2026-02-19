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

// ============================
// LINE Bot: Interactive Search Queries
// (ใช้ adminClient เพราะเรียกจาก API route)
// ============================
import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyType } from "./types";

const BOT_SELECT_FIELDS = `
  id,
  slug,
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
`;

function sortPropertyImages<
  T extends { property_images?: { sort_order?: number | null }[] | null },
>(data: T[]): T[] {
  return data.map((p) => {
    if (p.property_images && Array.isArray(p.property_images)) {
      p.property_images.sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
    }
    return p;
  });
}

/**
 * ดึง popular_area ที่มีทรัพย์ ACTIVE ของ property_type นั้น
 * คืน array ของ area เรียงตามจำนวนทรัพย์ (มากไปน้อย)
 */
export async function getDistinctAreasForType(
  propertyType: string,
): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select("popular_area")
    .eq("status", "ACTIVE")
    .eq("property_type", propertyType as PropertyType)
    .not("popular_area", "is", null)
    .not("popular_area", "eq", "");

  if (error) {
    console.error("getDistinctAreasForType error:", error);
    return [];
  }

  // Count occurrences and sort by most popular
  const areaCount: Record<string, number> = {};
  for (const row of data || []) {
    const area = row.popular_area?.trim();
    if (area) {
      areaCount[area] = (areaCount[area] || 0) + 1;
    }
  }

  return Object.entries(areaCount)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area);
}

/**
 * ค้นหาทรัพย์ตาม property_type + popular_area
 */
export async function searchByTypeAndArea(
  propertyType: string,
  area: string,
  limit = 10,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select(BOT_SELECT_FIELDS)
    .eq("status", "ACTIVE")
    .eq("property_type", propertyType as PropertyType)
    .ilike("popular_area", `%${area}%`)
    .order("is_hot", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("searchByTypeAndArea error:", error);
    return [];
  }

  return sortPropertyImages(data || []);
}

/**
 * ดึงทรัพย์ Hot Deals (is_hot = true)
 */
export async function getHotProperties(limit = 10) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select(BOT_SELECT_FIELDS)
    .eq("status", "ACTIVE")
    .eq("is_hot", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getHotProperties error:", error);
    return [];
  }

  return sortPropertyImages(data || []);
}
