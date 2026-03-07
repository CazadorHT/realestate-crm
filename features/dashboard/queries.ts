"use server";

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

export type MarketingPerformanceData = {
  source: string;
  leadCount: number;
  avgAiScore: number;
  hotLeadCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
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
  // Current Month
  const { data: revenueCurrent } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .is("deleted_at", null)
    .gte("updated_at", startOfMonth);

  const totalRevenueCurrent = (revenueCurrent || []).reduce((sum, p) => {
    return sum + (p.status === "SOLD" ? p.price || 0 : p.rental_price || 0);
  }, 0);

  // Last Month
  const { data: revenueLast } = await supabase
    .from("properties")
    .select("price, rental_price, status, updated_at")
    .in("status", ["SOLD", "RENTED"])
    .is("deleted_at", null)
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
    .is("deleted_at", null)
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
    0,
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
    .is("deleted_at", null)
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

  // Also count Deals and Properties as "Closed"
  const { count: dealClosedCount } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("status", "CLOSED_WIN");

  const { count: propertySoldOrRentedCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .in("status", ["SOLD", "RENTED"]);

  // Deduplicate roughly by taking the max or summing specific types
  // For simplicity, let's use the CLOSED stage from leads + any SOLD properties not linked to leads
  // Actually, just taking the max of leads.CLOSED or properties.SOLD is a safe bet for "Closed" step
  counts.CLOSED = Math.max(
    counts.CLOSED,
    dealClosedCount || 0,
    propertySoldOrRentedCount || 0,
  );

  // If Negotiating is 0 but we have deals/sold properties, fallback
  counts.NEGOTIATING = Math.max(counts.NEGOTIATING, counts.CLOSED);
  counts.VIEWED = Math.max(counts.VIEWED, counts.NEGOTIATING);
  counts.CONTACTED = Math.max(counts.CONTACTED, counts.VIEWED);
  counts.NEW = Math.max(counts.NEW, counts.CONTACTED);

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
    .select("status")
    .is("deleted_at", null);

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
    {
      count: number;
      commission: number;
      profile: { full_name: string | null; avatar_url: string | null };
    }
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

export async function getAdvancedTopAgents(): Promise<TopAgent[]> {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  // Fetch commissions from deal_commissions joined with profiles
  // We use "any" for the table name since it's newly added and might not be in Database types yet
  const { data: commissions, error } = await (supabase
    .from("deal_commissions" as any)
    .select(
      `
      net_amount,
      agent_id,
      agent:profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("status", "PAID") // Only count paid commissions for leaderboard? Or all PENDING too?
    // User usually wants to see "Performance" so let's count all that are not CANCELLED
    .neq("status", "CANCELLED")
    .gte("created_at", startOfMonth) as any);

  if (error || !commissions) {
    console.error("Error fetching advanced top agents:", error);
    return [];
  }

  const agentMap = new Map<
    string,
    {
      count: number;
      amount: number;
      profile: { full_name: string | null; avatar_url: string | null };
    }
  >();

  commissions.forEach((c: any) => {
    if (!c.agent_id || !c.agent) return;
    const current = agentMap.get(c.agent_id) || {
      count: 0,
      amount: 0,
      profile: {
        full_name: c.agent.full_name,
        avatar_url: c.agent.avatar_url,
      },
    };

    agentMap.set(c.agent_id, {
      count: current.count + 1,
      amount: current.amount + (Number(c.net_amount) || 0),
      profile: current.profile,
    });
  });

  return Array.from(agentMap.entries())
    .map(([id, stats]) => ({
      id,
      name: stats.profile.full_name || "Unknown",
      avatar_url: stats.profile.avatar_url,
      deals_count: stats.count,
      total_commission: stats.amount,
    }))
    .sort((a, b) => b.total_commission - a.total_commission)
    .slice(0, 5);
}
// ... existing code ...

export type Notification = {
  id: string | number;
  message: string;
  type: "info" | "warning" | "alert" | "success";
  time: string;
  read: boolean;
  href?: string;
  createdAt?: number;
  category?: string;
};

export async function getRecentNotifications(
  preferences: Record<string, boolean> | null = null,
): Promise<Notification[]> {
  const supabase = await createClient();
  const notifications: Notification[] = [];

  // Default true for legacy or unset preferences
  const checkPref = (id: string) => {
    if (!preferences) return true;
    return preferences[id] !== false; // Default to true if missing
  };

  // 1. Get New Website Leads (New Lead)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const isoLimit = threeDaysAgo.toISOString();

  const [
    leadsResult,
    profilesResult,
    logsResult,
    activitiesResult,
    assignmentsResult,
    expiringContractsResult,
  ] = await Promise.all([
    // Website Leads
    checkPref("new_lead")
      ? supabase
          .from("leads")
          .select("id, full_name, created_at, source")
          .eq("source", "WEBSITE")
          .gte("created_at", isoLimit)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),

    // New Profiles (Admin use case)
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at, role")
      .gte("created_at", isoLimit)
      .order("created_at", { ascending: false }),

    // Audit Logs (Status Updates, Price Drops, Logic Alerts)
    supabase
      .from("audit_logs")
      .select("id, action, created_at, metadata, user_id, entity, entity_id")
      .gte("created_at", isoLimit)
      .order("created_at", { ascending: false }),

    // Activities (New Activities)
    checkPref("activity")
      ? supabase
          .from("lead_activities")
          .select(
            "id, created_at, lead_id, activity_type, note, leads(full_name)",
          )
          .gte("created_at", isoLimit)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),

    // Assignments logic usually is in audit_logs, but let's check specifically for property_agents or similar
    // Actually logAudit for assignments uses 'property.assign' or 'lead.assign'
    Promise.resolve({ data: [] }), // Placeholder if handled in logs

    // Contract Expiry - Check rental contracts expiring in next 30 days
    checkPref("contract_expiry")
      ? supabase
          .from("rental_contracts")
          .select(
            "id, deal_id, end_date, start_date, rent_price, deals(property_id, properties(title))",
          )
          .eq("status", "ACTIVE")
          .not("end_date", "is", null)
          .gte("end_date", new Date().toISOString())
          .order("end_date", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const recentLeads = leadsResult.data || [];
  const recentProfiles = profilesResult.data || [];
  const recentLogs = logsResult.data || [];
  const recentActivities = activitiesResult.data || [];

  // 1. New Leads
  recentLeads.forEach((lead) => {
    notifications.push({
      id: `lead-${lead.id}`,
      message: `Lead ใหม่จากหน้าเว็บ: ${lead.full_name}`,
      type: "success",
      time: formatTimeAgo(lead.created_at),
      read: false,
      href: `/protected/leads/${lead.id}`,
      createdAt: new Date(lead.created_at).getTime(),
      category: "new_lead",
    });
  });

  // 2. Audit Logs
  recentLogs.forEach((log) => {
    const meta = log.metadata as any;
    const timeStr = formatTimeAgo(log.created_at);
    const createdAt = new Date(log.created_at).getTime();

    // Price Drops
    if (
      checkPref("price_drop") &&
      log.action === "property.update" &&
      meta?.price_change
    ) {
      notifications.push({
        id: `price-${log.id}`,
        message: `ลดราคา! ${meta.title || "ทรัพย์"}: ฿${meta.old_price?.toLocaleString()} → ฿${meta.new_price?.toLocaleString()}`,
        type: "warning",
        time: timeStr,
        read: false,
        href: `/protected/properties/${log.entity_id}`,
        createdAt,
        category: "price_drop",
      });
    }

    // Status Updates
    if (
      checkPref("status_update") &&
      meta?.status_update &&
      log.action.includes(".update")
    ) {
      notifications.push({
        id: `status-${log.id}`,
        message: `เปลี่ยนสถานะ ${log.entity}: ${meta.new_stage || meta.new_status}`,
        type: "info",
        time: timeStr,
        read: false,
        href: `/protected/${log.entity === "leads" ? "leads" : "properties"}/${log.entity_id}`,
        createdAt,
        category: "status_update",
      });
    }

    // Login (Security - always show if relevant or map to profile?)
    if (log.action === "LOGIN") {
      notifications.push({
        id: `login-${log.id}`,
        message: `เข้าสู่ระบบ: ${meta?.email || "User"}`,
        type: "info",
        time: timeStr,
        read: false,
        createdAt,
      });
    }
  });

  // 3. New Activities
  recentActivities.forEach((act: any) => {
    notifications.push({
      id: `act-${act.id}`,
      message: `กิจกรรมใน Lead ${act.leads?.full_name}: ${act.activity_type}`,
      type: "info",
      time: formatTimeAgo(act.created_at),
      read: false,
      href: `/protected/leads/${act.lead_id}`,
      createdAt: new Date(act.created_at).getTime(),
      category: "activity",
    });
  });

  // 4. New Registrations (Profiles)
  recentProfiles.forEach((profile) => {
    notifications.push({
      id: `user-${profile.id}`,
      message: `สมาชิกใหม่: ${profile.full_name || profile.email}`,
      type: "info",
      time: formatTimeAgo(profile.created_at),
      read: false,
      createdAt: new Date(profile.created_at).getTime(),
    });
  });

  // 5. Contract Expiry (Contracts expiring in 30 days)
  const expiringContracts = expiringContractsResult.data || [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  expiringContracts.forEach((contract: any) => {
    const endDate = new Date(contract.end_date);
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Only show contracts expiring within 30 days
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
      const propertyTitle = contract.deals?.properties?.title || "ทรัพย์สิน";
      const type = daysUntilExpiry <= 7 ? "alert" : "warning";

      notifications.push({
        id: `contract-${contract.id}`,
        message: `สัญญาใกล้หมดอายุ: ${propertyTitle} (อีก ${daysUntilExpiry} วัน)`,
        type,
        time: `${daysUntilExpiry} วันข้างหน้า`,
        read: false,
        href: `/protected/deals/${contract.deal_id}`,
        createdAt: endDate.getTime(), // Sort by expiry date
        category: "contract_expiry",
      });
    }
  });

  // Sort by newest first
  return notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getMarketingPerformanceData(): Promise<
  MarketingPerformanceData[]
> {
  try {
    const supabase = await createClient();

    const { data: leads } = await supabase
      .from("leads")
      .select("utm_source, ai_score")
      .is("deleted_at", null);

    if (!leads) return [];

    const statsMap = new Map<
      string,
      { count: number; totalScore: number; hotLeads: number }
    >();

    leads.forEach((l) => {
      const source = l.utm_source || "Direct / Unknown";
      const score = l.ai_score || 0;
      const isHot = score >= 80;

      const current = statsMap.get(source) || {
        count: 0,
        totalScore: 0,
        hotLeads: 0,
      };
      statsMap.set(source, {
        count: current.count + 1,
        totalScore: current.totalScore + score,
        hotLeads: current.hotLeads + (isHot ? 1 : 0),
      });
    });

    return Array.from(statsMap.entries())
      .map(([source, stats]) => ({
        source,
        leadCount: stats.count,
        avgAiScore: Math.round(stats.totalScore / stats.count),
        hotLeadCount: stats.hotLeads,
      }))
      .sort((a, b) => b.leadCount - a.leadCount);
  } catch (error) {
    console.error("getMarketingPerformanceData Error:", error);
    return [];
  }
}

export async function getExecutiveWeeklyAISummaryAction() {
  try {
    const supabase = await createClient();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    // 1. Fetch Stats
    const [leadsRes, dealsRes, propertiesRes] = await Promise.all([
      supabase
        .from("leads")
        .select("utm_source, ai_score, created_at")
        .gte("created_at", weekAgoStr)
        .is("deleted_at", null),
      supabase
        .from("deals")
        .select("status, deal_type, commission_amount, created_at")
        .gte("created_at", weekAgoStr)
        .is("deleted_at", null),
      supabase
        .from("properties")
        .select("view_count, property_type")
        .is("deleted_at", null),
    ]);

    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const props = propertiesRes.data || [];

    const totalLeads = leads.length;
    const hotLeads = leads.filter((l) => (l.ai_score || 0) >= 80).length;
    const dealsWon = deals.filter(
      (d) => d.status === "CLOSED_WIN" || d.status === "SIGNED",
    ).length;

    // Aggregate UTMs
    const utmMap = new Map();
    leads.forEach((l) => {
      const s = l.utm_source || "Direct";
      utmMap.set(s, (utmMap.get(s) || 0) + 1);
    });
    const topSource =
      Array.from(utmMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // 2. AI Generate Summary
    const { generateText } = await import("@/lib/ai/gemini");
    const prompt = `
    คุณเป็นผู้ช่วยวิเคราะห์ธุรกิจอสังหาริมทรัพย์ระดับสูง
    สรุปผลการดำเนินงานในรอบ 7 วันที่ผ่านมาให้ผู้บริหารฟัง จากข้อมูลดังนี้:
    - จำนวน Lead ใหม่: ${totalLeads} คน
    - จำนวน Hot Lead (คุณภาพสูง): ${hotLeads} คน
    - ดีลที่ปิดการขายได้สำเร็จ: ${dealsWon} ดีล
    - ช่องทางที่ได้ Lead มากที่สุด: ${topSource}
    
    คำแนะนำ:
    1. วิเคราะห์แนวโน้มสั้นๆ ว่าดีหรือควรปรับปรุงตรงไหน
    2. ให้คำแนะนำเชิงกลยุทธ์ 2-3 ข้อ (เช่น เพิ่มงบช่องทาง X หรือ เน้นติดตาม Hot Lead)
    3. ใช้ภาษาไทยที่เป็นทางการแต่กระชับ น่าเชื่อถือ
    4. ไม่ต้องใส่หัวข้อใหญ่ เอาเฉพาะเนื้อหาที่สรุปมาเลย
  `;

    const result = await generateText(prompt, "gemini-2.0-flash-exp");

    return {
      summary: result.text || "ไม่สามารถสรุปข้อมูลได้ในขณะนี้",
      stats: {
        totalLeads,
        hotLeads,
        dealsWon,
        topSource,
      },
    };
  } catch (error) {
    console.error("getExecutiveWeeklyAISummaryAction Error:", error);
    throw new Error(
      "ระบบ AI ไม่สามารถประมวลผลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    );
  }
}

function formatTimeAgo(dateString: string): string {
  const created = new Date(dateString);
  const diffMs = new Date().getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return "1d ago";
}
// ... existing code ...

export type AgendaEvent = {
  id: string | number;
  time: string;
  title: string;
  type: "meeting" | "call" | "task" | "deadline";
  priority: "high" | "medium" | "low";
};

export async function getTodayAgenda(): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  // 1. Fetch New Leads Today
  const { data: newLeads } = await supabase
    .from("leads")
    .select("id, full_name, created_at, lead_type")
    .gte("created_at", todayIso)
    .order("created_at", { ascending: false });

  // 2. Fetch New Deals Today
  const { data: newDeals } = await supabase
    .from("deals")
    .select("id, deal_type, created_at")
    .gte("created_at", todayIso)
    .order("created_at", { ascending: false });

  const agenda: AgendaEvent[] = [];

  // Map Leads to "Call" tasks
  newLeads?.forEach((lead) => {
    agenda.push({
      id: `lead-${lead.id}`,
      time: new Date(lead.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: `ติดต่อลูกค้าใหม่: ${lead.full_name}`,
      type: "call",
      priority: "high",
    });
  });

  // Map Deals to "Meeting" or "Task"
  newDeals?.forEach((deal) => {
    agenda.push({
      id: `deal-${deal.id}`,
      time: new Date(deal.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: `ดำเนินการดีลใหม่ (${deal.deal_type})`,
      type: "meeting",
      priority: "medium",
    });
  });

  // Sort by time desc
  return agenda.sort((a, b) => b.time.localeCompare(a.time));
}

export type FollowUpLead = {
  id: string;
  name: string;
  daysQuiet: number;
  stage: string;
};

export async function getFollowUpLeads(): Promise<FollowUpLead[]> {
  const supabase = await createClient();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Fetch leads not updated in last 3 days and not closed
  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, updated_at, stage")
    .lt("updated_at", threeDaysAgo.toISOString())
    .neq("stage", "CLOSED")
    .limit(5);

  if (!leads) return [];

  return leads.map((l) => {
    const updated = new Date(l.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: l.id,
      name: l.full_name,
      daysQuiet: diffDays,
      stage: l.stage,
    };
  });
}

export type RiskDeal = {
  id: string;
  title: string;
  daysInStage: number;
  stage: string;
};

export async function getRiskDeals(): Promise<RiskDeal[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: deals } = await supabase
    .from("deals")
    .select("id, updated_at, status, properties(title)")
    .lt("updated_at", sevenDaysAgo.toISOString())
    .neq("status", "CLOSED_WIN")
    .neq("status", "CLOSED_LOSS")
    .limit(5);

  if (!deals) return [];

  return deals.map((d) => {
    const updated = new Date(d.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: d.id,
      title: d.properties?.title || `Deal #${d.id.slice(0, 4)}`,
      daysInStage: diffDays,
      stage: d.status,
    };
  });
}

export type PropertyAnalytics = {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  listing_type: string;
  price: number | null;
  rental_price: number | null;
};

export type AreaAnalytics = {
  name: string;
  view_count: number;
  leads_count: number;
};

export async function getAnalyticsStats(days?: number): Promise<{
  topProperties: PropertyAnalytics[];
  topAreas: AreaAnalytics[];
  totalViews: number;
}> {
  const supabase = await createClient();

  // 1. Get Top 10 Properties by Views
  let query = supabase
    .from("properties")
    .select("id, title, slug, view_count, listing_type, price, rental_price")
    .is("deleted_at", null);

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query = query.gte("created_at", startDate.toISOString());
  }

  const { data: topProps } = await query
    .order("view_count", { ascending: false })
    .limit(10);

  // 2. Get Top Areas by Views
  // Since view_count is per property, we sum them by popular_area
  let areaQuery = supabase
    .from("properties")
    .select("popular_area, view_count")
    .is("deleted_at", null)
    .not("popular_area", "is", null);

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    areaQuery = areaQuery.gte("created_at", startDate.toISOString());
  }

  const { data: areasData } = await areaQuery;

  const areaMap = new Map<string, { views: number; leads: number }>();
  areasData?.forEach((p) => {
    const area = p.popular_area!;
    const current = areaMap.get(area) || { views: 0, leads: 0 };
    areaMap.set(area, {
      views: current.views + (p.view_count || 0),
      leads: current.leads,
    });
  });

  // 3. Get Leads per Area (to show conversion potential)
  const { data: leadsData } = await supabase
    .from("leads")
    .select("preferred_locations");

  leadsData?.forEach((l) => {
    (l.preferred_locations as string[])?.forEach((loc) => {
      const current = areaMap.get(loc) || { views: 0, leads: 0 };
      areaMap.set(loc, {
        views: current.views,
        leads: current.leads + 1,
      });
    });
  });

  const topAreas = Array.from(areaMap.entries())
    .map(([name, stats]) => ({
      name,
      view_count: stats.views,
      leads_count: stats.leads,
    }))
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 10);

  const totalViews = (topProps || []).reduce(
    (sum, p) => sum + (p.view_count || 0),
    0,
  );

  return {
    topProperties: (topProps as any) || [],
    topAreas,
    totalViews,
  };
}

export async function getSetupProgress(): Promise<{
  hasBranchProfile: boolean;
  hasStaff: boolean;
  hasProperty: boolean;
  isLineConnected: boolean;
  isLineSkipped: boolean;
  isStaffSkipped: boolean;
  branchCount: number;
}> {
  const supabase = await createClient();
  const { getSiteSettings } = await import("@/features/site-settings/actions");

  const [staffRes, propRes, tenantRes, settings, profilesWithLine] =
    await Promise.all([
      supabase
        .from("tenant_members")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase.from("tenants").select("logo_url", { count: "exact" }),
      getSiteSettings(),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("line_id", "is", null),
    ]);

  const isLineConnected =
    !!settings.line_id ||
    !!process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    (profilesWithLine.count || 0) > 0;

  return {
    hasBranchProfile: !!tenantRes.data?.[0]?.logo_url,
    hasStaff: (staffRes.count || 0) > 0,
    hasProperty: (propRes.count || 0) > 0,
    isLineConnected,
    isLineSkipped: !!settings.onboarding_line_skipped,
    isStaffSkipped: !!settings.onboarding_staff_skipped,
    branchCount: tenantRes.count || 0,
  };
}
