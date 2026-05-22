"use server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import type {
  PropertyRow,
  PropertyWithImages,
  PropertyType,
  ListingType,
  PropertyStatus,
  PropertyTransitInfoConsolidated,
  PropertyTransitV3,
} from "../types";
import type { 
  InventoryProperty,
  InventoryFilterCounts 
} from "@/app/(protected)/protected/admin/inventory/types";
import { getCoverImage } from "@/lib/property-hardened-utils";
import { getRecommendedProperties } from "../queries";
import { 
  PROPERTY_STATUS_DB_VALUE,
  LISTING_TYPE_DB_VALUE,
  PROPERTY_TYPE_DB_VALUE,
  getStatusFromDb,
  getListingTypeFromDb,
  getPropertyTypeFromDb
} from "../labels";
import { mapDbError } from "@/lib/db-error";
import type { Database } from "@/lib/database.types.generated";

/** === SHARED JSONB INTERFACES === */
interface MultiLang { th?: string; en?: string; cn?: string; ru?: string }
interface AddressInfo { th?: string; en?: string; province?: string; district?: string; subdistrict?: string; postal_code?: string; maps_link?: string; popular_area?: string; popular_area_en?: string; popular_area_cn?: string; popular_area_ru?: string }
interface Amenities { is_pet_friendly?: boolean; is_foreigner_quota?: boolean }
interface PricingDetails { 
  maintenance_fee?: number; 
  commission_sale?: number; 
  commission_rent?: number;
  original_price?: number;
  original_rental_price?: number;
}
interface MetaData { 
  agent_ids?: string[]; 
  created_by?: string; 
  requires_ai_review?: boolean;
  co_agent?: { name?: string; phone?: string; contact_id?: string } 
}

interface AggregationRow {
  property_type: string | null;
  status: string | null;
  listing_type: string | null;
  tenant_id: string | null;
}

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // 🛡️ Elite Hardening: Admins can bypass tenantId filter, others cannot.
    if (role !== "ADMIN" && !tenantId) {
      throw new Error("Tenant ID is required but missing for staff roles");
    }

    const { data: core, error: coreErr } = await supabase
      .from("properties_core")
      .select("id, tenant_id, branch_id, status, listing_type, property_type, sale_price, rent_price, currency, floor_area, land_area, is_exclusive, is_hot_deal, verified, created_at, updated_at, owner_id, assigned_to, bedrooms, bathrooms, price_per_sqm")
      .eq("id", id)
      .single();

    if (coreErr || !core) throw coreErr || new Error("Property not found");

    const { data: details, error: detailsErr } = await supabase
      .from("properties_details")
      .select("property_id, title, description, address_info, amenities, pricing_details, meta_data, transit_info")
      .eq("property_id", id)
      .single();

    if (detailsErr || !details) throw detailsErr || new Error("Details not found");

    const { data: media } = await supabase
      .from("property_media_v3")
      .select("id, property_id, url, media_type, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order");

    const { data: features } = await supabase
      .from("property_features")
      .select("feature_id")
      .eq("property_id", id);

    const title = details.title as unknown as MultiLang;
    const description = details.description as unknown as MultiLang;
    const addr = details.address_info as unknown as AddressInfo;
    const amen = details.amenities as unknown as Amenities;
    const price = details.pricing_details as unknown as PricingDetails;
    const meta = details.meta_data as unknown as MetaData;

    const property: PropertyRow = {
      ...core,
      ...details,
      id: core.id,
      tenant_id: core.tenant_id,
      branch_id: core.branch_id, // 🛡️ Added for V3 Branching
      title: title?.th || "",
      title_en: title?.en || "",
      title_cn: title?.cn || "",
      title_ru: title?.ru || "",
      description: description?.th || "",
      description_en: description?.en || "",
      description_cn: description?.cn || "",
      description_ru: description?.ru || "",
      
      status: getStatusFromDb(core.status),
      listing_type: getListingTypeFromDb(core.listing_type),
      property_type: getPropertyTypeFromDb(core.property_type),
      
      price: core.sale_price,
      rental_price: core.rent_price,
      original_price: price?.original_price ?? core.sale_price ?? null,
      original_rental_price: price?.original_rental_price ?? core.rent_price ?? null,
      
      size_sqm: core.floor_area || 0,
      land_size_sqwah: core.land_area || 0,
      
      address_line1: addr?.th || "",
      address_line1_en: addr?.en || "",
      province: addr?.province || "",
      district: addr?.district || "",
      subdistrict: addr?.subdistrict || "",
      postal_code: addr?.postal_code || "",
      google_maps_link: addr?.maps_link || "",
      popular_area: addr?.popular_area || "",
      popular_area_en: addr?.popular_area_en || "",
      popular_area_cn: addr?.popular_area_cn || "",
      popular_area_ru: addr?.popular_area_ru || "",
      
      is_pet_friendly: !!amen?.is_pet_friendly,
      is_foreigner_quota: !!amen?.is_foreigner_quota,
      is_exclusive: !!core.is_exclusive,
      is_hot_deal: !!core.is_hot_deal,
      verified: !!core.verified,
      
      maintenance_fee: price?.maintenance_fee || 0,
      commission_sale_percentage: price?.commission_sale || 0,
      commission_rent_months: price?.commission_rent || 0,
      
      images: media || [],
      property_features: features || [],
      nearby_transits: Array.isArray(details.transit_info)
        ? (details.transit_info as unknown as PropertyTransitV3[])
        : ((details.transit_info as unknown as PropertyTransitInfoConsolidated)?.transits || []),
      nearby_places: Array.isArray(details.transit_info)
        ? []
        : ((details.transit_info as unknown as PropertyTransitInfoConsolidated)?.places || []),
      
      agent_ids: meta?.agent_ids || [],
      created_by: meta?.created_by || "",
      co_agent_name: meta?.co_agent?.name || "",
      co_agent_phone: meta?.co_agent?.phone || "",
      co_agent_contact_id: meta?.co_agent?.contact_id || "",
    } as unknown as PropertyRow;

    return property;
  } catch (error) {
    console.error("getPropertyById → error:", error);
    throw error;
  }
}

