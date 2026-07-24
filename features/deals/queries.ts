import { requireAuthContext, assertStaff } from "@/lib/authz";
import { DealWithProperty, DealCommission, InvoiceRow } from "./types";
import { getScopedRevenueClient } from "./logic/scoped-client";
import { decrypt } from "@/lib/crypto";

export async function getDealsByLeadId(
  leadId: string,
): Promise<DealWithProperty[]> {
  const { supabase, role, tenantId, user } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  // Fetch deals and join with properties (select title, price, etc.)
  let query = scoped
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
        property_images:property_media_v3 (
          id,
          property_id,
          url,
          is_cover,
          sort_order
        )
      ),
      commissions:crm_deal_commissions_v3 ( recipient_role, amount )
    `,
    )
    .eq("lead_id", leadId);

  if (role === "AGENT") {
    query = query.or(`agent_id.eq.${user.id},created_by.eq.${user.id}`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    return [];
  }

  return (data || []).map((d: any) => {
    const gross = Number(d.commission_total) || 0;
    const coAgentSum = (d.commissions || [])
      .filter((c: any) => c.recipient_role === "CO_AGENT")
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const netCommission = gross - coAgentSum;

    const property = d.property ? {
      ...d.property,
      images: (d.property.property_images || []).map((img: any) => ({
        id: img.id,
        property_id: img.property_id,
        image_url: img.url,
        is_cover: img.is_cover,
        sort_order: img.sort_order,
      })),
    } : null;

    return {
      ...d,
      property,
      commission_net: netCommission,
      commission_amount: netCommission,
    };
  }) as any;
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
        property_images:property_media_v3 (
          id,
          property_id,
          url,
          is_cover,
          sort_order
        )
      ),
      lead:crm_leads_v3 (
        id,
        stage,
        identity:identities_v3!crm_leads_v3_identity_id_fkey (
          display_name,
          email,
          phone
        )
      )
    `,
    )
    .eq("id", dealId)
    .single();

  if (error || !data) {
    return null;
  }

  const rawDeal = data as any;
  const lead = rawDeal.lead ? {
    id: rawDeal.lead.id,
    full_name: decrypt(rawDeal.lead.identity?.display_name) || "Unknown Lead",
    email: decrypt(rawDeal.lead.identity?.email) || null,
    phone: decrypt(rawDeal.lead.identity?.phone) || null,
    stage: rawDeal.lead.stage,
  } : null;

  // Map property_images to images (as array of { id, property_id, url, is_cover, sort_order })
  const property = rawDeal.property ? {
    ...rawDeal.property,
    images: (rawDeal.property.property_images || []).map((i: any) => ({
      id: i.id,
      property_id: i.property_id,
      image_url: i.url,
      is_cover: i.is_cover,
      sort_order: i.sort_order,
    })),
  } : null;

  return {
    ...rawDeal,
    lead,
    property,
  } as unknown as DealWithProperty;
}

export async function getDealCommissions(dealId: string): Promise<DealCommission[]> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);

  const { data: rawData, error } = await scoped
    .commissions()
    .select(
      `
      *,
      agent:identities_v3 (
        id,
        display_name,
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

  const data = (rawData || []) as unknown as DealCommission[];
  return data.map((d) => ({
    ...d,
    agent: d.agent ? {
      id: d.agent.id,
      display_name: d.agent.display_name,
      avatar_url: d.agent.avatar_url,
    } : null,
  }));
}

export async function getDealsPageStats(timeRange: string = "all") {
  const { supabase, role, tenantId, user } = await requireAuthContext();
  assertStaff(role);

  const scoped = getScopedRevenueClient(supabase, tenantId);
  let query = scoped.deals().select("id, status, commission_total, deal_type, created_at, commissions:crm_deal_commissions_v3(recipient_role, amount)");

  if (role === "AGENT") {
    query = query.or(`agent_id.eq.${user.id},created_by.eq.${user.id}`);
  }

  // Handle Time Range
  const now = new Date();
  const currentYear = now.getFullYear();

  if (timeRange !== "all") {
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
      netCommission: 0,
    };
  }

  let totalGross = 0;
  let totalNet = 0;
  const rawData = (data || []) as any[];

  rawData.forEach((d) => {
    if (d.status === "CLOSED_WIN") {
      const commissionsList = (d as any).commissions || [];
      const hasAgencyCommission = commissionsList.some(
        (c: any) => c.recipient_role === "AGENCY" && (Number(c.amount) || 0) > 0
      );

      // If splits are defined but none are allocated to the company (AGENCY), skip including this deal's commission in stats
      if (commissionsList.length > 0 && !hasAgencyCommission) {
        return;
      }

      const gross = Number(d.commission_total) || 0;
      const coAgentSum = commissionsList
        .filter((c: any) => c.recipient_role === "CO_AGENT")
        .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
      totalGross += gross;
      totalNet += gross - coAgentSum;
    }
  });

  const stats = {
    totalDeals: rawData.length,
    activeDeals: rawData.filter(
      (d) => d.status === "NEGOTIATING" || d.status === "SIGNED",
    ).length,
    wonDeals: rawData.filter((d) => d.status === "CLOSED_WIN").length,
    lostDeals: rawData.filter((d) => d.status === "CLOSED_LOSS").length,
    totalCommission: totalGross,
    netCommission: totalNet,
  };

  return stats;
}

export async function getInvoicesByDealId(dealId: string): Promise<InvoiceRow[]> {
  const { supabase, tenantId } = await requireAuthContext();
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("deal_id", dealId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch Invoices Error:", error);
    return [];
  }

  return (data || []) as InvoiceRow[];
}

export async function getTenantAgents(): Promise<{ id: string; display_name: string; role: string; avatar_url: string | null }[]> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, role, avatar_url")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching tenant agents:", error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    display_name: p.display_name || p.full_name || "Unnamed Agent",
    role: p.role || "AGENT",
    avatar_url: p.avatar_url,
  }));
}

