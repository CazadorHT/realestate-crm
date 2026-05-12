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
} from "../types";
import type { 
  InventoryProperty,
  InventoryFilterCounts 
} from "@/app/(protected)/protected/admin/inventory/types";
import { getCoverImage } from "@/lib/property-hardened-utils";
import { getRecommendedProperties } from "../queries";
import { mapDbError } from "@/lib/db-error";
import { Database } from "@/lib/database.types";
import { decrypt } from "@/lib/crypto";

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

    let query = supabase
      .from("properties")
      .select(`
        id, title, title_en, title_cn, title_ru, description, description_en, description_cn, description_ru,
        property_type, listing_type, price, original_price, rental_price, original_rental_price,
        currency, address_line1, address_line1_en, address_line1_cn, address_line1_ru,
        subdistrict, district, province, postal_code, bedrooms, bathrooms,
        size_sqm, land_size_sqwah, total_units, sold_units, floor, orientation,
        parking_slots, is_fully_furnished, is_pet_friendly,
        status, view_count, is_hot_deal, is_exclusive,
        created_at, updated_at,
        tenant_id, created_by, owner_id, co_agent_sale_commission_percent,
        co_agent_name, co_agent_phone, co_agent_contact_id,
        popular_area, popular_area_en, popular_area_cn, popular_area_ru, property_source,
        ai_summary_content,
        ai_reviewed_at,
        ai_reviewed_by, version, images, nearby_places, nearby_transits
      `)
      .eq("id", id);

    // Apply tenant filter only if not ADMIN or if tenantId is explicitly provided
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: property, error: propErr } = await query.single();

    if (propErr) throw propErr;

    // ✅ กันอ่านของคนอื่น
    assertAuthenticated({
      userId: user.id,
      role,
    });

    const p = property as unknown as PropertyRow;
    return {
      ...p,
      co_agent_name: decrypt(p.co_agent_name),
      co_agent_phone: decrypt(p.co_agent_phone),
      co_agent_contact_id: decrypt(p.co_agent_contact_id),
    };
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

  let query = supabase
    .from("properties")
    .select(`
      id, title, title_en, title_cn, title_ru, description, description_en, description_cn, description_ru,
      property_type, listing_type, price, original_price, rental_price, original_rental_price,
      currency, address_line1, address_line1_en, address_line1_cn, address_line1_ru,
      subdistrict, district, province, postal_code, bedrooms, bathrooms,
      size_sqm, land_size_sqwah, total_units, sold_units, floor, orientation,
      parking_slots, is_fully_furnished, is_pet_friendly,
      status, view_count, is_hot_deal, is_exclusive,
      created_at, updated_at,
      tenant_id, created_by, owner_id, co_agent_sale_commission_percent,
      co_agent_name, co_agent_phone, co_agent_contact_id,
      popular_area, popular_area_en, popular_area_cn, popular_area_ru, property_source,
      ai_summary_content,
      ai_reviewed_at,
      ai_reviewed_by, version, images, nearby_places, nearby_transits,
      property_agents (
        agent_id
      ),
      property_features (
        feature_id
      ),
      reviewer:profiles!properties_ai_reviewed_by_fkey (
        full_name
      )
    `)
    .eq("id", id);

  if (role !== "ADMIN" && tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error || !data) throw error;

  const property = data as unknown as PropertyWithImages;

  // Sorting is now handled by the SQL Trigger but safe to sort here too if needed
  if (property.images) {
    property.images.sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
  }

  return {
    ...property,
    co_agent_name: decrypt(property.co_agent_name),
    co_agent_phone: decrypt(property.co_agent_phone),
    co_agent_contact_id: decrypt(property.co_agent_contact_id),
  };
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

  const { error } = await supabase.from("popular_areas").insert({
    name: data.name.trim(),
    name_en: data.name_en?.trim() || null,
    name_cn: data.name_cn?.trim() || null,
    name_ru: data.name_ru?.trim() || null,
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

/**
 * 🛡️ Elite Type Hardening for Relational Data
 */
type JoinedPropertyRow = Database["public"]["Tables"]["properties"]["Row"] & {
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
    .from("properties")
    .select("id, title, price, original_price, rental_price, original_rental_price, status, property_type, listing_type, images, created_at, tenant_id, tenants(name)", {
      count: "exact",
    })
    .is("deleted_at", null)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,address_line1.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%`,
    );
  }

  if (propertyType && propertyType !== "ALL") {
    query = query.eq("property_type", propertyType as PropertyType);
  }

  if (listingType && listingType !== "ALL") {
    query = query.eq("listing_type", listingType as ListingType);
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status as PropertyStatus);
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
  const typedData = data as unknown as JoinedPropertyRow[];

  const tableData = typedData.map((p: JoinedPropertyRow) => {
    // 🛡️ Find cover image (Already structured in JSONB)
    const mainImage = getCoverImage(p.images);

    return {
      id: p.id,
      title: p.title,
      price: p.price || p.original_price,
      rental_price: p.rental_price || p.original_rental_price,
      status: p.status,
      property_type: p.property_type,
      listing_type: p.listing_type,
      main_image_url: mainImage,
      tenant_name: p.tenants?.name || "Unknown Branch",
      created_at: p.created_at,
    };
  });

  return { tableData, count: count || 0 };
}

/**
 * Get dynamic counts for all inventory filter options
 * 🛡️ Elite Aggregation Logic
 */
interface AggregationRow {
  property_type: string | null;
  status: string | null;
  listing_type: string | null;
  tenant_id: string | null;
}

export async function getGlobalInventoryFilterCountsAction(): Promise<InventoryFilterCounts> {
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  // 🛡️ Fetch only necessary columns for all non-deleted properties
  const { data, error } = await supabase
    .from("properties")
    .select("property_type, status, listing_type, tenant_id")
    .is("deleted_at", null);

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
