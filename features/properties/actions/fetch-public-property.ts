import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { PropertyDetail } from "../types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * [S-Tier] Centered Data Fetcher for Public Property Detail
 * - Hardened with Strict Whitelist Selection (Security Seal)
 * - Security Status Lockdown (ACTIVE ONLY)
 * - Request Memoization for Edge performance
 */
export const getPublicPropertyDetail = cache(async (slugOrId: string): Promise<PropertyDetail | null> => {
  const supabase = createAdminClient();

  // 🛡️ Security Seal: Explicitly select ONLY public-facing columns.
  // This must match the whitelist strategy in lib/services/properties.ts
  const publicColumns = `
    id, title, title_en, title_cn, slug, status, listing_type, property_type,
    price, rental_price, original_price, original_rental_price,
    size_sqm, land_size_sqwah, bedrooms, bathrooms, floor, 
    province, district, subdistrict, popular_area, google_maps_link,
    description, description_en, description_cn,
    meta_title, meta_description, meta_keywords,
    meta_title_en, meta_description_en,
    meta_title_cn, meta_description_cn,
    is_hot_deal, is_pet_friendly, is_fully_furnished, is_foreigner_quota,
    near_transit, is_exclusive, is_selling_with_tenant, verified, 
    transit_station_name, transit_distance_meters, transit_type,
    created_at, updated_at, images,
    assigned_agent:profiles!properties_assigned_to_profile_fkey (
      full_name,
      phone,
      avatar_url,
      line_id
    ),
    property_features (
      features (
        id,
        name,
        name_en,
        name_cn,
        icon_key,
        category
      )
    )
  `;

  let query = supabase.from("properties").select(publicColumns).eq("status", "ACTIVE");

  // Resolve Slug vs UUID
  const decodedSlug = decodeURIComponent(slugOrId);
  if (UUID_RE.test(decodedSlug)) {
    query = query.eq("id", decodedSlug);
  } else {
    query = query.ilike("slug", decodedSlug);
  }

  const { data: rawData, error } = await query.maybeSingle();
  if (error || !rawData) return null;

  // Selective Data Masking & Mapping
  const data: PropertyDetail = {
    ...rawData,
  } as PropertyDetail;

  // Popular Area Translations (Cached-ready logic)
  if (data.popular_area) {
    const { data: areaData } = await supabase
      .from("popular_areas")
      .select("name_en, name_cn")
      .eq("name", data.popular_area)
      .maybeSingle();

    if (areaData) {
      data.popular_area_en = areaData.name_en;
      data.popular_area_cn = areaData.name_cn;
    }
  }

  // Image Normalization (Centralized via image-utils helper logic)
  data.images = ((rawData.images as any[]) || []).map((img: any) => {
    const url = img.url || img.image_url;
    
    // Resolve Absolute URLs
    if (url && url.startsWith("http")) {
      return { ...img, image_url: url };
    }

    // Resolve Storage Paths
    if (img.storage_path) {
      return {
        ...img,
        image_url: getPublicImageUrl(img.storage_path),
      };
    }

    // Fallback to standard Hero placeholder
    return {
      ...img,
      image_url: url || "/images/hero-realestate.png",
    };
  });

  return data;
});
