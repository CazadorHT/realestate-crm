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

    const applyTenantFilter = <T extends any>(
      query: any,
    ) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    // Step 1: Get profile IDs for this tenant if filtering
    let profileIds: string[] | null = null;
    if (tenantId && tenantId !== "ALL") {
      const { data: members, error: memberError } = await supabase
        .from("tenant_members")
        .select("profile_id")
        .eq("tenant_id", tenantId);
      
      if (memberError) {
        console.error("[getAgentKpiStats] Tenant Members Error:", memberError);
        return [];
      }
      profileIds = members?.map((m) => m.profile_id) || [];
    }

    // Step 2: Query profiles (they don't have tenant_id)
    let profileQuery = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "AGENT");

    if (profileIds) {
      if (profileIds.length === 0) return []; // No agents in this tenant
      profileQuery = profileQuery.in("id", profileIds);
    }

    if (agentId) {
      profileQuery = profileQuery.eq("id", agentId);
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

    type AgentRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
    type DealRow = { id: string; created_by: string; commission_amount: number | null; deal_type: string; status: string };
    type LeadRow = { id: string; assigned_to: string | null };

    return (agents as AgentRow[]).map((agent) => {
      const agentDeals = (deals as unknown as DealRow[] || []).filter(
        (d: DealRow) => d.created_by === agent.id,
      );
      const agentLeads = (leads as unknown as LeadRow[] || []).filter(
        (l: LeadRow) => l.assigned_to === agent.id,
      );

      const totalRevenue = agentDeals.reduce(
        (sum: number, d: DealRow) => sum + (d.commission_amount || 0),
        0,
      );
      const salesCount = agentDeals.filter(
        (d: DealRow) => d.deal_type === "SALE",
      ).length;
      const rentCount = agentDeals.filter(
        (d: DealRow) => d.deal_type === "RENT",
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
