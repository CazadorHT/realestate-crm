import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RevenueChartData, FunnelData, PipelineData } from "./types";
import { formatPercent } from "@/lib/utils";

export async function getDashboardStats(tenantId?: string | null): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    
    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).toISOString();
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
    ).toISOString();

    // 1. Revenue (Sold/Rented Properties)
    const { data: revenueCurrent } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("price, rental_price, status, updated_at")
        .in("status", ["SOLD", "RENTED"])
        .is("deleted_at", null)
        .gte("updated_at", startOfMonth),
    );

    const totalRevenueCurrent = (revenueCurrent || []).reduce((sum: number, p: any) => {
      return sum + (p.status === "SOLD" ? (p.price || 0) : (p.rental_price || 0));
    }, 0);

    const { data: revenueLast } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("price, rental_price, status, updated_at")
        .in("status", ["SOLD", "RENTED"])
        .is("deleted_at", null)
        .gte("updated_at", startOfLastMonth)
        .lte("updated_at", endOfLastMonth),
    );

    const totalRevenueLast = (revenueLast || []).reduce((sum: number, p: any) => {
      return sum + (p.status === "SOLD" ? (p.price || 0) : (p.rental_price || 0));
    }, 0);

    const revenueChangePercent =
      totalRevenueLast === 0
        ? 100
        : ((totalRevenueCurrent - totalRevenueLast) / totalRevenueLast) * 100;

    // 2. Leads
    const { count: leadsCurrent } = await applyTenantFilter(
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
    );

    const { count: leadsLast } = await applyTenantFilter(
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth),
    );

    const { count: leadsTotal } = await applyTenantFilter(
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true }),
    );

    const leadsChangePercent =
      leadsLast === 0
        ? 100
        : (((leadsCurrent || 0) - (leadsLast || 0)) / (leadsLast || 1)) * 100;

    const { count: totalSold } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "SOLD"),
    );

    const conversionRate =
      leadsTotal && leadsTotal > 0 ? ((totalSold || 0) / leadsTotal) * 100 : 0;

    const { data: commissionDeals } = await applyTenantFilter(supabase
      .from("deals")
      .select("commission_amount")
      .eq("status", "CLOSED_WIN")
      .gte("created_at", startOfMonth));

    const dealsWon = (commissionDeals || []).length;

    const { count: dealsWonLast } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .in("status", ["SOLD", "RENTED"])
        .is("deleted_at", null)
        .gte("updated_at", startOfLastMonth)
        .lte("updated_at", endOfLastMonth),
    );

    const dealsChange = dealsWon - (dealsWonLast || 0);

    const totalCommission = (commissionDeals || []).reduce(
      (sum: number, d: any) => sum + (d.commission_amount || 0),
      0,
    );

    return {
      revenueThisMonth: totalRevenueCurrent,
      revenueChange: formatPercent(revenueChangePercent),
      leadsThisMonth: leadsCurrent || 0,
      leadsChange: formatPercent(leadsChangePercent),
      leadsTotal: leadsTotal || 0,
      conversionRate: Number(conversionRate.toFixed(1)),
      conversionChange: "+0%",
      conversionBase: `จาก ${leadsTotal} Leads`,
      dealsWon: dealsWon,
      dealsWonChange: dealsChange > 0 ? `+${dealsChange}` : `${dealsChange}`,
      dealsTarget: 10,
      totalCommission,
    };
  } catch (error) {
    console.error("getDashboardStats Error:", error);
    return {
      revenueThisMonth: 0,
      revenueChange: "0%",
      leadsThisMonth: 0,
      leadsChange: "0%",
      leadsTotal: 0,
      conversionRate: 0,
      conversionChange: "0%",
      conversionBase: "0 Leads",
      dealsWon: 0,
      dealsWonChange: "0",
      dealsTarget: 10,
      totalCommission: 0,
    };
  }
}

