"use server";

import { createClient } from "@/lib/supabase/server";
import { TopAgent, MarketingPerformanceData } from "./types";
import { Database } from "@/lib/database.types.generated";

type LedgerRow = Database["public"]["Tables"]["financial_ledger_v3"]["Row"];
type LeadRow = Database["public"]["Tables"]["crm_leads_v3"]["Row"];

export async function calculateDateRange(range: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (range === "all" || !range) return { start: null, end: null };

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "6months":
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case "q1":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      break;
    case "q2":
      start = new Date(now.getFullYear(), 3, 1);
      end = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
      break;
    case "q3":
      start = new Date(now.getFullYear(), 6, 1);
      end = new Date(now.getFullYear(), 8, 30, 23, 59, 59);
      break;
    case "q4":
      start = new Date(now.getFullYear(), 9, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "year":
    case "ปีนี้":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "lastYear":
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    case "year2024":
      start = new Date(2024, 0, 1);
      end = new Date(2024, 11, 31, 23, 59, 59);
      break;
    case "year2023":
      start = new Date(2023, 0, 1);
      end = new Date(2023, 11, 31, 23, 59, 59);
      break;
    case "year2022":
      start = new Date(2022, 0, 1);
      end = new Date(2022, 11, 31, 23, 59, 59);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { 
    start: start.toISOString(), 
    end: end.toISOString() 
  };
}

export async function getTopAgents({
  tenantId,
  teamId,
  range = "month",
}: {
  tenantId?: string | null;
  teamId?: string | null;
  range?: string;
}): Promise<TopAgent[]> {
  try {
    const supabase = await createClient();
    const { start: startDate, end: endDate } = await calculateDateRange(range);
    
    const isAllTeam = !teamId || teamId.toUpperCase() === "ALL";

    let query = supabase
      .from("financial_ledger_v3")
      .select(`
        to_identity_id,
        amount_total,
        tenant_id,
        created_at,
        agent:profiles!to_identity_id${!isAllTeam ? "!inner" : ""} (
          id,
          full_name,
          avatar_url,
          team_id,
          team:teams_v3!inner (
            id,
            name,
            tenants:tenants_v3 (
              name
            )
          )
        )
      `)
      .eq("transaction_type", "commission_payout");
    
    if (range !== "all" && range !== "ALL" && startDate) {
      query = query.gte("created_at", startDate);
      if (endDate) {
        query = query.lte("created_at", endDate);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    let profileTenantId: string | null = null;

    if (user) {
      const { data: profile } = await supabase.from("profiles")
        .select("role, team:teams_v3!inner(tenant_id)")
        .eq("id", user.id)
        .single();
      
      isAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER";
      const profileTeam = profile?.team as { tenant_id: string } | null;
      profileTenantId = profileTeam?.tenant_id || null;
    }

    const isAllTenant = !tenantId || tenantId.toUpperCase() === "ALL";
    let activeTenantId = isAllTenant ? null : tenantId;

    // Only fallback to profileTenantId if NOT an admin selecting "ALL"
    if (!activeTenantId && !isAdmin && profileTenantId) {
      activeTenantId = profileTenantId;
    }

    if (activeTenantId) {
      query = query.eq("tenant_id", activeTenantId);
    }

    if (!isAllTeam) {
      query = query.eq("agent.team_id", teamId);
    }

    const { data: deals, error } = await query;
    
    if (error) {
      return [];
    }

    interface AgentDataJoin {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      team_id: string | null;
      team: {
        id: string;
        name: string;
        tenants: { name: string }[] | { name: string } | null;
      } | null;
    }

    type LedgerWithAgent = LedgerRow & {
      agent: AgentDataJoin | null;
    };

    interface AgentStatRecord {
      count: number;
      commission: number;
      name: string;
      avatar: string | null;
      branchName: string;
      teamName: string;
    }

    const agentStats = new Map<string, AgentStatRecord>();

    (deals as unknown as LedgerWithAgent[] || []).forEach((d) => {
      const agentData = d.agent; 
      const agentId = d.to_identity_id || "unknown";

      const teamData = agentData?.team;
      const tenantData = teamData?.tenants ? (Array.isArray(teamData.tenants) ? teamData.tenants[0] : teamData.tenants) : null;

      const current = agentStats.get(agentId) || {
        count: 0,
        commission: 0,
        name: agentData?.full_name || "Unknown Agent",
        avatar: agentData?.avatar_url || null,
        branchName: tenantData?.name || "ยังไม่ได้สังกัด",
        teamName: teamData?.name || "ไม่มีทีม",
      };

      agentStats.set(agentId, {
        ...current,
        count: current.count + 1,
        commission: current.commission + (Number(d.amount_total) || 0),
      });
    });

    return Array.from(agentStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        avatar_url: stats.avatar,
        deals_count: stats.count,
        total_commission: stats.commission,
        branch_name: stats.branchName,
        team_name: stats.teamName,
      }))
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 5);
  } catch (error) {
    console.error("getTopAgents Error:", error);
    return [];
  }
}

export const getTopAgentsAction = getTopAgents;
export const getAdvancedTopAgents = getTopAgents;

export async function getMarketingPerformanceData({
  tenantId,
  teamId,
  range = "month",
}: {
  tenantId?: string | null;
  teamId?: string | null;
  range?: string;
}): Promise<MarketingPerformanceData[]> {
  try {
    const supabase = await createClient();
    const { start: startDate } = await calculateDateRange(range);

    let query = supabase
      .from("crm_leads_v3")
      .select("source, ai_score, created_at");
    
    if (range !== "all" && range !== "ALL" && startDate) {
      query = query.gte("created_at", startDate);
    }

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: leads, error } = await query;
    if (error) {
      console.error("getMarketingPerformanceData DB Error:", error);
      return [];
    }
    if (!leads) return [];

    const statsMap = new Map<string, { count: number; totalScore: number; hotLeads: number }>();

    leads.forEach((l: LeadRow) => {
      const source = l.source || "Direct / Unknown";
      const score = l.ai_score || 0;
      const isHot = score >= 80;

      const current = statsMap.get(source) || { count: 0, totalScore: 0, hotLeads: 0 };
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

export const getMarketingPerformanceDataAction = getMarketingPerformanceData;
