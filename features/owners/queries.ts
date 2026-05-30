import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { mapDbError } from "@/lib/db-error";
import type { Owner } from "./types";
import { decrypt } from "@/lib/crypto";

export async function getOwnerById(id: string): Promise<Owner | null> {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("identities_v3")
    .select("id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id")
    .eq("id", id)
    .eq("category", 2);

  if (isMultiTenant && tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error("Error fetching owner:", error);
    return null;
  }

  const social = (data.social_links as Record<string, any>) || {};

  return {
    id: data.id,
    full_name: decrypt(data.display_name) || data.display_name || "",
    full_name_hash: social.full_name_hash || null,
    phone: decrypt(data.phone) || data.phone || null,
    phone_hash: social.phone_hash || null,
    line_id: decrypt(data.line_id) || data.line_id || null,
    facebook_url: decrypt(social.facebook_url) || social.facebook_url || null,
    other_contact: decrypt(social.other_contact) || social.other_contact || null,
    company_name: social.company_name || null,
    owner_type: social.owner_type || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tenant_id: data.tenant_id,
    created_by: social.created_by || null,
  };
}

export async function getOwners(): Promise<Owner[]> {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("identities_v3")
    .select(`
      id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id,
      properties:properties_core!properties_core_owner_id_fkey(count)
    `)
    .eq("category", 2);

  if (isMultiTenant && tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching owners:", error);
    return [];
  }

  return data.map((row: any) => {
    const social = (row.social_links as Record<string, any>) || {};
    const propCount = row.properties?.[0]?.count || 0;

    return {
      id: row.id,
      full_name: decrypt(row.display_name) || row.display_name || "",
      full_name_hash: social.full_name_hash || null,
      phone: decrypt(row.phone) || row.phone || null,
      phone_hash: social.phone_hash || null,
      line_id: decrypt(row.line_id) || row.line_id || null,
      facebook_url: decrypt(social.facebook_url) || social.facebook_url || null,
      other_contact: decrypt(social.other_contact) || social.other_contact || null,
      company_name: social.company_name || null,
      owner_type: social.owner_type || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tenant_id: row.tenant_id,
      created_by: social.created_by || null,
      property_count: propCount,
    };
  });
}

export async function getOwnerProperties(ownerId: string) {
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties_core")
    .select("id, details:properties_details(title, meta_data), property_type, listing_type, sale_price, rent_price, status, created_at, tenant_id")
    .eq("owner_id", ownerId);

  if (isMultiTenant && tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching owner properties:", error);
    return [];
  }

  return data.map((item: any) => {
    const details = item.details as any;
    const titleObj = details?.title || {};
    const titleStr = titleObj.th || titleObj.en || "";
    const metaData = details?.meta_data || {};

    return {
      id: item.id,
      title: titleStr,
      slug: metaData.slug || "",
      property_type: item.property_type,
      listing_type: item.listing_type,
      price: item.sale_price,
      original_price: item.sale_price,
      rental_price: item.rent_price,
      original_rental_price: item.rent_price,
      status: item.status,
      popular_area: metaData.popular_area || null,
      created_at: item.created_at,
      tenant_id: item.tenant_id,
    };
  });
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
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("identities_v3")
    .select("id, display_name, phone, line_id, social_links, created_at, updated_at, tenant_id, properties:properties_core!properties_core_owner_id_fkey(count), tenants:tenants_v3(name)", {
      count: "exact",
    })
    .eq("category", 2);

  if (!isMultiTenant) {
    // Single-tenant
  } else if (allBranches || tenantId === undefined) {
    // Multi-tenant + ALL Branches
  } else if (tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  } else {
    query = query.is("tenant_id", null);
  }

  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%`,
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching owners query:", error);
    throw new Error(mapDbError(error));
  }

  const rawOwners = data || [];
  const creatorIds = Array.from(
    new Set(
      rawOwners
        .map((r: any) => (r.social_links as Record<string, any>)?.created_by)
        .filter(Boolean)
    )
  ) as string[];

  const creatorsMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: creatorsData } = await supabase
      .from("identities_v3")
      .select("id, display_name")
      .in("id", creatorIds);

    (creatorsData || []).forEach((c: any) => {
      creatorsMap[c.id] = decrypt(c.display_name) || c.display_name || "Unknown";
    });
  }

  const owners: Owner[] = rawOwners.map((row: any) => {
    const social = (row.social_links as Record<string, any>) || {};
    const propCount = row.properties?.[0]?.count || 0;
    const creatorId = social.created_by || null;

    return {
      id: row.id,
      full_name: decrypt(row.display_name) || row.display_name || "",
      full_name_hash: social.full_name_hash || null,
      phone: decrypt(row.phone) || row.phone || null,
      phone_hash: social.phone_hash || null,
      line_id: decrypt(row.line_id) || row.line_id || null,
      facebook_url: decrypt(social.facebook_url) || social.facebook_url || null,
      other_contact: decrypt(social.other_contact) || social.other_contact || null,
      company_name: social.company_name || null,
      owner_type: social.owner_type || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tenant_id: row.tenant_id,
      created_by: creatorId,
      created_by_name: creatorId ? (creatorsMap[creatorId] || "ไม่ทราบชื่อผู้สร้าง") : "ไม่ทราบชื่อผู้สร้าง",
      property_count: propCount,
    };
  });

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
    .from("identities_v3")
    .select("id", { count: "exact", head: true })
    .eq("category", 2);

  if (!isMultiTenant) {
    // Single-tenant
  } else if (allBranches || tenantId === undefined) {
    // ALL Branches
  } else if (tenantId) {
    ownersQuery = ownersQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  } else {
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
    .from("identities_v3")
    .select("id", { count: "exact", head: true })
    .eq("category", 2)
    .gte("created_at", startOfMonth);

  if (isMultiTenant) {
    if (allBranches || tenantId === undefined) {
      // ALL
    } else if (tenantId) {
      newOwnersQuery = newOwnersQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    } else {
      newOwnersQuery = newOwnersQuery.is("tenant_id", null);
    }
  }
  const { count: newOwnersMonth } = await newOwnersQuery;

  // 3. Linked Properties
  let propQuery = supabase
    .from("properties_core")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .not("owner_id", "is", null);

  if (!isMultiTenant) {
    // Single-tenant
  } else if (allBranches || tenantId === undefined) {
    // ALL
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
  const { supabase, tenantId } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const q = (args.q ?? "").trim();
  const allBranches = args.allBranches ?? false;

  let query = supabase
    .from("identities_v3")
    .select("id")
    .eq("category", 2);

  if (!isMultiTenant) {
    // Single-tenant
  } else if (allBranches || tenantId === "ALL" || !tenantId) {
    // Multi-tenant + ALL
  } else {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(mapDbError(error));
  return (data || []).map((o) => o.id);
}
