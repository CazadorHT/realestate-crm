import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RevenueChartData, FunnelData, PipelineData } from "./types";
import { Database } from "@/lib/database.types.generated";

type PropertyRow = Database["public"]["Tables"]["properties_core"]["Row"];
type LeadRow = Database["public"]["Tables"]["crm_leads_v3"]["Row"];
type LedgerRow = Database["public"]["Tables"]["financial_ledger_v3"]["Row"];

async function calculateDateRange(range?: string) {
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

    // 🛡️ RBAC: Only fallback to profileTenantId if NOT an admin selecting "ALL"
    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("tenant_members_v3")
          .select("role, tenant_id")
          .eq("identity_id", user.id)
          .limit(1)
          .maybeSingle();
        
        const isAdmin = member?.role === "ADMIN" || member?.role === "MANAGER" || member?.role === "OWNER";
        const profileTenantId = member?.tenant_id || null;
        
        if (!isAdmin && profileTenantId) {
          activeTenantId = profileTenantId;
        }
      }
    }

    let revCurQuery = supabase.from("properties_core").select("sale_price, rent_price, status").in("status", [3, 4, 5]).is("deleted_at", null);
    let leadsCurQuery = supabase.from("crm_leads_v3").select("id", { count: "exact", head: true });
    let commissionDealsQuery = supabase.from("financial_ledger_v3").select("amount_total, created_at").eq("transaction_type", "deal_closed");
    
    if (range !== "all" && range !== "ALL" && startDate) {
      revCurQuery = revCurQuery.gte("updated_at", startDate);
      leadsCurQuery = leadsCurQuery.gte("created_at", startDate);
      // We don't filter deals here by date yet to avoid missing null closed_at, 
      // we will filter them in memory after fetching
      if (endDate) {
        revCurQuery = revCurQuery.lte("updated_at", endDate);
        leadsCurQuery = leadsCurQuery.lte("created_at", endDate);
      }
    }

    const [
      { data: revenueCurrent },
      { count: leadsCurrent },
      { data: commissionDealsRaw }
    ] = await Promise.all([
      revCurQuery, leadsCurQuery, commissionDealsQuery
    ]);

    // Filter deals in memory to handle fallback date (created_at)
    const commissionDeals = (commissionDealsRaw || []).filter((d: LedgerRow) => {
      if (range === "all" || range === "ALL" || !startDate) return true;
      const dealDate = d.created_at;
      const start = new Date(startDate).getTime();
      const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
      const current = new Date(dealDate).getTime();
      return current >= start && (endDate ? current <= end : true);
    });

    // status 3 = under contract/reserved, 4 = SOLD, 5 = RENTED
    const totalRevenueCurrent = (revenueCurrent || []).reduce((sum: number, p: Partial<PropertyRow>) => sum + ([3, 4, 5].includes(p.status as number) ? (Number(p.sale_price) || Number(p.rent_price) || 0) : 0), 0);
    const totalCommission = (commissionDeals || []).reduce((sum: number, d: Partial<LedgerRow>) => sum + (Number(d.amount_total) || 0), 0);
    const dealsWon = (commissionDeals || []).length;

    return {
      revenueThisMonth: totalCommission,
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

export interface DashboardQueryArgs {
  tenantId?: string | null;
  agentId?: string | null;
  view?: string;
  targetId?: string | null;
  range?: string;
}

export async function getRevenueChartData(args: DashboardQueryArgs): Promise<RevenueChartData[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const { start: startDate, end: endDate } = await calculateDateRange(args.range || "month");
    
    // 🗓️ For "all" range, we want to show a longer history (e.g., 12 months) 
    // or start from the beginning of time if we don't have a specific start date.
    const isAllRange = args.range === "all" || args.range === "ALL";
    const fallbackMonths = isAllRange ? 11 : 5; // Show 12 months for "all", 6 months otherwise
    const fallbackStart = new Date(now.getFullYear(), now.getMonth() - fallbackMonths, 1).toISOString();
    const actualStart = startDate || (isAllRange ? null : fallbackStart);

    let activeTenantId = (args.view === "branch" && args.targetId && args.targetId.toUpperCase() !== "ALL") 
      ? args.targetId 
      : (!args.tenantId || args.tenantId.toUpperCase() === "ALL" ? null : args.tenantId);

    // 🛡️ RBAC: Only fallback to profileTenantId if NOT an admin selecting "ALL"
    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("tenant_members_v3")
          .select("role, tenant_id")
          .eq("identity_id", user.id)
          .limit(1)
          .maybeSingle();
        
        const isAdmin = member?.role === "ADMIN" || member?.role === "MANAGER" || member?.role === "OWNER";
        const profileTenantId = member?.tenant_id || null;
        
        if (!isAdmin && profileTenantId) {
          activeTenantId = profileTenantId;
        }
      }
    }

    let query = supabase.from("financial_ledger_v3")
      .select("amount_total, status, created_at")
      .eq("transaction_type", "deal_closed");

    // We will filter by date in memory to support fallback
    if (activeTenantId) query = query.eq("tenant_id", activeTenantId);

    const { data: rawData } = await query;

    // Filter by date in memory to handle fallback (created_at)
    const data = (rawData || []).filter((d: LedgerRow) => {
      if (isAllRange || !actualStart) return true;
      const dealDate = d.created_at;
      const start = new Date(actualStart).getTime();
      const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
      const current = new Date(dealDate).getTime();
      return current >= start && (endDate ? current <= end : true);
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const grouped = new Map<string, number>();
    
    // 🏷️ Determine labels and start date based on data and range
    const isDaily = args.range === "week" || args.range === "month" || args.range === "today";
    const chartStartDate = actualStart ? new Date(actualStart) : null;
    
    // For "all" range, we want to ensure the most recent months are shown.
    // We'll generate labels for the last X months leading up to now.
    const maxPoints = isDaily ? 35 : (isAllRange ? 24 : 12);
    const labelList: string[] = [];
    let temp = new Date(now.getFullYear(), now.getMonth(), isDaily ? now.getDate() : 1);
    
    for (let i = 0; i < maxPoints; i++) {
      let label = "";
      if (isDaily) {
        const isToday = temp.getDate() === now.getDate() && 
                        temp.getMonth() === now.getMonth() && 
                        temp.getFullYear() === now.getFullYear();
        label = `${temp.getDate()}/${temp.getMonth() + 1}${isToday ? " (วันนี้)" : ""}`;
      } else {
        label = `${months[temp.getMonth()]} ${temp.getFullYear().toString().slice(2)}`;
      }
      
      labelList.push(label);
      grouped.set(label, 0);
      
      if (isDaily) temp.setDate(temp.getDate() - 1);
      else temp.setMonth(temp.getMonth() - 1);

      // If we have a startDate and we've reached it, we can stop (unless we want to fill the chart)
      if (chartStartDate && temp < chartStartDate && !isAllRange) break;
    }

    // Reverse the labels so they go from past to present
    const sortedLabels = labelList.reverse();

    const todayLabel = `${now.getDate()}/${now.getMonth() + 1} (วันนี้)`;

    (data || []).forEach((d: LedgerRow) => {
      const date = new Date(d.created_at);
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
        const val = Number(d.amount_total) || 0;
        grouped.set(label, (grouped.get(label) || 0) + val);
      }
    });

    return sortedLabels.map(name => ({ name, total: grouped.get(name) || 0 }));
  } catch (error) { console.error("getRevenueChartData Error:", error); return []; }
}

