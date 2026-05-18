import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";
import { RentalContractWithRelations } from "./types";

/**
 * Fetch rental contracts with optional tenant filtering.
 * Supports "ALL Branches" view for admins.
 */
export async function getContracts({
  tenantId,
  timeRange = "all",
}: {
  tenantId?: string;
  timeRange?: string;
} = {}) {
  const supabase = await createClient();

  let query = supabase.from("crm_deals_v3").select(
    `
      id,
      transaction_date,
      transaction_end_date,
      metadata,
      status,
      tenant_id,
      created_at,
      property:properties (
        id,
        title
      ),
      lead:crm_leads_v3 (
        id,
        identity:identities_v3 (
          display_name,
          phone,
          email
        )
      )
    `,
    { count: "exact" },
  ).eq("deal_type", "RENTAL").neq("status", "TERMINATED");

  // If tenantId is provided and NOT "ALL", filter by it.
  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  // Time Range filtering
  if (timeRange && timeRange !== "all") {
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (timeRange === "this-month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (timeRange === "6-months") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        1,
      ).toISOString();
    } else if (timeRange === "1-year") {
      startDate = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        1,
      ).toISOString();
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

  const { data, error, count } = await query
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("getContracts Error:", error);
    return { data: [], count: 0, error };
  }

  const mappedData: RentalContractWithRelations[] = (data || []).map((row: any) => {
    const meta = (row.metadata || {}) as Record<string, any>;
    const leadData = row.lead;
    const identity = leadData?.identity;

    return {
      id: row.id,
      contract_number: meta.contract_number || `REC-${row.id.slice(0, 6).toUpperCase()}`,
      start_date: row.transaction_date || row.created_at || new Date().toISOString(),
      end_date: row.transaction_end_date || new Date().toISOString(),
      lease_term_months: meta.lease_term_months || null,
      rent_price: meta.rent_price || null,
      deposit_amount: meta.deposit_amount || null,
      created_at: row.created_at,
      deal_id: row.id,
      status: row.status || "ACTIVE",
      tenant_id: row.tenant_id,
      deal: {
        id: row.id,
        property: row.property ? { id: row.property.id, title: row.property.title } : null,
        lead: leadData ? {
          id: leadData.id,
          full_name: identity?.display_name || "Unknown Lead",
          phone: identity?.phone || null,
          email: identity?.email || null,
        } : null,
      },
    };
  });

  return { data: mappedData, count: count || 0, error: null };
}

/**
 * Fetch all contract IDs matching filters
 */
export async function getAllContractIdsQuery({
  timeRange = "all",
}: {
  timeRange?: string;
} = {}) {
  const { supabase, tenantId } = await requireAuthContext();

  let query = supabase.from("crm_deals_v3").select("id").eq("deal_type", "RENTAL").neq("status", "TERMINATED");

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  // Time Range filtering (same logic as getContracts)
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

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((c) => c.id);
}
