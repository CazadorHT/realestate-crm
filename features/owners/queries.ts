import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { mapDbError } from "@/lib/db-error";
import type { Owner } from "./types";

export async function getOwnerById(id: string): Promise<Owner | null> {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("owners")
    .select("id, full_name, full_name_hash, phone, phone_hash, line_id, facebook_url, other_contact, company_name, owner_type, created_at, updated_at, tenant_id, created_by")
    .eq("id", id);

  if (isMultiTenant && tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }
  // Single-tenant: no filter (show all)

  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching owner:", error);
    return null;
  }

  return data;
}

export async function getOwners() {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // Fetch owners with property count
  let query = supabase
    .from("owners")
    .select(
      `
      id, full_name, full_name_hash, phone, phone_hash, line_id, facebook_url, other_contact, company_name, owner_type, created_at, updated_at, tenant_id, created_by,
      properties:properties(count)
    `,
    );

  if (isMultiTenant && tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }
  // Single-tenant: no filter (show all)

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching owners:", error);
    return [];
  }

  type OwnerWithCount = Owner & { properties: { count: number }[] };
  const owners = data as unknown as OwnerWithCount[];

  return owners.map((owner) => ({
    ...owner,
    property_count: owner.properties?.[0]?.count || 0,
  }));
}

export async function getOwnerProperties(ownerId: string) {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select("id, title, slug, property_type, listing_type, price, original_price, rental_price, original_rental_price, status, popular_area, created_at, tenant_id")
    .eq("owner_id", ownerId);

  if (isMultiTenant && tenantId) {
    query = query.eq("tenant_id", tenantId);
  }
  // Single-tenant: no filter

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching owner properties:", error);
    return [];
  }

  return data || [];
}

export type GetOwnersParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  allBranches?: boolean;
};

export async function getOwnersQuery({
  q,
  page = 1,
  pageSize = 10,
  allBranches = false,
}: GetOwnersParams) {
  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("owners")
    .select("id, full_name, full_name_hash, phone, phone_hash, line_id, facebook_url, other_contact, company_name, owner_type, created_at, updated_at, tenant_id, created_by, properties:properties(count), tenants(name)", {
      count: "exact",
    });

  // Visibility Logic:
  if (!isMultiTenant) {
    // Single-tenant: show all owners (no filter)
  } else if (allBranches || (tenantId === undefined)) {
    // Multi-tenant + ALL Branches (global cookie or toggle): show everything
  } else if (tenantId) {
    // Multi-tenant: show branch owners + unassigned
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  } else {
    // Edge case: no tenant context, show only unassigned
    query = query.is("tenant_id", null);
  }

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%`,
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching owners query:", error);
    throw new Error(mapDbError(error));
  }

  type OwnerWithCount = Owner & { properties: { count: number }[] };
  const rawOwners = data as unknown as OwnerWithCount[];

  const owners = rawOwners.map((owner) => ({
    ...owner,
    property_count: owner.properties?.[0]?.count || 0,
  }));

  return {
    data: owners,
    count: count || 0,
    pageSize,
    page,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
  };
}

export async function getOwnersDashboardStatsQuery(allBranches = false) {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // 1. Total Owners
  let ownersQuery = supabase
    .from("owners")
    .select("id", { count: "exact", head: true });

  if (!isMultiTenant) {
    // Single-tenant: show all (no filter)
  } else if (allBranches || (tenantId === undefined)) {
    // ALL Branches: no filter
  } else if (tenantId) {
    ownersQuery = ownersQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  } else {
    // Fallback: only unassigned
    ownersQuery = ownersQuery.is("tenant_id", null);
  }
  const { count: totalOwners } = await ownersQuery;

  // 2. New this month
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  let newOwnersQuery = supabase
    .from("owners")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  if (isMultiTenant) {
    if (allBranches || (tenantId === undefined)) {
      // ALL: no filter
    } else if (tenantId) {
      newOwnersQuery = newOwnersQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    } else {
      newOwnersQuery = newOwnersQuery.is("tenant_id", null);
    }
  }
  const { count: newOwnersMonth } = await newOwnersQuery;

  // 3. Linked Properties
  let propQuery = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .not("owner_id", "is", null);

  if (!isMultiTenant) {
    // Single-tenant: show all linked properties
  } else if (allBranches || (tenantId === undefined)) {
    // ALL: no filter
  } else if (tenantId) {
    propQuery = propQuery.eq("tenant_id", tenantId);
  } else {
    propQuery = propQuery.is("tenant_id", null);
  }

  const { count: totalPropertiesLinked } = await propQuery;

  return {
    totalOwners: totalOwners || 0,
    newOwnersMonth: newOwnersMonth || 0,
    totalPropertiesLinked: totalPropertiesLinked || 0,
  };
}

/**
 * Fetch ONLY IDs of all owners matching the filters (no pagination)
 * Used for "Select All across pages" feature.
 */
export async function getAllOwnerIdsQuery(args: { q?: string; allBranches?: boolean } = {}) {
  const { supabase, role, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const q = (args.q ?? "").trim();
  const allBranches = args.allBranches ?? false;

  let query = supabase.from("owners").select("id");

  // Visibility Logic:
  if (!isMultiTenant) {
    // Single-tenant: show all owners (no filter)
  } else if (allBranches || (tenantId === "ALL") || !tenantId) {
    // Multi-tenant + ALL Branches: show everything
  } else {
    // Multi-tenant: show branch owners + unassigned
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(mapDbError(error));
  return (data || []).map((o) => o.id);
}
