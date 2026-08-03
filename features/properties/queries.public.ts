// features/properties/queries.public.ts
import { createClient } from "@/lib/supabase/server";
import type { PropertyWithImages, PropertyType } from "./types";

const BOT_SELECT_FIELDS = `
  id,
  slug,
  title,
  title_en,
  title_cn,
  title_ru,
  price,
  rental_price,
  original_price,
  original_rental_price,
  listing_type,
  property_images (
    image_url,
    is_cover,
    sort_order
  ),
  bedrooms,
  bathrooms,
  size_sqm,
  popular_area,
  property_type
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

export async function getPublicPropertyWithImagesBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(`
      id,
      slug,
      title,
      title_en,
      title_cn,
      title_ru,
      price,
      rental_price,
      original_price,
      original_rental_price,
      listing_type,
      property_type,
      bedrooms,
      bathrooms,
      size_sqm,
      popular_area,
      status,
      property_images (
        id,
        property_id,
        image_url,
        is_cover,
        sort_order,
        created_at
      )
    `)
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort((a: { sort_order: number | null }, b: { sort_order: number | null }) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

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

  const term = keywords[0];
  if (term.length < 2 && !["🏠", "📍", "🏙️"].includes(term)) return [];

  const { data, error } = await supabase
    .from("properties")
    .select(`
      id,
      title,
      title_en,
      title_cn,
      title_ru,
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
    `)
    .eq("status", "ACTIVE")
    .or(`title.ilike.%${term}%,popular_area.ilike.%${term}%,description.ilike.%${term}%`)
    .limit(limit);

  if (error) {
    console.error("Search bot error:", error);
    return [];
  }

  return sortPropertyImages(data || []);
}

export async function getActivePropertyTypes(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select("property_type")
    .eq("status", "ACTIVE");

  if (error) {
    console.error("getActivePropertyTypes error:", error);
    return [];
  }

  const typeCount: Record<string, number> = {};
  for (const row of data || []) {
    const pt = row.property_type;
    if (pt) {
      typeCount[pt] = (typeCount[pt] || 0) + 1;
    }
  }

  return Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
}

export async function getDistinctAreasForType(propertyType: string): Promise<string[]> {
  const supabase = await createClient();

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

export async function searchByTypeAndArea(propertyType: string, area: string, limit = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(BOT_SELECT_FIELDS)
    .eq("status", "ACTIVE")
    .eq("property_type", propertyType as PropertyType)
    .ilike("popular_area", `%${area}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`[BOT] searchByTypeAndArea error:`, JSON.stringify(error));
    return [];
  }

  return sortPropertyImages(data || []);
}

export async function getHotProperties(limit = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(BOT_SELECT_FIELDS)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getHotProperties error:", JSON.stringify(error));
    return [];
  }

  return sortPropertyImages(data || []);
}

export async function getPopularAreaTranslations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("popular_areas_v3")
    .select("name");

  if (error) {
    console.error("getPopularAreaTranslations error:", error);
    return [];
  }
  return (data || []).map((item: any) => {
    const th = typeof item.name === "string" ? item.name : item.name?.th || item.name?.default || "";
    const en = typeof item.name === "string" ? null : item.name?.en || null;
    const cn = typeof item.name === "string" ? null : item.name?.cn || null;
    const ru = typeof item.name === "string" ? null : item.name?.ru || null;
    return { name: th, name_en: en, name_cn: cn, name_ru: ru };
  });
}