export const getRevenueChartDataAction = getRevenueChartData;

export async function getFunnelStats(args: DashboardQueryArgs): Promise<FunnelData[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("crm_leads_v3").select("stage, created_at");
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

    // 🛡️ RBAC: Only fallback to profileTenantId if NOT an admin selecting "ALL"
    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("tenant_members_v3")
          .select("role, tenant_id")
          .eq("identity_id", user.id)
          .limit(1)
          .maybeSingle();
        
        const isAdmin = member?.role === "ADMIN" || member?.role === "MANAGER" || member?.role === "OWNER";
        const profileTenantId = member?.tenant_id || null;
        
        if (!isAdmin && profileTenantId) {
          activeTenantId = profileTenantId;
        }
      }
    }

    let dealsQuery = supabase.from("crm_deals_v3").select("status, created_at").eq("status", "CLOSED_WIN");
    
    if (args.range !== "all" && args.range !== "ALL" && startDate) {
      dealsQuery = dealsQuery.gte("created_at", startDate);
      if (endDate) {
        dealsQuery = dealsQuery.lte("created_at", endDate);
      }
    }

    if (activeTenantId) {
      query = query.eq("tenant_id", activeTenantId);
      dealsQuery = dealsQuery.eq("tenant_id", activeTenantId);
    }

    const [
      { data: leads, error: leadErr },
      { data: deals, error: dealErr }
    ] = await Promise.all([query, dealsQuery]);

    if (leadErr) {
      console.error("getFunnelStats Leads DB Error:", leadErr.message);
      return [];
    }
    if (dealErr) {
      console.error("getFunnelStats Deals DB Error:", dealErr.message);
    }
    
    const counts = { NEW: 0, CONTACTED: 0, VIEWED: 0, NEGOTIATING: 0, CLOSED: 0 };

    (leads || []).forEach((l: Partial<LeadRow>) => {
      const stage = (l.stage || "").toUpperCase();
      if (stage === "NEW" || stage === "AWARENESS" || stage === "CONSIDERATION") counts.NEW++;
      else if (stage === "CONTACTED") counts.CONTACTED++;
      else if (stage === "VIEWED") counts.VIEWED++;
      else if (stage === "NEGOTIATING") counts.NEGOTIATING++;
      else if (stage === "CLOSED" || stage === "SOLD" || stage === "WON") counts.CLOSED++;
    });

    // Add successfully won deals to CLOSED count
    counts.CLOSED += (deals || []).length;

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

