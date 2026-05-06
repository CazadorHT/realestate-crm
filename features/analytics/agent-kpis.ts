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

import { requireAuthContext } from "@/lib/authz";

/**
 * Fetches performance analytics for a specific agent or all agents (leaderboard).
 */
export async function getAgentKpiStats(
  tenantId?: string | null,
  agentId?: string,
  timeframe: "month" | "quarter" | "year" | "all" = "all",
): Promise<AgentKpiStats[]> {
  try {
    const ctx = await requireAuthContext();
    const { supabase, role, tenantId: authTenantId } = ctx;

    // SECURITY: Ensure the requested tenantId matches the user's authorized tenant, 
    // unless the user is a system ADMIN.
    if (role !== "ADMIN") {
      tenantId = authTenantId;
    }

    // Date Filtering based on timeframe
    let startDate: string | null = null;
    const now = new Date();
    const start = new Date();
    
    if (timeframe === "month") start.setMonth(now.getMonth(), 1);
    else if (timeframe === "quarter") start.setMonth(now.getMonth() - 3);
    else if (timeframe === "year") start.setFullYear(now.getFullYear(), 0, 1);
    else if (timeframe === "all") startDate = null;
    else start.setMonth(now.getMonth(), 1); // default month
    
    if (timeframe !== "all") {
      startDate = start.toISOString();
    }

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

    // Step 3: Fetch all closed deals for calculating revenue
    let dealsQuery = supabase
      .from("deals")
      .select("id, created_by, commission_amount, deal_type, status, created_at")
      .eq("status", "CLOSED_WIN");
    
    dealsQuery = applyTenantFilter(dealsQuery);
    if (startDate) {
      dealsQuery = dealsQuery.gte("created_at", startDate);
    }
    const { data: deals, error: dealsError } = await dealsQuery;

    if (dealsError) {
      console.error("[getAgentKpiStats] Deals Error:", dealsError);
    }

    // Fetch assigned leads count for conversion rate
    let leadsQuery = supabase.from("leads").select("id, assigned_to, created_at");
    leadsQuery = applyTenantFilter(leadsQuery);
    if (startDate) {
      leadsQuery = leadsQuery.gte("created_at", startDate);
    }
    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error("[getAgentKpiStats] Leads Error:", leadsError);
    }

    type AgentRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
    type DealRow = { id: string; created_by: string; commission_amount: number | null; deal_type: string; status: string };
    type LeadRow = { id: string; assigned_to: string | null };

    return calculateAgentStats(agents as AgentRow[], deals as unknown as DealRow[] || [], leads as unknown as LeadRow[] || []);
  } catch (error) {
    console.error("getAgentKpiStats Error:", error);
    return [];
  }
}

/**
 * Pure function to calculate stats from raw data.
 * Extracted for unit testing.
 */
export function calculateAgentStats(
  agents: any[],
  deals: any[],
  leads: any[]
): AgentKpiStats[] {
  return agents.map((agent) => {
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
      totalCommission: totalRevenue,
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
}
