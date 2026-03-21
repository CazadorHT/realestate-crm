import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";

export interface AgentKpiStats {
  agentId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalDeals: number;
  totalRevenue: number;
  totalCommission: number;
  leadCount: number;
  conversionRate: number;
  salesCount: number;
  rentCount: number;
}

/**
 * Fetches performance analytics for a specific agent or all agents (leaderboard).
 */
export async function getAgentKpiStats(
  tenantId?: string | null,
  agentId?: string,
  timeframe: "month" | "quarter" | "year" | "all" = "all",
): Promise<AgentKpiStats[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    // Basic query for profiles with AGENT role
    let profileQuery = applyTenantFilter(
      supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("role", "AGENT"),
    );

    if (agentId) {
      profileQuery = (profileQuery as any).eq("id", agentId);
    }

    const { data: agents, error: profilesError } = await profileQuery;

    if (profilesError) {
      console.error("[getAgentKpiStats] Profiles Error:", profilesError);
      return [];
    }

    if (!agents || agents.length === 0) return [];

    // Fetch all closed deals for calculating revenue
    const { data: deals, error: dealsError } = await applyTenantFilter(
      supabase
        .from("deals")
        .select("id, created_by, commission_amount, deal_type, status")
        .eq("status", "CLOSED_WIN"),
    );

    if (dealsError) {
      console.error("[getAgentKpiStats] Deals Error:", dealsError);
    }

    // Fetch assigned leads count for conversion rate
    const { data: leads, error: leadsError } = await applyTenantFilter(
      supabase.from("leads").select("id, assigned_to"),
    );

    if (leadsError) {
      console.error("[getAgentKpiStats] Leads Error:", leadsError);
    }

    return agents.map((agent: any) => {
      const agentDeals = (deals || []).filter(
        (d: any) => d.created_by === agent.id,
      );
      const agentLeads = (leads || []).filter(
        (l: any) => l.assigned_to === agent.id,
      );

      const totalRevenue = agentDeals.reduce(
        (sum: number, d: any) => sum + (d.commission_amount || 0),
        0,
      );
      const salesCount = agentDeals.filter(
        (d: any) => d.deal_type === "SALE",
      ).length;
      const rentCount = agentDeals.filter(
        (d: any) => d.deal_type === "RENT",
      ).length;

      return {
        agentId: agent.id,
        fullName: agent.full_name,
        email: agent.email,
        avatarUrl: agent.avatar_url,
        totalDeals: agentDeals.length,
        totalRevenue,
        totalCommission: totalRevenue, // Can be refined with split logic later
        leadCount: agentLeads.length,
        conversionRate:
          agentLeads.length > 0
            ? parseFloat(
                ((agentDeals.length / agentLeads.length) * 100).toFixed(1),
              )
            : 0,
        salesCount,
        rentCount,
      };
    });
  } catch (error) {
    console.error("getAgentKpiStats Error:", error);
    return [];
  }
}
