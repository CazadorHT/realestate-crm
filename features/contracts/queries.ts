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

  let query = supabase.from("rental_contracts").select(
    `
      *,
      deal:deals (
        id,
        property:properties (
          id,
          title
        ),
        lead:leads (
          id,
          full_name,
          phone,
          email
        )
      )
    `,
    { count: "exact" },
  );

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
    .order("start_date", { ascending: false })
    .returns<RentalContractWithRelations[]>();

  if (error) {
    console.error("getContracts Error:", error);
    return { data: [], count: 0, error };
  }

  return { data: data || [], count: count || 0, error: null };
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

  let query = supabase.from("rental_contracts").select("id");

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
  return (data || []).map((c: any) => c.id);
}
