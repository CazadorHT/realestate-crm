"use server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  // 🛡️ Security Seal: Explicitly select ONLY public-facing columns.
  const publicColumns = `
    id, title, title_en, title_cn, title_ru, slug, status, listing_type, property_type,
    price, rental_price, original_price, original_rental_price,
    size_sqm, land_size_sqwah, bedrooms, bathrooms, floor, 
    province, district, subdistrict, popular_area, popular_area_en, popular_area_cn, popular_area_ru, google_maps_link,
    description, description_en, description_cn, description_ru,
    meta_title, meta_description, meta_keywords,
    meta_title_en, meta_description_en,
    meta_title_cn, meta_description_cn,
    meta_title_ru, meta_description_ru,
    is_hot_deal, is_pet_friendly, is_fully_furnished, is_foreigner_quota,
    near_transit, is_exclusive, is_selling_with_tenant, verified, 
    transit_station_name, transit_distance_meters, transit_type,
    created_at, updated_at,
    property_images (
      image_url, storage_path, is_cover, sort_order
    ),
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
        name_ru,
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
  const data = {
    ...rawData,
  } as unknown as PropertyDetail;

  // [OPTIMIZATION] Popular Area Translations are already included in the main query
  // No second fetch needed. Just ensure they are mapped if null from property but exist in popular_areas?
  // Actually, they should be denormalized. If they are missing, we can keep the denormalization strategy.

  // Image Normalization (Centralized via image-utils helper logic)
  const finalImages = (rawData.property_images || []).map((img: any) => {
    const finalUrl = img.image_url || (img.storage_path ? getPublicImageUrl(img.storage_path) : "/images/hero-realestate.png");
    
    return {
      id: img.id || null,
      url: finalUrl,
      image_url: finalUrl,
      storage_path: img.storage_path || null,
      is_cover: img.is_cover || false,
      sort_order: img.sort_order || 0
    };
  });

  data.images = finalImages;

  return data;
});
