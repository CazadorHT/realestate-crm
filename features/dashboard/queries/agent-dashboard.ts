import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { subDays, addDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { decrypt } from "@/lib/crypto";

export interface AgentDashboardStats {
  revenueThisMonth: number;
  revenueChange: string;
  leadsThisMonth: number;
  leadsChange: string;
  dealsWon: number;
  dealsWonChange: string;
  conversionRate: number;
}

export interface AgentTask {
  id: string;
  type: "STALE_LEAD" | "EXPIRING_CONTRACT" | "FOLLOW_UP";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
  link: string;
  phone?: string | null;
  line_id?: string | null;
  ai_score?: number | null;
  customerName?: string;
}

export async function getAgentDashboardStats(): Promise<AgentDashboardStats> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  const now = new Date();
  const currentMonthStart = startOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const [
    { data: revenueCurrent },
    { data: revenueLast },
    { count: leadsCurrent },
    { count: leadsLast },
    { count: totalDealsWon },
    { count: totalLeads },
  ] = await Promise.all([
    // 1. Personal Commissions This Month (Paid or pending but closed this month)
    supabase
      .from("financial_ledger_v3")
      .select("amount_total")
      .eq("to_identity_id", profile.id)
      .eq("transaction_type", "commission_payout")
      .gte("created_at", currentMonthStart),
    // 2. Personal Commissions Last Month
    supabase
      .from("financial_ledger_v3")
      .select("amount_total")
      .eq("to_identity_id", profile.id)
      .eq("transaction_type", "commission_payout")
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd),
    // 3. Personal Leads This Month
    supabase
      .from("crm_leads_v3")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .gte("created_at", currentMonthStart),
    // 4. Personal Leads Last Month
    supabase
      .from("crm_leads_v3")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd),
    // 5. Total Deals Won (Ever or this month? Let's do this month for consistency)
    supabase
      .from("financial_ledger_v3")
      .select("id", { count: "exact", head: true })
      .eq("to_identity_id", profile.id)
      .eq("transaction_type", "deal_closed")
      .gte("created_at", currentMonthStart),
    // 6. Total Leads Assigned (for overall conversion)
    supabase
      .from("crm_leads_v3")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id),
  ]);

  const totalRevenueCurrent = (revenueCurrent || []).reduce((sum: number, r: { amount_total: number | null }) => sum + (Number(r.amount_total) || 0), 0);
  const totalRevenueLast = (revenueLast || []).reduce((sum: number, r: { amount_total: number | null }) => sum + (Number(r.amount_total) || 0), 0);

  const revenueChange = totalRevenueLast === 0 ? "+100%" : `${(((totalRevenueCurrent - totalRevenueLast) / totalRevenueLast) * 100).toFixed(1)}%`;
  const leadsChange = (leadsLast || 0) === 0 ? "+100%" : `${((((leadsCurrent || 0) - (leadsLast || 0)) / leadsLast!) * 100).toFixed(1)}%`;
  
  const conversionRate = (totalLeads || 0) === 0 ? 0 : Number(((totalDealsWon || 0) / (totalLeads || 1) * 100).toFixed(1));

  return {
    revenueThisMonth: totalRevenueCurrent,
    revenueChange: revenueChange.startsWith("-") ? revenueChange : `+${revenueChange}`,
    leadsThisMonth: leadsCurrent || 0,
    leadsChange: leadsChange.startsWith("-") ? leadsChange : `+${leadsChange}`,
    dealsWon: totalDealsWon || 0,
    dealsWonChange: "0", // Could calculate vs last month if needed
    conversionRate,
  };
}

export async function getAgentTasks(targetUserId?: string): Promise<AgentTask[]> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const effectiveUserId = targetUserId || profile.id;

  const threeDaysAgo = subDays(new Date(), 3).toISOString();
  const thirtyDaysFromNow = addDays(new Date(), 30).toISOString();

  interface LeadRow {
    id: string;
    full_name: string;
    updated_at: string;
    stage: string;
    phone: string | null;
    line_id: string | null;
    ai_score: number | null;
  }

  interface ContractRow {
    id: string;
    transaction_end_date: string | null;
    property: {
      title: string;
    } | null;
  }

  const [staleLeadsRes, expiringContractsRes] = await Promise.all([
    supabase
      .from("crm_leads_v3")
      .select("id, full_name, updated_at, stage, phone, line_id, ai_score")
      .eq("assigned_to", effectiveUserId)
      .neq("stage", "CLOSED")
      .lte("updated_at", threeDaysAgo)
      .order("ai_score", { ascending: false })
      .limit(5) as Promise<{ data: LeadRow[] | null }>,
    supabase
      .from("crm_deals_v3")
      .select(`
        id, 
        transaction_end_date, 
        property:properties!inner (title)
      `)
      .eq("created_by", effectiveUserId)
      .eq("deal_type", "RENTAL")
      .eq("status", "WON")
      .lte("transaction_end_date", thirtyDaysFromNow)
      .gte("transaction_end_date", new Date().toISOString())
      .order("transaction_end_date", { ascending: true })
      .limit(5) as Promise<{ data: ContractRow[] | null }>,
  ]);

  const tasks: AgentTask[] = [];

  (staleLeadsRes.data || []).forEach((lead: LeadRow) => {
    const customerName = decrypt(lead.full_name) || "ลูกค้า";
    tasks.push({
      id: lead.id,
      type: "STALE_LEAD",
      title: "ลูกค้าขาดการติดต่อ",
      description: `คุณ ${customerName} ไม่มีการเคลื่อนไหวเกิน 3 วัน`,
      priority: (lead.ai_score || 0) >= 80 ? "HIGH" : "MEDIUM",
      link: `/protected/leads/${lead.id}`,
      phone: lead.phone ? decrypt(lead.phone) : null,
      line_id: lead.line_id ? decrypt(lead.line_id) : null,
      ai_score: lead.ai_score,
      customerName,
    });
  });

  (expiringContractsRes.data || []).forEach((contract: any) => {
    tasks.push({
      id: contract.id,
      type: "EXPIRING_CONTRACT",
      title: "สัญญาเช่ากำลังจะหมดอายุ",
      description: `ทรัพย์: ${contract.property?.title || "ไม่ระบุ"}`,
      priority: "MEDIUM",
      dueDate: contract.transaction_end_date || undefined,
      link: `/protected/contracts/${contract.id}`,
    });
  });

  return tasks.sort((a, b) => {
    if (a.priority === "HIGH" && b.priority !== "HIGH") return -1;
    if (a.priority !== "HIGH" && b.priority === "HIGH") return 1;
    return (b.ai_score || 0) - (a.ai_score || 0);
  });
}
