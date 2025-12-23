import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/authz";

export type DashboardStats = {
  revenueThisMonth: number;
  revenueChange: string;
  leadsThisMonth: number;
  leadsChange: string;
  leadsTotal: number;
  conversionRate: number;
  conversionChange: string;
  conversionBase: string;
  dealsWon: number;
  dealsWonChange: string;
  dealsTarget: number;
  totalCommission: number;
};

export type TopAgent = {
  id: string;
  name: string;
  avatar_url: string | null;
  deals_count: number;
  total_commission: number;
};

export type RevenueChartData = {
  name: string;
  total: number;
};

export type FunnelData = {
  step: string;
  count: number;
  fill: string;
};

export type PipelineData = {
  stage: string;
  count: number;
  color: string;
  label: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0
  ).toISOString();

  // 1. Revenue (Sold/Rented Properties)
  // Current Month
  const { data: revenueCurrent } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .gte("updated_at", startOfMonth);

  const totalRevenueCurrent = (revenueCurrent || []).reduce((sum, p) => {
    return sum + (p.status === "SOLD" ? p.price || 0 : p.rental_price || 0);
  }, 0);

  // Last Month
  const { data: revenueLast } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .gte("updated_at", startOfLastMonth)
    .lte("updated_at", endOfLastMonth);

  const totalRevenueLast = (revenueLast || []).reduce((sum, p) => {
    return sum + (p.status === "SOLD" ? p.price || 0 : p.rental_price || 0);
  }, 0);

  const revenueChangePercent =
    totalRevenueLast === 0
      ? 100
      : ((totalRevenueCurrent - totalRevenueLast) / totalRevenueLast) * 100;

  // 2. Leads
  // Current Month
  const { count: leadsCurrent } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  // Last Month
  const { count: leadsLast } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfLastMonth)
    .lte("created_at", endOfLastMonth);

  // Total Leads (for context)
  const { count: leadsTotal } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const leadsChangePercent =
    leadsLast === 0
      ? 100
      : (((leadsCurrent || 0) - (leadsLast || 0)) / (leadsLast || 1)) * 100; // avoid div by zero

  // 3. Conversion Rate (Roughly: Sold / Total Leads * 100)
  // This is a simplified metric.
  const { count: totalSold } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("status", "SOLD");

  const conversionRate =
    leadsTotal && leadsTotal > 0 ? ((totalSold || 0) / leadsTotal) * 100 : 0;

  // 4. Closed Won (Sold this month)
  // 4. Closed Won (Sold this month)
  // Re-using commissionDeals query below which fetches CLOSED_WIN deals for this month
  const { data: commissionDeals } = await supabase
    .from("deals")
    .select("commission_amount")
    .eq("status", "CLOSED_WIN")
    .gte("created_at", startOfMonth);

  const dealsWon = (commissionDeals || []).length;

  const { count: dealsWonLast } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("status", "CLOSED_WIN")
    .gte("created_at", startOfLastMonth)
    .lte("created_at", endOfLastMonth);

  const dealsChange = dealsWon - (dealsWonLast || 0);

  // 5. Total Commission (This Month)
  const totalCommission = (commissionDeals || []).reduce(
    (sum, d) => sum + (d.commission_amount || 0),
    0
  );

  return {
    revenueThisMonth: totalRevenueCurrent,
    revenueChange: formatPercent(revenueChangePercent),
    leadsThisMonth: leadsCurrent || 0,
    leadsChange: formatPercent(leadsChangePercent),
    leadsTotal: leadsTotal || 0,
    conversionRate: Number(conversionRate.toFixed(1)),
    conversionChange: "+0%", // Hard to calc hist without snapshots, keeping placeholder or 0
    conversionBase: `จาก ${leadsTotal} Leads`,
    dealsWon: dealsWon,
    dealsWonChange: dealsChange > 0 ? `+${dealsChange}` : `${dealsChange}`,
    dealsTarget: 10, // Hardcoded target
    totalCommission,
  };
}

function formatPercent(val: number) {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

export async function getRevenueChartData(): Promise<RevenueChartData[]> {
  const supabase = await createClient();
  // Get last 6 months data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of that month

  const { data } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .gte("updated_at", sixMonthsAgo.toISOString());

  // Group by Month
  const grouped = new Map<string, number>();

  // Initialize last 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = d.toLocaleDateString("th-TH", { month: "short" });
    grouped.set(key, 0);
  }

  data?.forEach((p) => {
    const date = new Date(p.updated_at);
    const key = date.toLocaleDateString("th-TH", { month: "short" });
    const val = p.status === "SOLD" ? p.price || 0 : p.rental_price || 0;
    if (grouped.has(key)) {
      grouped.set(key, grouped.get(key)! + val);
    }
  });

  return Array.from(grouped.entries()).map(([name, total]) => ({
    name,
    total,
  }));
}

export async function getFunnelStats(): Promise<FunnelData[]> {
  const supabase = await createClient();

  // Using Lead Stages for Funnel
  // Lead -> Contacted -> Viewed -> Negotiating (Deal) -> Closed (Property Sold)

  const { data: leads } = await supabase.from("leads").select("stage");

  const counts = {
    NEW: 0,
    CONTACTED: 0,
    VIEWED: 0, // 'VIEWED' from Lead stage
    NEGOTIATING: 0,
    CLOSED: 0,
  };

  leads?.forEach((l) => {
    if (l.stage === "NEW") counts.NEW++;
    else if (l.stage === "CONTACTED") counts.CONTACTED++;
    else if (l.stage === "VIEWED") counts.VIEWED++;
    else if (l.stage === "NEGOTIATING") counts.NEGOTIATING++;
    else if (l.stage === "CLOSED") counts.CLOSED++;
  });

  // Also consider "SOLD" properties as CLOSED wins if we want to mix data,
  // but better to stick to Lead stages for now to consisteny.

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
    }, // All
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
}

export async function getPipelineStats(): Promise<PipelineData[]> {
  const supabase = await createClient();

  // Active Properties by Status
  const { data: properties } = await supabase
    .from("properties")
    .select("status");

  const counts = {
    ACTIVE: 0,
    UNDER_OFFER: 0,
    RESERVED: 0,
    SOLD: 0,
  };

  properties?.forEach((p) => {
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
}

export async function getTopAgents(): Promise<TopAgent[]> {
  const supabase = await createClient();

  // Fetch closed deals
  const { data: deals } = await supabase
    .from("deals")
    .select("created_by, commission_amount")
    .eq("status", "CLOSED_WIN");

  // Fetch profiles for names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url");

  if (!deals || !profiles) return [];

  // Aggregate by agent
  const agentStats = new Map<
    string,
    { count: number; commission: number; profile: any }
  >();

  deals.forEach((d) => {
    if (!d.created_by) return;
    const current = agentStats.get(d.created_by) || {
      count: 0,
      commission: 0,
      profile: profiles.find((p) => p.id === d.created_by) || {
        full_name: "Unknown",
        avatar_url: null,
      },
    };

    agentStats.set(d.created_by, {
      count: current.count + 1,
      commission: current.commission + (d.commission_amount || 0),
      profile: current.profile,
    });
  });

  // Convert to array and sort
  return Array.from(agentStats.entries())
    .map(([id, stats]) => ({
      id,
      name: stats.profile.full_name || "Unknown Agent",
      avatar_url: stats.profile.avatar_url,
      deals_count: stats.count,
      total_commission: stats.commission,
    }))
    .sort((a, b) => b.total_commission - a.total_commission)
    .slice(0, 5);
}
