import { requireAuthContext, assertStaff } from "@/lib/authz";
import { differenceInMonths } from "date-fns";
import { Deal, DealStatus, DealType, DealStats, DealWithProperty, JoinedDealRow } from "./types";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { Database } from "@/lib/database.types.generated";
import { decrypt } from "@/lib/crypto";

type ListArgs = {
  q?: string;
  property_id?: string;
  lead_id?: string;
  status?: DealStatus;
  deal_type?: DealType;
  property_type?: string;
  listing_type?: string;
  page?: number;
  pageSize?: number;
  order?: "created_at" | "transaction_date" | "commission_amount" | "updated_at";
  ascending?: boolean;
  timeRange?: string;
};

// The joined result structure is now strictly inferred via Proxy architecture.

export async function getDeals({
  q = "",
  property_id,
  lead_id,
  status,
  deal_type,
  property_type,
  listing_type,
  page = 1,
  pageSize = 20,
  order = "created_at",
  ascending = false,
  timeRange = "all",
}: ListArgs = {}) {
  const { supabase, role, tenantId, user } = await requireAuthContext();
  assertStaff(role);
  const trimmed = (q || "").toString().trim();
  const validPage = typeof page === "number" && !isNaN(page) ? page : 1;
  const validPageSize = typeof pageSize === "number" && !isNaN(pageSize) ? pageSize : 20;
  const pageSafe = Math.max(1, validPage);
  const size = Math.min(100, Math.max(5, validPageSize));

  const scoped = getScopedRevenueClient(supabase, tenantId);

  let query = scoped.deals().select(
      `
      *,
      property:properties!crm_deals_v3_property_id_fkey!inner ( id, title, listing_type, property_type, price, original_price, rental_price, original_rental_price, deleted_at, province, district, popular_area, property_images:property_media_v3 ( id, property_id, url, is_cover, sort_order ) ),
      lead:crm_leads_v3 ( id, stage, identity:identities_v3!crm_leads_v3_identity_id_fkey ( display_name, email, phone ) ),
      commissions:crm_deal_commissions_v3 ( recipient_role, amount )
    `,
      { count: "exact" },
    );

  if (role === "AGENT") {
    query = query.or(`agent_id.eq.${user.id},created_by.eq.${user.id}`);
  }

  // Branch isolation is already handled by getScopedRevenueClient

  // Time Range filtering
  if (timeRange && timeRange !== "all") {
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (timeRange === "this-month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (timeRange === "6-months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
    } else if (timeRange === "1-year") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
    } else if (timeRange === "q1") {
      startDate = new Date(currentYear, 0, 1).toISOString();
      endDate = new Date(currentYear, 2, 31, 23, 59, 59).toISOString();
    } else if (timeRange === "q2") {
      startDate = new Date(currentYear, 3, 1).toISOString();
      endDate = new Date(currentYear, 5, 30, 23, 59, 59).toISOString();
    } else if (timeRange === "q3") {
      startDate = new Date(currentYear, 6, 1).toISOString();
      endDate = new Date(currentYear, 8, 30, 23, 59, 59).toISOString();
    } else if (timeRange === "q4") {
      startDate = new Date(currentYear, 9, 1).toISOString();
      endDate = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();
    }

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
  }

  query = query
    .is("property.deleted_at", null)
    .order(order === "commission_amount" ? "commission_total" : order, { ascending });

  if (trimmed) {
    // search property title or lead name
    query = query.or(
      `property.title.ilike.%${trimmed}%,lead.full_name.ilike.%${trimmed}%,id.eq.${trimmed}`,
    );
  }

  if (property_id) query = query.eq("property_id", property_id);
  if (lead_id) query = query.eq("lead_id", lead_id);
  if (status) query = query.eq("status", status);
  if (deal_type) query = query.eq("deal_type", deal_type);
  if (listing_type) query = query.eq("property.listing_type", listing_type);
  if (property_type) query = query.eq("property.property_type", property_type);

  const from = (pageSafe - 1) * size;
  const to = from + size - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("getDeals error:", error.message, "details:", error.details, "hint:", error.hint);
    return { data: [], count: 0, page: pageSafe, pageSize: size };
  }

  // Use the strictly typed JoinedDealRow
  let finalData = (data as unknown as JoinedDealRow[]) ?? [];
  let finalCount = count ?? 0;

  if (trimmed && (finalData.length === 0 || finalCount === 0)) {
    try {
      const propQuery = supabase
        .from("properties")
        .select("id")
        .ilike("title", `%${trimmed}%`);
      
      if (tenantId) propQuery.eq("tenant_id", tenantId);
      const propRes = await propQuery;

      let allLeadsQuery = supabase
        .from("crm_leads_v3")
        .select("id, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name)");
      
      if (tenantId && tenantId !== "ALL") {
        allLeadsQuery = allLeadsQuery.eq("tenant_id", tenantId);
      }
      const { data: allLeads } = await allLeadsQuery;

      const leadIds = (allLeads || [])
        .filter((l: any) => {
          const decryptedName = decrypt(l.identity?.display_name) || "";
          return decryptedName.toLowerCase().includes(trimmed.toLowerCase());
        })
        .map((l) => l.id);

      const propIds = (propRes.data ?? []).map((p) => p.id);

      // Build a new deals query scoped by found property/lead ids (if any)
      if (
        propIds.length > 0 ||
        leadIds.length > 0 ||
        /^[0-9a-fA-F-]{36}$/.test(trimmed)
      ) {
        let q2 = scoped
          .deals()
          .select(
            `
      *,
      property:properties!crm_deals_v3_property_id_fkey!inner ( id, title, listing_type, property_type, price, original_price, rental_price, original_rental_price, deleted_at, province, district, popular_area, property_images:property_media_v3 ( id, property_id, url, is_cover, sort_order ) ),
      lead:crm_leads_v3 ( id, stage, identity:identities_v3!crm_leads_v3_identity_id_fkey ( display_name, email, phone ) ),
      commissions:crm_deal_commissions_v3 ( recipient_role, amount )
    `,
            { count: "exact" },
          )
          .is("property.deleted_at", null)
          .order(order === "commission_amount" ? "commission_total" : order, { ascending });

        if (propIds.length > 0) q2 = q2.in("property_id", propIds);
        if (leadIds.length > 0) q2 = q2.in("lead_id", leadIds);
        if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) q2 = q2.eq("id", trimmed);

        const { data: d2, count: c2 } = await q2.range(from, to);
        finalData = (d2 as unknown as JoinedDealRow[]) ?? [];
        finalCount = c2 ?? 0;
      }
    } catch (e) {
      // ignore fallback errors, we'll return original empty result
      console.warn("getDeals fallback search failed:", e);
    }
  }

  // normalize property to include `images` for the DealWithProperty view model
  const normalized: DealWithProperty[] = finalData.map((d) => {
    // Transform property structure if it exists
    const property = d.property
      ? {
          id: d.property.id,
          title: d.property.title,
          price: d.property.price,

          original_price: d.property.original_price,
          rental_price: d.property.rental_price,
          original_rental_price: d.property.original_rental_price,
          province: d.property.province,
          popular_area: d.property.popular_area,
          images: (d.property.property_images || []).map((img: any) => ({
            id: img.id,
            property_id: img.property_id,
            image_url: img.url,
            is_cover: img.is_cover,
            sort_order: img.sort_order,
          })),
        }
      : null;

    // Calculate duration_months for RENT deals
    let duration_months: number | undefined | null = undefined;
    if (
      d.deal_type === "RENT" &&
      d.transaction_date &&
      d.transaction_end_date
    ) {
      duration_months = differenceInMonths(
        new Date(d.transaction_end_date),
        new Date(d.transaction_date),
      );
    }

    // Calculate net commission (gross - co-agent splits)
    const gross = Number(d.commission_total) || 0;
    const coAgentSum = ((d as any).commissions || [])
      .filter((c: any) => c.recipient_role === "CO_AGENT")
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const netCommission = gross - coAgentSum;

    // Return the correctly typed shape
    const leadObj = d.lead as any;
    const decryptedName = leadObj ? (decrypt(leadObj.identity?.display_name) || "Unknown Lead") : null;
    const decryptedEmail = leadObj ? (decrypt(leadObj.identity?.email) || null) : null;
    const decryptedPhone = leadObj ? (decrypt(leadObj.identity?.phone) || null) : null;

    return {
      ...d,
      property,
      lead: leadObj ? { 
        id: leadObj.id, 
        display_name: decryptedName,
        full_name: decryptedName,
        email: decryptedEmail,
        phone: decryptedPhone,
        stage: leadObj.stage || null,
      } : null,
      duration_months,
      commission_net: netCommission,
      commission_amount: netCommission,
    } as any;
  });

  return {
    data: normalized,
    count: finalCount,
    page: pageSafe,
    pageSize: size,
  };
}

