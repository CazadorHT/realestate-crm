import { createClient } from "@/lib/supabase/server";
import { Notification, AgendaEvent } from "./types";
import { formatTimeAgo } from "@/lib/utils";
import { Database } from "@/lib/database.types.generated";

type DealRow = Database["public"]["Tables"]["crm_deals_v3"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["activity_timeline_v3"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface LeadWithIdentity {
  id: string;
  created_at: string | null;
  source: string | null;
  identity: { display_name: string | null } | null;
}

interface AgendaLeadWithIdentity {
  id: string;
  created_at: string | null;
  lead_type?: string | null;
  identity: { display_name: string | null } | null;
}

interface ContractRow {
  id: string;
  transaction_end_date: string | null;
  transaction_date: string | null;
  metadata: unknown;
  property: { title: string } | null;
}

export async function getRecentNotifications(
  preferences: Record<string, boolean> | null = null,
  tenantId?: string | null,
  userId?: string,
): Promise<Notification[]> {
  try {
    const supabase = await createClient();
    const notifications: Notification[] = [];

    const applyFilters = <T extends { eq: (column: string, value: string) => T }>(query: T, customColumn?: string): T => {
      let filteredQuery = query;
      if (tenantId && tenantId !== "ALL") {
        filteredQuery = filteredQuery.eq("tenant_id", tenantId) as unknown as T;
      }
      if (userId && userId !== "ALL") {
        filteredQuery = filteredQuery.eq(customColumn || "actor_id", userId) as unknown as T;
      }
      return filteredQuery;
    };

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
        ? applyFilters(
            supabase
              .from("crm_leads_v3")
              .select("id, created_at, source, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name)")
              .eq("source", "WEBSITE")
              .gte("created_at", isoLimit)
              .order("created_at", { ascending: false }),
            "assigned_to",
          )
        : Promise.resolve({ data: [] }),

      // New Profiles (Admin use case)
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at, role")
        .gte("created_at", isoLimit)
        .order("created_at", { ascending: false }),

      // Audit Logs (Status Updates, Price Drops, Logic Alerts)
      applyFilters(
        supabase
          .from("activity_timeline_v3")
          .select(
            "id, activity_type, created_at, metadata, actor_id, target_entity, target_id",
          )
          .gte("created_at", isoLimit)
          .order("created_at", { ascending: false }),
        "actor_id"
      ),

      // Activities (New Activities) - Remove invalid foreign key join to crm_leads_v3
      checkPref("activity")
        ? applyFilters(
            supabase
              .from("activity_timeline_v3")
              .select(
                "id, created_at, target_id, activity_type, description, metadata",
              )
              .eq("target_entity", "crm_leads_v3")
              .gte("created_at", isoLimit)
              .order("created_at", { ascending: false }),
            "actor_id",
          )
        : Promise.resolve({ data: [] }),

      // Assignments logic usually is in audit_logs, but let's check specifically for property_agents or similar
      Promise.resolve({ data: [] }), // Placeholder if handled in logs

      // Contract Expiry - Check rental contracts expiring in next 30 days (Fix deal_type to 'RENT')
      checkPref("contract_expiry")
        ? applyFilters(
            supabase
              .from("crm_deals_v3")
              .select(
                "id, transaction_end_date, transaction_date, metadata, property:properties(title)",
              )
              .eq("deal_type", "RENT")
              .eq("status", "WON")
              .not("transaction_end_date", "is", null)
              .gte("transaction_end_date", new Date().toISOString())
              .order("transaction_end_date", { ascending: true }),
            "created_by"
          )
        : Promise.resolve({ data: [] }),
    ]);

    const recentLeads = (leadsResult.data as unknown as LeadWithIdentity[]) || [];
    const recentProfiles = (profilesResult.data as unknown as ProfileRow[]) || [];
    const recentLogs = (logsResult.data as AuditLogRow[]) || [];
    const recentActivities = (activitiesResult.data as AuditLogRow[]) || [];

    // 1. New Leads
    recentLeads.forEach((lead) => {
      const displayName = lead.identity?.display_name || "ลูกค้า";
      const displayNameEn = lead.identity?.display_name || "Lead";
      notifications.push({
        id: `lead-${lead.id}`,
        message: `Lead ใหม่จากหน้าเว็บ: ${displayName}`,
        messageEn: `New website lead: ${displayNameEn}`,
        type: "success",
        time: formatTimeAgo(lead.created_at || new Date().toISOString()),
        read: false,
        href: `/protected/leads/${lead.id}`,
        createdAt: new Date(lead.created_at || new Date().toISOString()).getTime(),
        category: "new_lead",
      });
    });

    // 2. Audit Logs
    recentLogs.forEach((log) => {
      const meta = (log.metadata as Record<string, unknown>) || {};
      const timeStr = formatTimeAgo(log.created_at || new Date().toISOString());
      const createdAt = new Date(log.created_at || new Date().toISOString()).getTime();

      // Price Drops
      if (
        checkPref("price_drop") &&
        log.activity_type === "property.update" &&
        meta?.price_change
      ) {
        notifications.push({
          id: `price-${log.id}`,
          message: `ลดราคา! ${String(meta.title || "ทรัพย์")}: ฿${Number(meta.old_price || 0).toLocaleString()} → ฿${Number(meta.new_price || 0).toLocaleString()}`,
          messageEn: `Price Drop! ${String(meta.title || "Property")}: ฿${Number(meta.old_price || 0).toLocaleString()} → ฿${Number(meta.new_price || 0).toLocaleString()}`,
          type: "warning",
          time: timeStr,
          read: false,
          href: `/protected/properties/${log.target_id}`,
          createdAt,
          category: "price_drop",
        });
      }

      // Status Updates
      if (
        checkPref("status_update") &&
        meta?.status_update &&
        log.activity_type.includes(".update")
      ) {
        notifications.push({
          id: `status-${log.id}`,
          message: `เปลี่ยนสถานะ ${log.target_entity}: ${String(meta.new_stage || meta.new_status || "")}`,
          messageEn: `Status updated for ${log.target_entity}: ${String(meta.new_stage || meta.new_status || "")}`,
          type: "info",
          time: timeStr,
          read: false,
          href: `/protected/${log.target_entity === "crm_leads_v3" ? "leads" : "properties"}/${log.target_id}`,
          createdAt,
          category: "status_update",
        });
      }

      // Login (Security)
      if (log.activity_type === "LOGIN") {
        notifications.push({
          id: `login-${log.id}`,
          message: `เข้าสู่ระบบ: ${String(meta?.email || "User")}`,
          messageEn: `User Login: ${String(meta?.email || "User")}`,
          type: "info",
          time: timeStr,
          read: false,
          createdAt,
        });
      }
    });

    // 3. New Activities
    recentActivities.forEach((act) => {
      const meta = (act.metadata as Record<string, unknown>) || {};
      const leadName = String(meta.lead_name || meta.full_name || "ลูกค้า");
      const leadNameEn = String(meta.lead_name || meta.full_name || "Lead");
      notifications.push({
        id: `act-${act.id}`,
        message: `กิจกรรมใน Lead ${leadName}: ${act.activity_type}`,
        messageEn: `Activity on Lead ${leadNameEn}: ${act.activity_type}`,
        type: "info",
        time: formatTimeAgo(act.created_at || new Date().toISOString()),
        read: false,
        href: `/protected/leads/${act.target_id}`,
        createdAt: new Date(act.created_at || new Date().toISOString()).getTime(),
        category: "activity",
      });
    });

    // 4. New Registrations (Profiles)
    recentProfiles.forEach((profile) => {
      const userName = profile.full_name || profile.email || "Member";
      notifications.push({
        id: `user-${profile.id}`,
        message: `สมาชิกใหม่: ${userName}`,
        messageEn: `New Member: ${userName}`,
        type: "info",
        time: formatTimeAgo(profile.created_at || new Date().toISOString()),
        read: false,
        createdAt: new Date(profile.created_at || new Date().toISOString()).getTime(),
      });
    });

    // 5. Contract Expiry (Contracts expiring in 30 days)
    const expiringContracts = (expiringContractsResult.data as unknown as ContractRow[]) || [];
    const now = new Date();

    expiringContracts.forEach((contract) => {
      if (!contract.transaction_end_date) return;
      const endDate = new Date(contract.transaction_end_date);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only show contracts expiring within 30 days
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
        const propertyTitle = contract.property?.title || "ทรัพย์สิน";
        const propertyTitleEn = contract.property?.title || "Property";
        const type = daysUntilExpiry <= 7 ? "alert" : "warning";

        notifications.push({
          id: `contract-${contract.id}`,
          message: `สัญญาใกล้หมดอายุ: ${propertyTitle} (อีก ${daysUntilExpiry} วัน)`,
          messageEn: `Contract Expiring Soon: ${propertyTitleEn} (in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"})`,
          type,
          time: `${daysUntilExpiry} วันข้างหน้า`,
          read: false,
          href: `/protected/deals/${contract.id}`,
          createdAt: endDate.getTime(), // Sort by expiry date
          category: "contract_expiry",
          daysUntilExpiry,
        });
      }
    });

    return notifications.sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    );
  } catch (error) {
    console.error("getRecentNotifications Error:", error);
    return [];
  }
}