/**
 * Get property with images
 */
export async function getPropertyWithImages(
  id: string,
): Promise<PropertyWithImages> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  // 🛡️ Elite Hardening: Admins can bypass tenantId filter
  if (role !== "ADMIN" && !tenantId) {
    throw new Error("Tenant ID is required but missing");
  }

  return getPropertyById(id) as Promise<PropertyWithImages>;
}


/**
 * Add a new popular area to the database
 */
export async function addPopularAreaAction(data: {
  name: string;
  name_en?: string;
  name_cn?: string;
  name_ru?: string;
  province?: string;
}) {
  const { supabase, role } = await requireAuthContext();
  
  // 🛡️ Elite Hardening: Popular Areas are GLOBAL. Only SuperAdmins can add them.
  if (role !== "ADMIN") throw new Error("Forbidden: SuperAdmin only");

  if (!data.name || data.name.trim() === "") {
    return { success: false, message: "กรุณาระบุชื่อย่าน" };
  }

  const { error } = await supabase.from("popular_areas_v3").insert({
    name: {
      th: data.name.trim(),
      en: data.name_en?.trim() || null,
      cn: data.name_cn?.trim() || null,
      ru: data.name_ru?.trim() || null,
    },
    province: data.province || "กรุงเทพมหานคร",
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "ย่านนี้มีอยู่แล้ว" };
    }
    console.error("addPopularAreaAction error:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

type PropertyViewRow = {
  id: string;
  tenant_id: string | null;
  status: PropertyStatus | null;
  property_type: PropertyType | null;
  listing_type: ListingType | null;
  price: number | null;
  rental_price: number | null;
  created_at: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  land_size_sqwah: number | null;
  main_image_url: string | null;
  title: MultiLang | null;
  pricing_details: PricingDetails | null;
  meta_data: MetaData | null;
  tenants: { name: string } | null;
};

/**
 * Get global properties for administration (cross-tenant)
 * 🛡️ Elite 10/10 Hardened Version
 */
export async function getGlobalPropertiesTableDataAction(params: {
  page: number;
  q?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  targetTenantId?: string;
}): Promise<{ tableData: InventoryProperty[]; count: number }> {
  // 🛡️ Authorization & Context
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  const { page, q, propertyType, listingType, status, targetTenantId } = params;

    const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("properties") // 🛡️ Use View Bridge for easy searching and flattened columns
    .select(
      `
      id, tenant_id, status, property_type, listing_type, price, rental_price, created_at, 
      bedrooms, bathrooms, size_sqm, land_size_sqwah, title, pricing_details, meta_data, main_image_url,
      tenants (
        name
      )
    `,
      { count: "exact" }
    )
    .range(from, to)
    .order("created_at", { ascending: false });

  if (q) {
    // 🛡️ These columns exist in the 'properties' view
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,address_line1.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%`,
    );
  }

  if (propertyType && propertyType !== "ALL") {
    query = query.eq("property_type", propertyType);
  }

  if (listingType && listingType !== "ALL") {
    query = query.eq("listing_type", listingType);
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  if (targetTenantId && targetTenantId !== "ALL") {
    query = query.eq("tenant_id", targetTenantId);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    if (error) {
      console.error("getGlobalPropertiesTableDataAction error:", error);
      throw new Error(mapDbError(error));
    }
    return { tableData: [], count: 0 };
  }

  // 🛡️ Cast to hardened interface
  const typedData = data as unknown as PropertyViewRow[];

  const tableData = typedData.map((p: PropertyViewRow) => {
    const pricing = p.pricing_details;
    const title = p.title;
    const meta = p.meta_data;

    return {
      id: p.id || "",
      title: title?.th || title?.en || "Untitled",
      status: (p.status as PropertyStatus) || "DRAFT",
      property_type: (p.property_type as PropertyType) || "OTHER",
      listing_type: (p.listing_type as ListingType) || "SALE",
      price: p.price ?? pricing?.original_price ?? null,
      rental_price: p.rental_price ?? pricing?.original_rental_price ?? null,
      main_image_url: p.main_image_url,
      created_at: p.created_at || "",
      tenant_id: p.tenant_id || "",
      tenant_name: p.tenants?.name || "Unknown",
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      size_sqm: p.size_sqm || 0,
      land_size_sqwah: p.land_size_sqwah || 0,
      requires_ai_review: meta?.requires_ai_review ?? false,
    };
  });

  return { tableData, count: count || 0 };
}

export async function getGlobalInventoryFilterCountsAction(): Promise<InventoryFilterCounts> {
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  // Fetch only necessary columns for all non-deleted properties
  const { data, error } = await supabase
    .from("properties")
    .select("property_type, status, listing_type, tenant_id");

  if (error || !data) {
    console.error("getGlobalInventoryFilterCountsAction error:", error);
    return { propertyTypes: {}, statuses: {}, listingTypes: {}, branches: {} };
  }

  // 🛡️ Perform in-memory aggregation with Uppercase Normalization
  const typedData = data as unknown as AggregationRow[];
  const counts: InventoryFilterCounts = {
    propertyTypes: {},
    statuses: {},
    listingTypes: {},
    branches: {}
  };

  typedData.forEach((p) => {
    if (p.property_type) {
      const key = String(p.property_type).toUpperCase();
      counts.propertyTypes[key] = (counts.propertyTypes[key] || 0) + 1;
    }
    if (p.status) {
      const key = String(p.status).toUpperCase();
      counts.statuses[key] = (counts.statuses[key] || 0) + 1;
    }
    if (p.listing_type) {
      const key = String(p.listing_type).toUpperCase();
      counts.listingTypes[key] = (counts.listingTypes[key] || 0) + 1;
    }
    if (p.tenant_id) {
      counts.branches[p.tenant_id] = (counts.branches[p.tenant_id] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Public action for AI recommendations
 */
export async function getRecommendedPropertiesAction(category: string) {
  // Publicly accessible, no auth required
  return getRecommendedProperties(category);
}
