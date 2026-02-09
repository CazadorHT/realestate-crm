"use server";

import { createClient } from "@/lib/supabase/server";

export type RecommendedProperty = {
  id: string;
  title: string;
  property_type: string | null;
  listing_type: string | null;
  province: string | null;
  popular_area: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  image_url: string | null;
  slug?: string | null;
};

/**
 * Get recommended properties (latest public properties)
 * Used as fallback for Recently Viewed when empty
 */
export async function getRecommendedProperties(
  limit: number = 10,
): Promise<RecommendedProperty[]> {
  const supabase = await createClient();

  // Fetch latest published properties
  // Note: We fetch images and filter for cover in memory to avoid complex join filters
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      title,
      property_type,
      listing_type,
      province,
      popular_area,
      price,
      original_price,
      rental_price,
      original_rental_price,
      slug,
      property_images(image_url, is_cover)
    `,
    )
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !properties) {
    console.error("Error fetching recommended properties:", error);
    return [];
  }

  // Fetch Popular Area Translations
  const popularAreaNames = Array.from(
    new Set(
      properties
        .map((p) => p.popular_area)
        .filter((area): area is string => !!area),
    ),
  );

  const areaTranslationsMap = new Map<
    string,
    { en: string | null; cn: string | null }
  >();

  if (popularAreaNames.length > 0) {
    const { data: areaData } = await supabase
      .from("popular_areas")
      .select("name, name_en, name_cn")
      .in("name", popularAreaNames);

    (areaData || []).forEach((a) => {
      areaTranslationsMap.set(a.name, { en: a.name_en, cn: a.name_cn });
    });
  }

  // Transform to match RecommendedProperty type
  return properties.map((prop: any) => {
    // Find cover image or use first image
    const coverImage =
      prop.property_images?.find((img: any) => img.is_cover) ||
      prop.property_images?.[0];

    const trans = areaTranslationsMap.get(prop.popular_area || "");

    return {
      id: prop.id,
      title: prop.title,
      property_type: prop.property_type,
      listing_type: prop.listing_type,
      province: prop.province,
      popular_area: prop.popular_area,
      popular_area_en: trans?.en ?? null,
      popular_area_cn: trans?.cn ?? null,
      price: prop.price,
      original_price: prop.original_price,
      rental_price: prop.rental_price,
      original_rental_price: prop.original_rental_price,
      image_url: coverImage?.image_url || null,
      slug: prop.slug,
    };
  });
}