export async function getTodayAgenda(
  tenantId?: string | null,
  userId?: string,
): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const applyFilters = <T extends { eq: (column: string, value: string) => T }>(query: T, customColumn?: string): T => {
    let filteredQuery = query;
    if (tenantId && tenantId !== "ALL") {
      filteredQuery = filteredQuery.eq("tenant_id", tenantId) as unknown as T;
    }
    if (userId && userId !== "ALL") {
      filteredQuery = filteredQuery.eq(customColumn || "created_by", userId) as unknown as T;
    }
    return filteredQuery;
  };

  // 1. Fetch New Leads Today
  const { data: newLeads } = await applyFilters(
    supabase
      .from("crm_leads_v3")
      .select("id, created_at, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name)")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false }),
    "assigned_to",
  );

  // 2. Fetch New Deals Today
  const { data: newDeals } = await applyFilters(
    supabase
      .from("crm_deals_v3")
      .select("id, deal_type, created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false }),
  );

  const agenda: AgendaEvent[] = [];

  // Map Leads to "Call" tasks
  const leadsList = (newLeads as unknown as AgendaLeadWithIdentity[]) || [];
  leadsList.forEach((lead) => {
    const displayName = lead.identity?.display_name || "ลูกค้า";
    agenda.push({
      id: `lead-${lead.id}`,
      time: lead.created_at ? new Date(lead.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) : "--:--",
      title: `ติดต่อลูกค้าใหม่: ${displayName}`,
      type: "call",
      priority: "high",
    });
  });

  // Map Deals to "Meeting" or "Task"
  const dealsList = (newDeals as DealRow[]) || [];
  dealsList.forEach((deal) => {
    agenda.push({
      id: `deal-${deal.id}`,
      time: deal.created_at ? new Date(deal.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) : "--:--",
      title: `ดำเนินการดีลใหม่ (${deal.deal_type})`,
      type: "meeting",
      priority: "medium",
    });
  });

  // Sort by time desc
  return agenda.sort((a, b) => b.time.localeCompare(a.time));
}

