import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RevenueChartData, FunnelData, PipelineData } from "./types";
import { Database } from "@/lib/database.types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];

async function calculateDateRange(range: string) {
  const now = new Date();
  let start = new Date();
  const currentYear = now.getFullYear();

  if (range === "all" || !range) return { start: null, end: null };

  let end: Date | null = null;

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (range === "week") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start.setMonth(now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "6months") {
    start.setMonth(now.getMonth() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "q1") {
    start = new Date(currentYear, 0, 1);
    end = new Date(currentYear, 2, 31, 23, 59, 59);
  } else if (range === "q2") {
    start = new Date(currentYear, 3, 1);
    end = new Date(currentYear, 5, 30, 23, 59, 59);
  } else if (range === "q3") {
    start = new Date(currentYear, 6, 1);
    end = new Date(currentYear, 8, 30, 23, 59, 59);
  } else if (range === "q4") {
    start = new Date(currentYear, 9, 1);
    end = new Date(currentYear, 11, 31, 23, 59, 59);
  } else if (range === "year" || range === "ปีนี้") {
    start.setFullYear(currentYear, 0, 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "lastYear") {
    start = new Date(currentYear - 1, 0, 1);
    end = new Date(currentYear - 1, 11, 31, 23, 59, 59);
  } else if (range === "year2024") {
    start = new Date(2024, 0, 1);
    end = new Date(2024, 11, 31, 23, 59, 59);
  } else if (range === "year2023") {
    start = new Date(2023, 0, 1);
    end = new Date(2023, 11, 31, 23, 59, 59);
  } else if (range === "year2022") {
    start = new Date(2022, 0, 1);
    end = new Date(2022, 11, 31, 23, 59, 59);
  } else {
    start.setMonth(now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  }

  return { 
    start: start.toISOString(), 
    end: end ? end.toISOString() : null 
  };
}

export async function getDashboardStats({
  tenantId,
  agentId,
  view = "company",
  targetId = "all",
  range = "month"
}: {
  tenantId?: string | null;
  agentId?: string | null;
  view?: string;
  targetId?: string | null;
  range?: string;
}): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const { start: startDate, end: endDate } = await calculateDateRange(range);
    
    // If tenantId is not provided, try to get it from current profile to ensure RLS compliance
    let activeTenantId = (view === "branch" && targetId && targetId.toUpperCase() !== "ALL") 
      ? targetId 
      : (!tenantId || tenantId.toUpperCase() === "ALL" ? null : tenantId);

    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("team:teams!profiles_team_id_fkey(tenant_id)")
          .eq("id", user.id)
          .single();
        const profileTenantId = (profile as any)?.team?.tenant_id;
        if (profileTenantId) activeTenantId = profileTenantId;
      }
    }

    let revCurQuery = supabase.from("properties").select("price, rental_price, status").in("status", ["SOLD", "RENTED"]).is("deleted_at", null);
    let leadsCurQuery = supabase.from("leads").select("id", { count: "exact", head: true });
    let commissionDealsQuery = supabase.from("deals").select("commission_amount").eq("status", "CLOSED_WIN");
    
    if (range !== "all" && range !== "ALL" && startDate) {
      revCurQuery = revCurQuery.gte("updated_at", startDate);
      leadsCurQuery = leadsCurQuery.gte("created_at", startDate);
      commissionDealsQuery = commissionDealsQuery.gte("created_at", startDate);
      if (endDate) {
        revCurQuery = revCurQuery.lte("updated_at", endDate);
        leadsCurQuery = leadsCurQuery.lte("created_at", endDate);
        commissionDealsQuery = commissionDealsQuery.lte("created_at", endDate);
      }
    }

    if (activeTenantId) {
      revCurQuery = revCurQuery.eq("tenant_id", activeTenantId);
      leadsCurQuery = leadsCurQuery.eq("tenant_id", activeTenantId);
      commissionDealsQuery = commissionDealsQuery.eq("tenant_id", activeTenantId);
    }

    const [
      { data: revenueCurrent },
      { count: leadsCurrent },
      { data: commissionDeals }
    ] = await Promise.all([
      revCurQuery, leadsCurQuery, commissionDealsQuery
    ]);

    const totalRevenueCurrent = (revenueCurrent || []).reduce((sum: number, p: Partial<PropertyRow>) => sum + (p.status === "SOLD" ? (p.price || 0) : (p.rental_price || 0)), 0);
    const totalCommission = (commissionDeals || []).reduce((sum: number, d: Partial<DealRow>) => sum + (d.commission_amount || 0), 0);
    const dealsWon = (commissionDeals || []).length;

    return {
      revenueThisMonth: (view === "personal" || view === "team") ? totalCommission : totalRevenueCurrent,
      revenueChange: "+0%",
      leadsThisMonth: leadsCurrent || 0,
      leadsChange: "+0%",
      leadsTotal: leadsCurrent || 0,
      conversionRate: 0,
      conversionChange: "+0%",
      conversionBase: `จาก ${leadsCurrent} Leads`,
      dealsWon: dealsWon,
      dealsWonChange: "+0",
      dealsTarget: 10,
      totalCommission,
    };
  } catch (error) {
    console.error("getDashboardStats Error:", error);
    return {
      revenueThisMonth: 0, revenueChange: "0%", leadsThisMonth: 0, leadsChange: "0%", leadsTotal: 0,
      conversionRate: 0, conversionChange: "0%", conversionBase: "0 Leads", dealsWon: 0, dealsWonChange: "0",
      dealsTarget: 10, totalCommission: 0,
    };
  }
}

