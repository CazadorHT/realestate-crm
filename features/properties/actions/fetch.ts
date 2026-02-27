  "use server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyRow, PropertyWithImages } from "../types";

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (propErr) throw propErr;

    // ✅ กันอ่านของคนอื่น
    assertAuthenticated({
      userId: user.id,
      role,
    });

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
  if (!tenantId) throw new Error("Tenant ID is required but missing");

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        storage_path,
        is_cover,
        sort_order,
        created_at
      ),
      property_agents (
        agent_id
      ),
      property_features (
        feature_id
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) throw error;

  const property = data as unknown as PropertyWithImages;

  if (property.property_images) {
    property.property_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return property;
}

/**
 * Get all popular areas from database
 */
export async function getPopularAreasAction(
  params: { onlyActive?: boolean } = { onlyActive: true },
) {
  // Allow public access (no auth required)
  const supabase = await createAdminClient();

  const { data: allAreas, error } = await supabase
    .from("popular_areas")
    .select("name, name_cn, name_en")
    .order("name");

  if (error) {
    console.error("getPopularAreasAction error:", error);
    return [];
  }

  // If we want ALL areas (for Admin/Form), return everything
  if (params.onlyActive === false) {
    return allAreas.map((item) => item.name);
  }

  // Check which areas actually have active properties
  const { data: activeProps } = await supabase
    .from("properties")
    .select("popular_area")
    .eq("status", "ACTIVE")
    .not("popular_area", "is", null);

  const activeSet = new Set((activeProps || []).map((p) => p.popular_area));

  // Return intersection
  return allAreas
    .filter((area) => activeSet.has(area.name))
    .map((item) => ({
      name: item.name,
      name_en: item.name_en,
      name_cn: item.name_cn,
    }));
}

/**
 * Add a new popular area to the database
 */
export async function addPopularAreaAction(data: {
  name: string;
  name_en?: string;
  name_cn?: string;
}) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  if (!data.name || data.name.trim() === "") {
    return { success: false, message: "กรุณาระบุชื่อย่าน" };
  }

  const { error } = await supabase.from("popular_areas").insert({
    name: data.name.trim(),
    name_en: data.name_en?.trim() || null,
    name_cn: data.name_cn?.trim() || null,
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
 * Get global properties for administration (cross-tenant)
 */
export async function getGlobalPropertiesTableDataAction(params: {
  page?: number;
  q?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  targetTenantId?: string;
}): Promise<{
  tableData: any[];
  count: number;
}> {
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  const {
    page = 1,
    q,
    propertyType,
    listingType,
    status,
    targetTenantId,
  } = params;
  const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("properties")
    .select("*, tenants(name)", { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (propertyType && propertyType !== "ALL") {
    query = query.eq("property_type", propertyType as any);
  }

  if (listingType && listingType !== "ALL") {
    query = query.eq("listing_type", listingType as any);
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status as any);
  }

  if (targetTenantId && targetTenantId !== "ALL") {
    query = query.eq("tenant_id", targetTenantId);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    if (error)
      console.error("getGlobalPropertiesTableDataAction error:", error);
    return { tableData: [], count: 0 };
  }

  const tableData = data.map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price || p.original_price,
    rental_price: p.rental_price || p.original_rental_price,
    status: p.status,
    property_type: p.property_type,
    listing_type: p.listing_type,
    tenant_name: (p.tenants as any)?.name || "Unknown Branch",
    created_at: p.created_at,
  }));

  return { tableData, count: count || 0 };
}
