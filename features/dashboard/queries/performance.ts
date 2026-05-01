import { createClient } from "@/lib/supabase/server";
import { TopAgent, MarketingPerformanceData } from "./types";

export async function getTopAgents(tenantId?: string | null): Promise<TopAgent[]> {
  try {
    const supabase = await createClient();

    // [OPTIMIZATION] Using SQL Join to fetch deals and profiles in ONE trip
    let query = supabase
      .from("deals")
      .select(`
        created_by,
        commission_amount,
        agent:profiles!created_by (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("status", "CLOSED_WIN");

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: deals, error } = await query;

    if (error || !deals) return [];

    const agentStats = new Map<string, { count: number; commission: number; name: string; avatar: string | null }>();

    deals.forEach((d: { created_by: string | null; commission_amount: number | null; agent: any }) => {
      const agent = d.agent as unknown as { full_name: string | null; avatar_url: string | null } | null;
      if (!d.created_by || !agent) return;
      const current = agentStats.get(d.created_by) || {
        count: 0,
        commission: 0,
        name: agent.full_name || "Unknown Agent",
        avatar: agent.avatar_url,
      };

      agentStats.set(d.created_by, {
        count: current.count + 1,
        commission: current.commission + (d.commission_amount || 0),
        name: current.name,
        avatar: current.avatar,
      });
    });

    return Array.from(agentStats.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        avatar_url: stats.avatar,
        deals_count: stats.count,
        total_commission: stats.commission,
      }))
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 5);
  } catch (error) {
    console.error("getTopAgents Error:", error);
    return [];
  }
}

export async function getAdvancedTopAgents(
  tenantId?: string | null,
): Promise<TopAgent[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = <T extends { eq: (col: string, val: string) => T }>(query: T): T => {
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

    type JoinedCommission = {
      net_amount: number | null;
      agent_id: string | null;
      agent: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      } | null;
    };

    const { data: commissions, error } = await applyTenantFilter(
      supabase.from("deal_commissions").select(
        `
        net_amount,
        agent_id,
        agent:profiles (
          id,
          full_name,
          avatar_url
        )
      `,
      ),
    )
      .eq("status", "PAID")
      .neq("status", "CANCELLED")
      .gte("created_at", startOfMonth) as unknown as { data: JoinedCommission[] | null; error: any };

    if (error || !commissions) {
      if (error) console.error("Error fetching advanced top agents:", error.message || error);
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

    commissions?.forEach((c) => {
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
  } catch (err) {
    console.error("getAdvancedTopAgents Error:", err);
    return [];
  }
}

export async function getMarketingPerformanceData(tenantId?: string | null): Promise<
  MarketingPerformanceData[]
> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("leads")
      .select("utm_source, ai_score")
      .is("deleted_at", null);

    if (tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: leads } = await query;


    if (!leads) return [];

    const statsMap = new Map<
      string,
      { count: number; totalScore: number; hotLeads: number }
    >();

    leads.forEach((l: { utm_source: string | null; ai_score: number | null }) => {
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