export const getDashboardStatsAction = getDashboardStats;

export async function getRevenueChartData(args: any): Promise<RevenueChartData[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const { start: startDate, end: endDate } = await calculateDateRange(args.range || "month");
    
    // Default to 6 months if range is "all" or "year" to keep chart readable
    const fallbackStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
    const actualStart = startDate || fallbackStart;

    let query = supabase.from("properties")
      .select("price, rental_price, status, updated_at")
      .in("status", ["SOLD", "RENTED"])
      .is("deleted_at", null)
      .gte("updated_at", actualStart);

    if (endDate) {
      query = query.lte("updated_at", endDate);
    }

    let activeTenantId = (args.view === "branch" && args.targetId && args.targetId.toUpperCase() !== "ALL") 
      ? args.targetId 
      : (!args.tenantId || args.tenantId.toUpperCase() === "ALL" ? null : args.tenantId);

    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("team:teams!profiles_team_id_fkey(tenant_id)")
          .eq("id", user.id)
          .single();
        const profileTenantId = (profile as any)?.team?.tenant_id;
        if (profileTenantId) activeTenantId = profileTenantId;
      }
    }

    if (activeTenantId) query = query.eq("tenant_id", activeTenantId);

    const { data } = await query;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = new Map<string, number>();
    
    // 🏷️ Determine labels based on range
    const isDaily = args.range === "week" || args.range === "month" || args.range === "today";
    const startObj = new Date(actualStart);
    let temp = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate());
    
    // Prevent infinite loops and set reasonable limits
    const maxPoints = isDaily ? 35 : 12;
    let points = 0;

    while (temp <= now && points < maxPoints) {
      let label = "";
      if (isDaily) {
        const isToday = temp.getDate() === now.getDate() && 
                        temp.getMonth() === now.getMonth() && 
                        temp.getFullYear() === now.getFullYear();
        label = `${temp.getDate()}/${temp.getMonth() + 1}${isToday ? " (วันนี้)" : ""}`;
      } else {
        label = `${months[temp.getMonth()]} ${temp.getFullYear().toString().slice(2)}`;
      }
      
      grouped.set(label, 0);
      
      if (isDaily) temp.setDate(temp.getDate() + 1);
      else temp.setMonth(temp.getMonth() + 1);
      
      points++;
    }

    const todayLabel = `${now.getDate()}/${now.getMonth() + 1} (วันนี้)`;

    (data || []).forEach((p: Partial<PropertyRow>) => {
      const date = new Date(p.updated_at!);
      let label = "";
      if (isDaily) {
        const isToday = date.getDate() === now.getDate() && 
                        date.getMonth() === now.getMonth() && 
                        date.getFullYear() === now.getFullYear();
        label = isToday ? todayLabel : `${date.getDate()}/${date.getMonth() + 1}`;
      } else {
        label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
      }
      
      if (grouped.has(label)) {
        const val = p.status === "SOLD" ? (p.price || 0) : (p.rental_price || 0);
        grouped.set(label, (grouped.get(label) || 0) + val);
      }
    });

    return Array.from(grouped.entries()).map(([name, total]) => ({ name, total }));
  } catch (error) { console.error("getRevenueChartData Error:", error); return []; }
}

export const getRevenueChartDataAction = getRevenueChartData;