/**
 * Fetch all deal IDs matching filters
 */
export async function getAllDealIdsQuery({
  timeRange = "all",
  q = "",
  status,
  property_id,
  lead_id,
  deal_type,
  property_type,
  listing_type,
}: {
  timeRange?: string;
  q?: string;
  status?: DealStatus;
  property_id?: string;
  lead_id?: string;
  deal_type?: DealType;
  property_type?: string;
  listing_type?: string;
} = {}) {
  const { supabase, tenantId } = await requireAuthContext();

  const scoped = getScopedRevenueClient(supabase, tenantId);
  let query = scoped.deals().select("id");

  // Time Range filtering (same logic as getDeals)
  if (timeRange && timeRange !== "all") {
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (timeRange === "this-month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (timeRange === "6-months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
    } else if (timeRange === "1-year") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
    } else if (timeRange === "q1") {
      startDate = new Date(currentYear, 0, 1).toISOString();
      endDate = new Date(currentYear, 2, 31, 23, 59, 59).toISOString();
    } else if (timeRange === "q2") {
      startDate = new Date(currentYear, 3, 1).toISOString();
      endDate = new Date(currentYear, 5, 30, 23, 59, 59).toISOString();
    } else if (timeRange === "q3") {
      startDate = new Date(currentYear, 6, 1).toISOString();
      endDate = new Date(currentYear, 8, 30, 23, 59, 59).toISOString();
    } else if (timeRange === "q4") {
      startDate = new Date(currentYear, 9, 1).toISOString();
      endDate = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();
    }

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
  }

  // Filters (same as getDeals)
  const trimmed = (q || "").toString().trim();
  if (trimmed) {
    // Note: for simplicity in ID fetch, we only search if it's a UUID or just skip complex join search
    // If we want exact match, we should mirror the search logic precisely
    if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
      query = query.eq("id", trimmed);
    }
  }

  if (status) query = query.eq("status", status);
  if (property_id) query = query.eq("property_id", property_id);
  if (lead_id) query = query.eq("lead_id", lead_id);
  if (deal_type) query = query.eq("deal_type", deal_type);

  // For property filters in ID fetch, we need to join properties
  if (listing_type || property_type) {
    // If we need property-level filtering just for IDs, we filter by the joined relation
    const propFilterQuery = scoped.deals()
      .select("id, property:properties!crm_deals_v3_property_id_fkey!inner(listing_type, property_type)")
      .match({
        ...(listing_type ? { "property.listing_type": listing_type } : {}),
        ...(property_type ? { "property.property_type": property_type } : {}),
      });
    
    const { data: filteredIds } = await propFilterQuery;
    if (filteredIds) {
      query = query.in("id", filteredIds.map((f) => f.id));
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((d) => d.id || "");
}

type DealStatRecord = {
  deal_type: string | null;
  status: string | null;
  commission_total: number | null;
  property: {
    listing_type: string | null;
    property_type: string | null;
  } | null;
};

/**
 * Fetch counts for various deal categories (facets)
 */
export async function getDealStats(): Promise<DealStats | null> {
  const { supabase, tenantId } = await requireAuthContext();

  const scoped = getScopedRevenueClient(supabase, tenantId);
  const query = scoped.deals().select(`
    deal_type, 
    status, 
    commission_total,
    property:properties!crm_deals_v3_property_id_fkey!inner(listing_type, property_type)
  `);

  const { data, error } = await query;
  if (error) {
    console.error("getDealStats error:", error);
    return null;
  }

  const records = (data as unknown as DealStatRecord[]) || [];

  const stats: DealStats = {
    deal_type: {},
    status: {},
    property_type: {},
    listing_type: {},
    total: records.length,
    totalCommission: records
      .filter((d) => d.status === "CLOSED_WIN" && d.commission_total)
      .reduce((sum, d) => sum + (d.commission_total || 0), 0),
    wonDeals: records.filter((d) => d.status === "CLOSED_WIN").length,
    activeDeals: records.filter(
      (d) => d.status === "NEGOTIATING" || d.status === "SIGNED",
    ).length,
    lostDeals: records.filter((d) => d.status === "CLOSED_LOSS").length,
  };

  records.forEach((d) => {
    // Deal Type
    if (d.deal_type) {
      stats.deal_type[d.deal_type] = (stats.deal_type[d.deal_type] || 0) + 1;
    }
    // Status
    if (d.status) {
      stats.status[d.status] = (stats.status[d.status] || 0) + 1;
    }
    // Nested Property Stats
    if (d.property) {
      if (d.property.property_type) {
        stats.property_type[d.property.property_type] =
          (stats.property_type[d.property.property_type] || 0) + 1;
      }
      if (d.property.listing_type) {
        stats.listing_type[d.property.listing_type] =
          (stats.listing_type[d.property.listing_type] || 0) + 1;
      }
    }
  });

  return stats;
}
