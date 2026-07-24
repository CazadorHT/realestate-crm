import { requireAuthContext } from "@/lib/authz";

// --- V3 Hardened Interfaces ---

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

interface AgentRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface DealRow {
  id: string;
  agent_id: string | null;
  total_amount: number | null;
  commission_total: number | null;
  deal_type: string;
  status: string | null;
}

interface LeadRow {
  id: string;
  assigned_to: string | null;
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
    
    start.setHours(0, 0, 0, 0);
    if (timeframe === "month") start.setDate(1);
    else if (timeframe === "quarter") {
      start.setMonth(now.getMonth() - 3);
      start.setDate(1);
    }
    else if (timeframe === "year") {
      start.setMonth(0, 1);
    }
    else if (timeframe === "all") startDate = null;
    else start.setDate(1); // default month
    
    if (timeframe !== "all") {
      startDate = start.toISOString();
    }

    // Step 1: Query identities through tenant_members (V3 Tenant-specific Role)
    let agentQuery = supabase
      .from("tenant_members_v3")
      .select(`
        identity_id,
        role,
        identity:identities_v3!identity_id (
          id,
          display_name,
          email,
          avatar_url
        )
      `)
      .in("role", ["OWNER", "ADMIN", "MANAGER", "AGENT", "owner", "admin", "manager", "agent"]);

    if (tenantId && tenantId !== "ALL") {
      agentQuery = agentQuery.eq("tenant_id", tenantId);
    }
    if (agentId) {
      agentQuery = agentQuery.eq("identity_id", agentId);
    }

    const { data: rawAgents, error: identitiesError } = await agentQuery;

    if (identitiesError || !rawAgents) {
      console.error("[getAgentKpiStats] Identities Error:", identitiesError);
      return [];
    }

    // Map to normalized AgentRow & Deduplicate by identity_id
    const agentMap = new Map<string, AgentRow>();
    rawAgents.forEach(m => {
      if (!agentMap.has(m.identity_id)) {
        const iden = Array.isArray(m.identity) ? m.identity[0] : m.identity;
        const identityObj = (iden as Record<string, unknown> | null) || {};
        agentMap.set(m.identity_id, {
          id: m.identity_id,
          display_name: (identityObj.display_name as string) || "Unknown",
          email: (identityObj.email as string) || null,
          avatar_url: (identityObj.avatar_url as string) || null
        });
      }
    });
    const agents: AgentRow[] = Array.from(agentMap.values());

    // Step 3: Fetch financial records for revenue/deals from crm_deals_v3
    let dealsQuery = supabase
      .from("crm_deals_v3")
      .select("id, agent_id, total_amount, commission_total, deal_type, status, closed_at, created_at, commissions:crm_deal_commissions_v3(recipient_id, recipient_role, amount, net_amount)")
      .eq("status", "CLOSED_WIN");
    
    if (tenantId && tenantId !== "ALL") {
      dealsQuery = dealsQuery.eq("tenant_id", tenantId);
    }
    const { data: dealsRaw, error: dealsError } = await dealsQuery;

    if (dealsError) {
      console.error("[getAgentKpiStats] Deals Error:", dealsError);
    }

    // Filter deals in memory by date (handling null closed_at with fallback to created_at)
    const deals = (dealsRaw || []).filter((d: any) => {
      if (!startDate) return true;
      const dealDate = d.closed_at || d.created_at;
      return dealDate && new Date(dealDate).getTime() >= new Date(startDate).getTime();
    });

    // Step 4: Fetch assigned leads count for conversion rate (V3 Direct)
    let leadsQuery = supabase
      .from("crm_leads_v3")
      .select("id, assigned_to, created_at");
    
    if (tenantId && tenantId !== "ALL") {
      leadsQuery = leadsQuery.eq("tenant_id", tenantId);
    }
    if (startDate) {
      leadsQuery = leadsQuery.gte("created_at", startDate);
    }
    const { data: leads, error: leadsError } = await leadsQuery;

    return calculateAgentStats(
      agents as AgentRow[],
      (deals as DealRow[]) || [],
      (leads as LeadRow[]) || []
    );
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
  agents: AgentRow[],
  deals: DealRow[],
  leads: LeadRow[]
): AgentKpiStats[] {
  return agents.map((agent) => {
    // A deal belongs to agent if agent is primary agent_id or recipient in commissions
    const agentDeals = (deals || []).filter((d: any) => {
      if (d.agent_id === agent.id) return true;
      const comms = d.commissions || [];
      return comms.some((c: any) => c.recipient_id === agent.id);
    });

    const agentLeads = (leads || []).filter(
      (l) => l.assigned_to === agent.id,
    );

    let totalCommission = 0;
    let totalRevenue = 0;

    agentDeals.forEach((d: any) => {
      totalRevenue += d.total_amount || 0;
      const comms = d.commissions || [];
      const myComms = comms.filter((c: any) => c.recipient_id === agent.id);
      if (myComms.length > 0) {
        myComms.forEach((c: any) => {
          totalCommission += Number(c.net_amount ?? c.amount) || 0;
        });
      } else if (d.agent_id === agent.id) {
        // Fallback: if no recipient_id matches, check if deal has agent splits
        const otherSplits = comms
          .filter((c: any) => c.recipient_id && c.recipient_id !== agent.id)
          .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
        totalCommission += Math.max(0, (Number(d.commission_total) || 0) - otherSplits);
      }
    });

    const salesCount = agentDeals.filter(
      (d) => d.deal_type === "SALE",
    ).length;
    const rentCount = agentDeals.filter(
      (d) => d.deal_type === "RENT",
    ).length;

    return {
      agentId: agent.id,
      fullName: agent.display_name,
      email: agent.email,
      avatarUrl: agent.avatar_url,
      totalDeals: agentDeals.length,
      totalRevenue,
      totalCommission,
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