export async function getFunnelStats(args: any): Promise<FunnelData[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("leads").select("stage, created_at");
    const { start: startDate, end: endDate } = await calculateDateRange(args.range);
    
    if (args.range !== "all" && args.range !== "ALL" && startDate) {
      query = query.gte("created_at", startDate);
      if (endDate) {
        query = query.lte("created_at", endDate);
      }
    }

    let activeTenantId = (args.view === "branch" && args.targetId && args.targetId.toUpperCase() !== "ALL") 
      ? args.targetId 
      : (!args.tenantId || args.tenantId.toUpperCase() === "ALL" ? null : args.tenantId);

    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("team:teams!profiles_team_id_fkey(tenant_id)")
          .eq("id", user.id)
          .single();
        const profileTenantId = (profile as any)?.team?.tenant_id;
        if (profileTenantId) activeTenantId = profileTenantId;
      }
    }

    if (activeTenantId) query = query.eq("tenant_id", activeTenantId);

    const { data: leads, error } = await query;

    if (error) {
      console.error("getFunnelStats DB Error:", error.message);
      return [];
    }
    
    const counts = { NEW: 0, CONTACTED: 0, VIEWED: 0, NEGOTIATING: 0, CLOSED: 0 };

    (leads || []).forEach((l: Partial<LeadRow>) => {
      const stage = (l.stage || "").toUpperCase();
      if (stage === "NEW" || stage === "LEAD") counts.NEW++;
      else if (stage === "CONTACTED") counts.CONTACTED++;
      else if (stage === "VIEWED") counts.VIEWED++;
      else if (stage === "NEGOTIATING") counts.NEGOTIATING++;
      else if (stage === "CLOSED" || stage === "SOLD") counts.CLOSED++;
    });

    return [
      { step: "Lead", count: counts.NEW + counts.CONTACTED + counts.VIEWED + counts.NEGOTIATING + counts.CLOSED, fill: "#94a3b8" },
      { step: "Contacted", count: counts.CONTACTED + counts.VIEWED + counts.NEGOTIATING + counts.CLOSED, fill: "#60a5fa" },
      { step: "Viewed", count: counts.VIEWED + counts.NEGOTIATING + counts.CLOSED, fill: "#818cf8" },
      { step: "Negotiating", count: counts.NEGOTIATING + counts.CLOSED, fill: "#f472b6" },
      { step: "Closed", count: counts.CLOSED, fill: "#4ade80" },
    ];
  } catch (error) { console.error("getFunnelStats Error:", error); return []; }
}

export const getFunnelStatsAction = getFunnelStats;

export async function getPipelineStats(args: any): Promise<PipelineData[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("properties").select("status, updated_at").is("deleted_at", null);
    const { start: startDate, end: endDate } = await calculateDateRange(args.range);

    if (args.range !== "all" && args.range !== "ALL" && startDate) {
      query = query.gte("updated_at", startDate);
      if (endDate) {
        query = query.lte("updated_at", endDate);
      }
    }

    const activeTenantId = (args.view === "branch" && args.targetId && args.targetId.toUpperCase() !== "ALL") 
      ? args.targetId 
      : (!args.tenantId || args.tenantId.toUpperCase() === "ALL" ? null : args.tenantId);

    if (activeTenantId) query = query.eq("tenant_id", activeTenantId);

    const { data: properties } = await query;
    const counts = { ACTIVE: 0, UNDER_OFFER: 0, RESERVED: 0, SOLD: 0 };
    (properties || []).forEach((p: Partial<PropertyRow>) => {
      if (p.status === "ACTIVE") counts.ACTIVE++;
      if (p.status === "UNDER_OFFER") counts.UNDER_OFFER++;
      if (p.status === "RESERVED") counts.RESERVED++;
      if (p.status === "SOLD" || p.status === "RENTED") counts.SOLD++;
    });

    return [
      { stage: "ACTIVE", count: counts.ACTIVE, color: "bg-blue-500", label: "ประกาศขาย" },
      { stage: "OFFER", count: counts.UNDER_OFFER, color: "bg-orange-500", label: "มีข้อเสนอ" },
      { stage: "RESERVED", count: counts.RESERVED, color: "bg-purple-500", label: "จองแล้ว" },
      { stage: "SOLD", count: counts.SOLD, color: "bg-emerald-500", label: "ปิดการขาย" },
    ];
  } catch (error) { console.error("getPipelineStats Error:", error); return []; }
}

export const getPipelineStatsAction = getPipelineStats;
