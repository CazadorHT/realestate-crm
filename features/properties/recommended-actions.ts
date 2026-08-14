"use server";

import { createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type RecommendedProperty = {
  id: string;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  property_type: string | null;
  listing_type: string | null;
  province: string | null;
  popular_area: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  price_per_sqm?: number | null;
  rent_price_per_sqm?: number | null;
  size_sqm?: number | null;
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
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      const { data: properties, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          title,
          title_en,
          title_cn,
          title_ru,
          property_type,
          listing_type,
          province,
          popular_area,
          price,
          original_price,
          rental_price,
          original_rental_price,
          price_per_sqm,
          rent_price_per_sqm,
          size_sqm,
          slug,
          property_images(image_url, is_cover)
        `,
        )
        .eq("status", "ACTIVE")
        .order("meta_data->>bumped_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !properties) {
        return [];
      }

      const popularAreaNames = Array.from(
        new Set(
          properties
            .map((p: { popular_area: string | null }) => p.popular_area)
            .filter((area: string | null): area is string => !!area),
        ),
      );

      const areaTranslationsMap = new Map<
        string,
        { en: string | null; cn: string | null; ru: string | null }
      >();

      if (popularAreaNames.length > 0) {
        const { data: areaData } = await supabase
          .from("popular_areas_v3")
          .select("name")
          .in("name", popularAreaNames);

        (areaData || []).forEach((a: any) => {
          const areaNameTh = typeof a.name === "string" ? a.name : a.name?.th || a.name?.default || "";
          const areaNameEn = typeof a.name === "string" ? null : a.name?.en || null;
          const areaNameCn = typeof a.name === "string" ? null : a.name?.cn || null;
          const areaNameRu = typeof a.name === "string" ? null : a.name?.ru || null;
          areaTranslationsMap.set(areaNameTh, { en: areaNameEn, cn: areaNameCn, ru: areaNameRu });
        });
      }

      interface RecommendedRow {
        id: string; title: string; title_en: string | null; title_cn: string | null; title_ru: string | null; property_type: string | null; listing_type: string | null;
        province: string | null; popular_area: string | null; price: number | null;
        original_price: number | null; rental_price: number | null;
        original_rental_price: number | null; price_per_sqm: number | null;
        rent_price_per_sqm: number | null; size_sqm: number | null; slug: string | null;
        property_images: { image_url: string; is_cover: boolean }[];
      }

      return (properties as unknown as RecommendedRow[]).map((prop) => {
        const images = prop.property_images as { image_url: string; is_cover: boolean }[];
        const coverImage =
          images?.find((img) => img.is_cover) ||
          images?.[0];

        const trans = areaTranslationsMap.get(prop.popular_area || "");

        return {
          id: prop.id,
          title: prop.title,
          title_en: prop.title_en,
          title_cn: prop.title_cn,
          title_ru: prop.title_ru,
          property_type: prop.property_type,
          listing_type: prop.listing_type,
          province: prop.province,
          popular_area: prop.popular_area,
          popular_area_en: trans?.en ?? null,
          popular_area_cn: trans?.cn ?? null,
          popular_area_ru: trans?.ru ?? null,
          price: prop.price,
          original_price: prop.original_price,
          rental_price: prop.rental_price,
          original_rental_price: prop.original_rental_price,
          price_per_sqm: prop.price_per_sqm,
          rent_price_per_sqm: prop.rent_price_per_sqm,
          size_sqm: prop.size_sqm,
          image_url: coverImage?.image_url || null,
          slug: prop.slug,
        };
      });
    },
    [`public-recommended-properties-${limit}`],
    { revalidate: 86400, tags: ["properties", "public-data"] }
  )();
}