export async function getRevenueChartData(tenantId?: string | null): Promise<RevenueChartData[]> {
  try {
    const supabase = await createClient();
    
    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("price, rental_price, status, updated_at")
        .in("status", ["SOLD", "RENTED"])
        .is("deleted_at", null)
        .gte("updated_at", sixMonthsAgo.toISOString()),
    );

    const grouped = new Map<string, number>();

    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = d.toLocaleDateString("th-TH", { month: "short" });
      grouped.set(key, 0);
    }

    data?.forEach((p: any) => {
      const date = new Date(p.updated_at);
      const key = date.toLocaleDateString("th-TH", { month: "short" });
      const val = p.status === "SOLD" ? (p.price || 0) : (p.rental_price || 0);
      if (grouped.has(key)) {
        grouped.set(key, (grouped.get(key) || 0) + val);
      }
    });

    return Array.from(grouped.entries()).map(([name, total]) => ({
      name,
      total,
    }));
  } catch (error) {
    console.error("getRevenueChartData Error:", error);
    return [];
  }
}

export async function getFunnelStats(tenantId?: string | null): Promise<FunnelData[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const { data: leads } = await applyTenantFilter(supabase.from("leads").select("stage").is("deleted_at", null));

    const counts = {
      NEW: 0,
      CONTACTED: 0,
      VIEWED: 0,
      NEGOTIATING: 0,
      CLOSED: 0,
    };

    leads?.forEach((l: any) => {
      if (l.stage === "NEW") counts.NEW++;
      else if (l.stage === "CONTACTED") counts.CONTACTED++;
      else if (l.stage === "VIEWED") counts.VIEWED++;
      else if (l.stage === "NEGOTIATING") counts.NEGOTIATING++;
      else if (l.stage === "CLOSED") counts.CLOSED++;
    });

    const { count: dealClosedCount } = await applyTenantFilter(
      supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("status", "CLOSED_WIN"),
    );

    const { count: propertySoldOrRentedCount } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["SOLD", "RENTED"]),
    );

    counts.CLOSED = Math.max(
      counts.CLOSED,
      dealClosedCount || 0,
      propertySoldOrRentedCount || 0,
    );

    counts.NEGOTIATING = Math.max(counts.NEGOTIATING, counts.CLOSED);
    counts.VIEWED = Math.max(counts.VIEWED, counts.NEGOTIATING);
    counts.CONTACTED = Math.max(counts.CONTACTED, counts.VIEWED);
    counts.NEW = Math.max(counts.NEW, counts.CONTACTED);

    return [
      {
        step: "Lead",
        count:
          counts.NEW +
          counts.CONTACTED +
          counts.VIEWED +
          counts.NEGOTIATING +
          counts.CLOSED,
        fill: "#94a3b8",
      },
      {
        step: "Contacted",
        count:
          counts.CONTACTED + counts.VIEWED + counts.NEGOTIATING + counts.CLOSED,
        fill: "#60a5fa",
      },
      {
        step: "Viewed",
        count: counts.VIEWED + counts.NEGOTIATING + counts.CLOSED,
        fill: "#818cf8",
      },
      {
        step: "Negotiating",
        count: counts.NEGOTIATING + counts.CLOSED,
        fill: "#f472b6",
      },
      { step: "Closed", count: counts.CLOSED, fill: "#4ade80" },
    ];
  } catch (error) {
    console.error("getFunnelStats Error:", error);
    return [];
  }
}

export async function getPipelineStats(tenantId?: string | null): Promise<PipelineData[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const { data: properties } = await applyTenantFilter(
      supabase
        .from("properties")
        .select("status")
        .is("deleted_at", null),
    );

    const counts = {
      ACTIVE: 0,
      UNDER_OFFER: 0,
      RESERVED: 0,
      SOLD: 0,
    };

    properties?.forEach((p: any) => {
      if (p.status === "ACTIVE") counts.ACTIVE++;
      if (p.status === "UNDER_OFFER") counts.UNDER_OFFER++;
      if (p.status === "RESERVED") counts.RESERVED++;
      if (p.status === "SOLD") counts.SOLD++;
    });

    return [
      {
        stage: "ACTIVE",
        count: counts.ACTIVE,
        color: "bg-blue-500",
        label: "ประกาศขาย",
      },
      {
        stage: "OFFER",
        count: counts.UNDER_OFFER,
        color: "bg-orange-500",
        label: "มีข้อเสนอ",
      },
      {
        stage: "RESERVED",
        count: counts.RESERVED,
        color: "bg-purple-500",
        label: "จองแล้ว",
      },
      {
        stage: "SOLD",
        count: counts.SOLD,
        color: "bg-green-500",
        label: "ขายแล้ว",
      },
    ];
  } catch (error) {
    console.error("getPipelineStats Error:", error);
    return [];
  }
}
