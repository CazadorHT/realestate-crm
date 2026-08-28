"use server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
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
import { getSiteSettings } from "@/features/site-settings/actions";
import { getPopularAreasLookupMap } from "@/features/public/popular-areas";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * [S-Tier] Centered Data Fetcher for Public Property Detail
 * - Hardened with V3 Composite Query (Core + Details)
 * - Security Status Lockdown (ACTIVE ONLY)
 * - Request Memoization for Edge performance
 */
export async function getPublicPropertyDetail(slugOrId: string): Promise<PropertyDetail | null> {
  // Note: intentionally not memoized via `cache()` to avoid stale server-memory
  // when properties are created/updated and revalidated. Revalidation is handled
  // via Next.js path/tag revalidation during write operations.
  const supabase = await createClient();

  let fallbackLineId = "@811slazm";
  try {
    const settings = await getSiteSettings();
    if (settings?.line_id) {
      fallbackLineId = settings.line_id;
    }
  } catch (err) {
    console.error("Error loading site settings for fallback line ID:", err);
  }

  // 🛡️ V3 Hardened Query: Join Core specs with Multi-language Details and Master Identity
  const publicColumns = `
    id, listing_type, property_type, sale_price, rent_price,
    bedrooms, bathrooms, floor_area, land_area,
    is_hot_deal, is_exclusive, verified, created_at, updated_at,
    created_by, project_id,
    project:projects!properties_core_project_id_fkey (
      id, slug, name
    ),
    details:properties_details!property_id (
      title, description, address_info, amenities, transit_info, pricing_details, meta_data
    ),
    property_images (
      image_url, storage_path, is_cover, sort_order
    ),
    assigned_agent:identities_v3!properties_core_assigned_to_fkey (
      id,
      display_name,
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

  let query = supabase.from("properties_core").select(publicColumns).eq("status", 1); // 1 = ACTIVE in V3

  // Resolve Slug vs UUID
  if (UUID_RE.test(slugOrId)) {
    query = query.eq("id", slugOrId);
  } else {
    let resolvedId: string | null = null;

    // Search by slug in properties_details.address_info.slug
    const { data: byAddress } = await supabase
      .from("properties_details")
      .select("property_id")
      .contains("address_info", { slug: slugOrId })
      .maybeSingle();

    if (byAddress?.property_id) {
      resolvedId = byAddress.property_id;
    }

    // Fallback: slug stored in meta_data.slug
    if (!resolvedId) {
      const { data: byMeta } = await supabase
        .from("properties_details")
        .select("property_id")
        .filter("meta_data->>slug", "eq", slugOrId)
        .maybeSingle();
      if (byMeta?.property_id) {
        resolvedId = byMeta.property_id;
      }
    }

    // Final fallback: legacy `properties_core.slug` column
    if (!resolvedId) {
      const { data: coreBySlug } = await supabase
        .from("properties_core")
        .select("id")
        .eq("slug", slugOrId)
        .maybeSingle();
      if (coreBySlug?.id) {
        resolvedId = coreBySlug.id;
      }
    }

    // Check property_slug_history for old/historical slug (301 Permanent Redirect System)
    if (!resolvedId) {
      const { data: byHistory } = await supabase
        .from("property_slug_history")
        .select("property_id")
        .eq("old_slug", slugOrId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byHistory?.property_id) {
        resolvedId = byHistory.property_id;
      }
    }

    if (!resolvedId) {
      return null;
    }

    query = query.eq("id", resolvedId);
  }

  const { data: rawData, error } = await query.maybeSingle();
  if (error || !rawData) return null;

  // Fetch active stations to resolve slugs for nearby transits (Cached 1 year)
  const stationSlugMap = new Map<string, string>();
  try {
    const { getTransitStationsAction } = await import("@/features/properties/actions/fetch-master-data");
    const stationsMaster = await getTransitStationsAction();

    if (stationsMaster) {
      for (const item of stationsMaster) {
        const labels = (item.label as Record<string, string>) || {};
        const meta = (item.metadata as Record<string, any>) || {};
        const slug = meta.slug || item.code.toLowerCase().replace(/_/g, "-");

        if (labels.th) stationSlugMap.set(labels.th.trim().toLowerCase(), slug);
        if (labels.en) stationSlugMap.set(labels.en.trim().toLowerCase(), slug);
        if (item.code) {
          stationSlugMap.set(item.code.trim().toLowerCase(), slug);
          stationSlugMap.set(item.code.replace(/_/g, " ").trim().toLowerCase(), slug);
        }
      }
    }
  } catch (err) {
    console.error("Error loading transit stations for slug resolution:", err);
  }

  // 🧪 Hardened Data Extraction (Zero-Any Policy)
  const details = rawData.details as unknown as {
    title: { th?: string; en?: string; cn?: string; ru?: string };
    description: { th?: string; en?: string; cn?: string; ru?: string };
    address_info: {
      slug?: string;
      popular_area?: string;
      popular_area_en?: string;
      popular_area_cn?: string;
      popular_area_ru?: string;
      subdistrict?: string;
      subdistrict_en?: string;
      subdistrict_cn?: string;
      subdistrict_ru?: string;
      district?: string;
      district_en?: string;
      district_cn?: string;
      district_ru?: string;
      province?: string;
      province_en?: string;
      province_cn?: string;
      province_ru?: string;
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

  const sanitizeString = (str: any): string | null => {
    if (typeof str !== "string") return null;
    return str.replace(/\uFFFD/g, "");
  };

  // Helper for Server-side Multilingual Fallback
  const getV3Value = (obj: any, field: string) => {
    if (!obj || !obj[field]) return null;
    const val = obj[field];
    const rawVal = typeof val === "string" ? val : (val.th || val.en || val.cn || val.ru || null);
    return sanitizeString(rawVal);
  };

  let assignedAgent = rawData.assigned_agent;
  if (!assignedAgent && (rawData as any).created_by) {
    const { data: creatorAgent } = await supabase
      .from("identities_v3")
      .select(`
        id,
        display_name,
        phone,
        avatar_url,
        line_id
      `)
      .eq("id", (rawData as any).created_by)
      .maybeSingle();

    if (creatorAgent) {
      assignedAgent = creatorAgent as any;
    }
  }

  let agentProfile: any = null;
  if (assignedAgent) {
    const agentId = (assignedAgent as any).id || (rawData as any).assigned_to || (rawData as any).created_by;
    if (agentId) {
      agentProfile = await unstable_cache(
        async () => {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const adminClient = await createAdminClient();
          const { data: prof } = await adminClient
            .from("profiles")
            .select("full_name, display_name, phone, line_id, wechat_user_id, whatsapp_user_id")
            .eq("id", agentId)
            .maybeSingle();
          return prof || null;
        },
        [`agent-profile-${agentId}`],
        { revalidate: 31536000, tags: ["profiles", `agent-profile-${agentId}`] }
      )();
    }
  }

  let popularAreaSlug: string | null = null;
  const areaNameName = address.popular_area;
  if (areaNameName) {
    const trimmedArea = areaNameName.trim().toLowerCase();
    try {
      const lookupMap = await getPopularAreasLookupMap();
      popularAreaSlug = lookupMap[trimmedArea]?.slug || null;
    } catch (err) {
      console.error("Error looking up popular area slug in fetch-public-property:", err);
    }
  }

  const data: PropertyDetail = {
    id: rawData.id,
    slug: address.slug || slugOrId,
    project_id: rawData.project_id,
    project: rawData.project ? {
      id: (rawData.project as any).id,
      slug: (rawData.project as any).slug,
      name: (rawData.project as any).name,
    } : null,
    status: rawData.status,
    listing_type: mappedListingType as ListingType,
    property_type: mappedPropertyType as PropertyType,
    sale_price: rawData.sale_price,
    rent_price: rawData.rent_price,
    price: rawData.listing_type === 1 ? rawData.rent_price : rawData.sale_price,
    rental_price: rawData.rent_price,
    original_price: pricing.original_price || null,
    original_rental_price: pricing.original_rental_price || null,
    bedrooms: rawData.bedrooms,
    bathrooms: rawData.bathrooms,
    floor_area: rawData.floor_area,
    size_sqm: rawData.floor_area,
    land_area: rawData.land_area,
    land_size_sqwah: rawData.land_area,
    parking_slots: amenities.parking_slots || null,
    office_capacity: amenities.office_capacity !== null && amenities.office_capacity !== undefined ? String(amenities.office_capacity) : null,
    maid_rooms: amenities.maid_rooms || null,
    halls: amenities.halls || null,
    dining_rooms: amenities.dining_rooms || null,
    min_contract_months: pricing.min_contract_months || null,
    province: rawData.province,
    district: rawData.district,
    subdistrict: rawData.subdistrict,
    // Support both `google_maps_link` and legacy `maps_link` keys
    google_maps_link: (address.google_maps_link || (address as any).maps_link) || null,
    is_hot_deal: !!rawData.is_hot_deal,
    is_pet_friendly: !!amenities.is_pet_friendly,
    is_exclusive: !!rawData.is_exclusive,
    verified: !!rawData.verified,
    is_cbd: !!amenities.is_cbd,
    is_bare_shell: !!amenities.is_bare_shell,
    is_never_lived_in: !!amenities.is_never_lived_in,
    is_smart_home: !!amenities.is_smart_home,
    is_high_ceiling: !!amenities.is_high_ceiling,
    has_private_elevator: !!amenities.has_private_elevator,
    is_high_floor: !!amenities.is_high_floor,
    is_handicapped_friendly: !!amenities.is_handicapped_friendly,
    is_foreigner_quota: !!amenities.is_foreigner_quota,
    is_renovated: !!amenities.is_renovated,
    is_corner_unit: !!amenities.is_corner_unit,
    is_fully_furnished: !!amenities.is_fully_furnished,
    has_private_pool: !!amenities.has_private_pool,
    is_selling_with_tenant: !!amenities.is_selling_with_tenant,
    has_river_view: !!amenities.has_river_view,
    has_city_view: !!amenities.has_city_view,
    has_garden_view: !!amenities.has_garden_view,
    has_unblocked_view: !!amenities.has_unblocked_view,
    allow_smoking: !!amenities.allow_smoking,
    allow_airbnb: !!amenities.allow_airbnb,
    airbnb_daily_price: (amenities as any).airbnb_daily_price ?? null,
    airbnb_monthly_price: (amenities as any).airbnb_monthly_price ?? null,
    airbnb_min_contract: (amenities as any).airbnb_min_contract ?? null,
    is_column_free: !!amenities.is_column_free,
    is_grade_a: !!amenities.is_grade_a,
    is_grade_b: !!amenities.is_grade_b,
    is_grade_c: !!amenities.is_grade_c,
    is_tax_registered: !!amenities.is_tax_registered,
    has_pool_view: !!amenities.has_pool_view,
    facing_east: !!amenities.facing_east,
    facing_north: !!amenities.facing_north,
    facing_south: !!amenities.facing_south,
    facing_west: !!amenities.facing_west,
    has_raised_floor: !!amenities.has_raised_floor,
    is_central_air: !!amenities.is_central_air,
    is_split_air: !!amenities.is_split_air,
    has_247_access: !!amenities.has_247_access,
    has_fiber_optic: !!amenities.has_fiber_optic,
    has_multi_parking: !!amenities.has_multi_parking,
    is_green_building: !!amenities.is_green_building,
    has_flexible_lease: !!amenities.has_flexible_lease,
    is_fully_fitted: !!amenities.is_fully_fitted,
    floor: amenities.floor || null,
    is_total_floors: amenities.is_total_floors || null,
    near_transit: !!(
      (details?.transit_info as any)?.near_transit ||
      (Array.isArray((details?.transit_info as any)?.transits) && (details?.transit_info as any).transits.length > 0) ||
      (Array.isArray(details?.transit_info) && details.transit_info.length > 0) ||
      (details?.meta_data as any)?.keywords?.some((k: string) => k.toLowerCase().includes("transit")) ||
      (details?.meta_data as any)?.meta_keywords?.some((k: string) => k.toLowerCase().includes("transit"))
    ),
    meta_keywords: (details?.meta_data as any)?.keywords || (details?.meta_data as any)?.meta_keywords || [],
    floor_plan_url: rawData.floor_plan_url,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,

    title: getV3Value(details, "title") || "",
    title_en: sanitizeString(details?.title?.en) || null,
    title_cn: sanitizeString(details?.title?.cn) || null,
    title_ru: sanitizeString(details?.title?.ru) || null,

    description: getV3Value(details, "description") || "",
    description_en: sanitizeString(details?.description?.en) || null,
    description_cn: sanitizeString(details?.description?.cn) || null,
    description_ru: sanitizeString(details?.description?.ru) || null,

    popular_area: address.popular_area || rawData.district,
    popular_area_en: address.popular_area_en || null,
    popular_area_cn: address.popular_area_cn || null,
    popular_area_ru: address.popular_area_ru || null,
    popular_area_slug: popularAreaSlug,

    subdistrict_en: address.subdistrict_en || null,
    subdistrict_cn: address.subdistrict_cn || null,
    subdistrict_ru: address.subdistrict_ru || null,

    district_en: address.district_en || null,
    district_cn: address.district_cn || null,
    district_ru: address.district_ru || null,

    province_en: address.province_en || null,
    province_cn: address.province_cn || null,
    province_ru: address.province_ru || null,

    address_info: (details?.address_info || {}) as PropertyAddressV3,
    amenities: (details?.amenities || {}) as PropertyAmenitiesV3,
    transit_info: details?.transit_info || null,
    nearby_places: (details?.transit_info as any)?.places || [],
    nearby_transits: (() => {
      const rawTransits = Array.isArray((details?.transit_info as any)?.transits)
        ? (details?.transit_info as any)?.transits
        : (Array.isArray(details?.transit_info) ? details.transit_info : []);

      return rawTransits.map((t: any) => {
        if (!t) return t;
        const thName = (t.station_name || "").trim().toLowerCase();
        const enName = (t.station_name_en || "").trim().toLowerCase();

        let resolvedSlug = t.slug;
        if (!resolvedSlug) {
          resolvedSlug = stationSlugMap.get(thName) || stationSlugMap.get(enName);
        }

        if (!resolvedSlug && t.type && (thName || enName)) {
          const typePrefix = String(t.type).toLowerCase().replace(/_/g, "-");
          const namePart = (enName || thName)
            .replace(/[\s_/]+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          if (namePart) {
            resolvedSlug = `${typePrefix}-${namePart}`;
          }
        }

        return {
          ...t,
          slug: resolvedSlug || undefined
        };
      });
    })(),

    images: [], // Populated below
    assigned_agent: assignedAgent ? {
      full_name: (assignedAgent as any).display_name || agentProfile?.full_name || agentProfile?.display_name || "",
      phone: (assignedAgent as any).phone || agentProfile?.phone || "",
      avatar_url: (assignedAgent as any).avatar_url,
      line_id: (assignedAgent as any).line_id || agentProfile?.line_id || fallbackLineId,
      wechat_user_id: agentProfile?.wechat_user_id || null,
      whatsapp_user_id: agentProfile?.whatsapp_user_id || null
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
    const rawTarget = img.image_url || img.storage_path || "";
    const finalUrl = getPublicImageUrl(rawTarget) || "/images/hero-realestate.png";
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
}

/**
 * Cached agent list for floating contact dials / floating action menus (Cached 1 year)
 */
export async function getPublicFloatingAgentsAction() {
  return unstable_cache(
    async () => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminClient = await createAdminClient();
        const { data } = await adminClient
          .from("profiles")
          .select("id, full_name, nickname, phone, avatar_url, line_id, facebook_url, whatsapp_id, wechat_id")
          .limit(5);
        return data || [];
      } catch (err) {
        console.error("Error in getPublicFloatingAgentsAction:", err);
        return [];
      }
    },
    ["public-floating-agents-v1"],
    { revalidate: 31536000, tags: ["profiles", "public-data"] }
  )();
}