export async function getPipelineStats(args: DashboardQueryArgs): Promise<PipelineData[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("properties_core").select("id, status, updated_at");
    const { start: startDate, end: endDate } = await calculateDateRange(args.range);

    let activeTenantId = (args.view === "branch" && args.targetId && args.targetId.toUpperCase() !== "ALL") 
      ? args.targetId 
      : (!args.tenantId || args.tenantId.toUpperCase() === "ALL" ? null : args.tenantId);

    // 🛡️ RBAC: Only fallback to profileTenantId if NOT an admin selecting "ALL"
    if (!activeTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from("tenant_members_v3")
          .select("role, tenant_id")
          .eq("identity_id", user.id)
          .limit(1)
          .maybeSingle();
        
        const isAdmin = member?.role === "ADMIN" || member?.role === "MANAGER" || member?.role === "OWNER";
        const profileTenantId = member?.tenant_id || null;
        
        if (!isAdmin && profileTenantId) {
          activeTenantId = profileTenantId;
        }
      }
    }

    if (activeTenantId) query = query.eq("tenant_id", activeTenantId);

    let dealsQuery = supabase.from("crm_deals_v3").select("status, property_id, updated_at").in("status", ["SIGNED", "CLOSED_WIN"]);
    
    if (args.range !== "all" && args.range !== "ALL" && startDate) {
      dealsQuery = dealsQuery.gte("created_at", startDate);
      if (endDate) {
        dealsQuery = dealsQuery.lte("created_at", endDate);
      }
    }

    if (activeTenantId) {
      query = query.eq("tenant_id", activeTenantId);
      dealsQuery = dealsQuery.eq("tenant_id", activeTenantId);
    }

    const [
      { data: properties, error: propErr },
      { data: deals, error: dealErr }
    ] = await Promise.all([query, dealsQuery]);

    if (propErr) {
      console.error("getPipelineStats Properties DB Error:", propErr.message);
      return [];
    }
    if (dealErr) {
      console.error("getPipelineStats Deals DB Error:", dealErr.message);
    }

    const counts = { ACTIVE: 0, UNDER_OFFER: 0, RESERVED: 0, SOLD: 0 };
    
    // Create mapping of deal statuses by property_id
    const dealStatusMap = new Map<string, string>();
    (deals || []).forEach((d: any) => {
      if (d.property_id) {
        // CLOSED_WIN takes precedence over SIGNED
        const current = dealStatusMap.get(d.property_id);
        if (d.status === "CLOSED_WIN" || !current) {
          dealStatusMap.set(d.property_id, d.status);
        }
      }
    });

    (properties || []).forEach((p: any) => {
      const dealStatus = dealStatusMap.get(p.id);
      const isSold = p.status === 4 || p.status === 5 || dealStatus === "CLOSED_WIN";
      const isReserved = p.status === 3 || dealStatus === "SIGNED";
      
      if (isSold) {
        if (args.range !== "all" && args.range !== "ALL" && startDate) {
          const dealDate = p.updated_at;
          if (dealDate) {
            const start = new Date(startDate).getTime();
            const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
            const current = new Date(dealDate).getTime();
            if (current >= start && (endDate ? current <= end : true)) {
              counts.SOLD++;
            }
          }
        } else {
          counts.SOLD++;
        }
      }
      else if (isReserved) counts.RESERVED++;
      else if (p.status === 2) counts.UNDER_OFFER++;
      else if (p.status === 1) counts.ACTIVE++;
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
