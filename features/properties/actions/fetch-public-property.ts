"use server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { PropertyDetail, ListingType, PropertyType } from "../types";
import { getListingTypeFromDb, getPropertyTypeFromDb } from "../labels";
import { type PropertyTransitInfoConsolidated } from "../types";
import type { 
  PropertyAmenitiesV3, 
  PropertyAddressV3, 
  PropertyPricingV3, 
  PropertyImageV3,
  PropertyMetaDataV3,
  PropertyTransitV3
} from "../types/v3";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * [S-Tier] Centered Data Fetcher for Public Property Detail
 * - Hardened with V3 Composite Query (Core + Details)
 * - Security Status Lockdown (ACTIVE ONLY)
 * - Request Memoization for Edge performance
 */
export const getPublicPropertyDetail = cache(async (slugOrId: string): Promise<PropertyDetail | null> => {
  const supabase = await createClient();

  // 🛡️ V3 Hardened Query: Join Core specs with Multi-language Details and Master Identity
  const publicColumns = `
    id, listing_type, property_type, sale_price, rent_price, original_price, original_rental_price,
    bedrooms, bathrooms, floor_area, land_area, province, district, subdistrict,
    is_hot_deal, is_pet_friendly, is_exclusive, verified, floor_plan_url, created_at, updated_at,
    details:properties_details!property_id (
      title, description, address_info, amenities, transit_info, pricing_details, meta_data
    ),
    property_images (
      image_url, storage_path, is_cover, sort_order
    ),
    assigned_agent:identities_v3!properties_core_assigned_to_fkey (
      display_name,
      phone,
      avatar_url,
      line_id,
      wechat_user_id,
      whatsapp_user_id
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

  let query = supabase.from("properties_core").select(publicColumns).eq("status", 1); // 1 = ACTIVE in V3

  // Resolve Slug vs UUID
  if (UUID_RE.test(slugOrId)) {
    query = query.eq("id", slugOrId);
  } else {
    // Search by slug in properties_details
    const { data: detailMatch } = await supabase
      .from("properties_details")
      .select("property_id")
      .contains("address_info", { slug: slugOrId })
      .maybeSingle();
    
    if (!detailMatch) return null;
    query = query.eq("id", detailMatch.property_id);
  }

  const { data: rawData, error } = await query.maybeSingle();
  if (error || !rawData) return null;

  // 🧪 Hardened Data Extraction (Zero-Any Policy)
  const details = rawData.details as unknown as {
    title: { th?: string; en?: string; cn?: string; ru?: string };
    description: { th?: string; en?: string; cn?: string; ru?: string };
    address_info: { 
      slug?: string; 
      popular_area?: { th?: string; en?: string; cn?: string; ru?: string };
      subdistrict?: { th?: string; en?: string; cn?: string; ru?: string };
      district?: { th?: string; en?: string; cn?: string; ru?: string };
      province?: { th?: string; en?: string; cn?: string; ru?: string };
      google_maps_link?: string;
    };
    amenities: PropertyAmenitiesV3;
    pricing_details: PropertyPricingV3;
    meta_data: PropertyMetaDataV3;
    transit_info?: PropertyTransitInfoConsolidated; 
  } | null;

  const address = details?.address_info || {};
  const amenities = details?.amenities || {};
  const pricing = details?.pricing_details || {};

  // Selective Data Masking & Mapping
  const mappedListingType = getListingTypeFromDb(rawData.listing_type);
  const mappedPropertyType = getPropertyTypeFromDb(rawData.property_type);

  // Helper for Server-side Multilingual Fallback
  const getV3Value = (obj: any, field: string) => {
    if (!obj || !obj[field]) return null;
    const val = obj[field];
    if (typeof val === "string") return val;
    return val.th || val.en || val.cn || val.ru || null;
  };

  const data: PropertyDetail = {
    id: rawData.id,
    slug: address.slug || slugOrId,
    status: rawData.status,
    listing_type: mappedListingType as ListingType,
    property_type: mappedPropertyType as PropertyType,
    sale_price: rawData.sale_price,
    rent_price: rawData.rent_price,
    price: rawData.listing_type === 1 ? rawData.rent_price : rawData.sale_price,
    rental_price: rawData.rent_price,
    original_price: rawData.original_price,
    original_rental_price: rawData.original_rental_price,
    bedrooms: rawData.bedrooms,
    bathrooms: rawData.bathrooms,
    floor_area: rawData.floor_area,
    size_sqm: rawData.floor_area,
    land_area: rawData.land_area,
    land_size_sqwah: rawData.land_area,
    parking_slots: amenities.parking_slots || null,
    office_capacity: amenities.office_capacity || null,
    min_contract_months: pricing.min_contract_months || null,
    province: rawData.province,
    district: rawData.district,
    subdistrict: rawData.subdistrict,
    google_maps_link: address.google_maps_link || null,
    is_hot_deal: rawData.is_hot_deal,
    is_pet_friendly: rawData.is_pet_friendly,
    is_exclusive: rawData.is_exclusive,
    verified: rawData.verified,
    floor_plan_url: rawData.floor_plan_url,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    
    title: getV3Value(details, "title") || "",
    title_en: details?.title?.en || null,
    title_cn: details?.title?.cn || null,
    title_ru: details?.title?.ru || null,
    
    description: getV3Value(details, "description") || "",
    description_en: details?.description?.en || null,
    description_cn: details?.description?.cn || null,
    description_ru: details?.description?.ru || null,

    popular_area: getV3Value(address, "popular_area") || rawData.district,
    popular_area_en: address.popular_area?.en || null,
    popular_area_cn: address.popular_area?.cn || null,
    popular_area_ru: address.popular_area?.ru || null,

    subdistrict_en: address.subdistrict?.en || null,
    subdistrict_cn: address.subdistrict?.cn || null,
    subdistrict_ru: address.subdistrict?.ru || null,

    district_en: address.district?.en || null,
    district_cn: address.district?.cn || null,
    district_ru: address.district?.ru || null,

    province_en: address.province?.en || null,
    province_cn: address.province?.cn || null,
    province_ru: address.province?.ru || null,

    address_info: (details?.address_info || {}) as PropertyAddressV3,
    amenities: (details?.amenities || {}) as PropertyAmenitiesV3,
    transit_info: details?.transit_info || null,
    nearby_places: details?.transit_info?.places || [],
    nearby_transits: details?.transit_info?.transits || [],

    images: [], // Populated below
    assigned_agent: rawData.assigned_agent ? {
      full_name: (rawData.assigned_agent as { display_name: string }).display_name,
      phone: (rawData.assigned_agent as { phone: string | null }).phone,
      avatar_url: (rawData.assigned_agent as { avatar_url: string | null }).avatar_url,
      line_id: (rawData.assigned_agent as { line_id: string | null }).line_id,
      wechat_user_id: (rawData.assigned_agent as { wechat_user_id: string | null }).wechat_user_id,
      whatsapp_user_id: (rawData.assigned_agent as { whatsapp_user_id: string | null }).whatsapp_user_id
    } : null,
    property_features: (rawData.property_features as Array<{
      features: {
        id: string;
        name: string;
        name_en: string | null;
        name_cn: string | null;
        name_ru: string | null;
        icon_key: string | null;
        category: string | null;
      } | null;
    }> | null)?.map((f) => ({
      features: {
        id: f.features?.id || "",
        name: f.features?.name || "",
        name_en: f.features?.name_en || undefined,
        name_cn: f.features?.name_cn || undefined,
        name_ru: f.features?.name_ru || undefined,
        icon_key: f.features?.icon_key || undefined,
        category: f.features?.category || undefined,
      },
    })) || [],
  };

  // Image Normalization
  const finalImages: PropertyImageV3[] = (rawData.property_images as Array<{
    id: string;
    image_url: string | null;
    storage_path: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
    media_type: string | null;
    ai_scan_status: string | null;
    ai_scan_result: Record<string, unknown> | null;
    created_at: string | null;
    property_id: string | null;
  }> || []).map((img) => {
    const finalUrl = img.image_url || (img.storage_path ? getPublicImageUrl(img.storage_path) : "/images/hero-realestate.png");
    return {
      id: img.id,
      url: finalUrl,
      image_url: finalUrl,
      storage_path: img.storage_path || "",
      is_cover: !!img.is_cover,
      sort_order: img.sort_order || 0,
      media_type: img.media_type || "IMAGE",
      ai_scan_status: img.ai_scan_status || null,
      ai_scan_result: img.ai_scan_result || null,
      created_at: img.created_at || null,
      property_id: img.property_id || rawData.id
    };
  });

  data.images = finalImages;

  return data;
});
