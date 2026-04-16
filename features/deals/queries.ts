import { requireAuthContext, assertStaff } from "@/lib/authz";
import { DealWithProperty, DealCommission } from "./types";
import { getScopedRevenueClient } from "./logic/scoped-client";

export async function getDealsByLeadId(
  leadId: string,
): Promise<DealWithProperty[]> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  // Fetch deals and join with properties (select title, price, etc.)
  const { data, error } = await scoped
    .deals()
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        original_price,
        rental_price,
        original_rental_price,
        images:property_images(image_url, is_cover)
      )
    `,
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    return [];
  }

  return (data || []) as DealWithProperty[];
}

export async function getDealById(
  dealId: string,
): Promise<DealWithProperty | null> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  const { data, error } = await scoped
    .deals()
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        original_price,
        rental_price,
        original_rental_price,
        images:property_images(image_url, is_cover)
      ),
      lead:leads (
        id,
        full_name,
        email,
        phone,
        stage
      )
    `,
    )
    .eq("id", dealId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as DealWithProperty;
}

export async function getDealCommissions(dealId: string): Promise<DealCommission[]> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  const { data, error } = await scoped
    .commissions()
    .select(
      `
      *,
      agent:profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching deal commissions:", error);
    return [];
  }

  return (data || []) as DealCommission[];
}

export async function getDealsPageStats(timeRange: string = "all") {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);
  let query = scoped.deals().select("status, commission_amount, deal_type, created_at");

  // Handle Time Range
  const now = new Date();
  const currentYear = now.getFullYear();

  if (timeRange !== "all") {
    let startDate: string | null = null;
    let endDate: string | null = null;
    // ... logic remains same ...
    if (timeRange === "this-month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (timeRange === "6-months") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        1,
      ).toISOString();
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

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching deals page stats:", error);
    return {
      totalDeals: 0,
      activeDeals: 0,
      wonDeals: 0,
      lostDeals: 0,
      totalCommission: 0,
    };
  }

  const stats = {
    totalDeals: data.length,
    activeDeals: data.filter(
      (d) => d.status === "NEGOTIATING" || d.status === "SIGNED",
    ).length,
    wonDeals: data.filter((d) => d.status === "CLOSED_WIN").length,
    lostDeals: data.filter((d) => d.status === "CLOSED_LOSS").length,
    totalCommission: data
      .filter((d) => d.status === "CLOSED_WIN" && d.commission_amount)
      .reduce((sum, d) => sum + (d.commission_amount || 0), 0),
  };


  return stats;
}
