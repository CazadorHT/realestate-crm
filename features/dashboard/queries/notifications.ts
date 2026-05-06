import { createClient } from "@/lib/supabase/server";
import { Notification, AgendaEvent } from "./types";
import { formatTimeAgo } from "@/lib/utils";
import { PostgrestFilterBuilder } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type ActivityRow = Database["public"]["Tables"]["lead_activities"]["Row"] & { leads: { full_name: string } | null };
type ContractRow = Database["public"]["Tables"]["rental_contracts"]["Row"] & { deals: { property_id: string; properties: { title: string } | null } | null };

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
        filteredQuery = filteredQuery.eq(customColumn || "user_id", userId) as unknown as T;
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
              .from("leads")
              .select("id, full_name, created_at, source")
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
          .from("audit_logs")
          .select(
            "id, action, created_at, metadata, user_id, entity, entity_id",
          )
          .gte("created_at", isoLimit)
          .order("created_at", { ascending: false }),
      ),

      // Activities (New Activities)
      checkPref("activity")
        ? applyFilters(
            supabase
              .from("lead_activities")
              .select(
                "id, created_at, lead_id, activity_type, note, leads(full_name)",
              )
              .gte("created_at", isoLimit)
              .order("created_at", { ascending: false }),
            "created_by",
          )
        : Promise.resolve({ data: [] }),

      // Assignments logic usually is in audit_logs, but let's check specifically for property_agents or similar
      Promise.resolve({ data: [] }), // Placeholder if handled in logs

      // Contract Expiry - Check rental contracts expiring in next 30 days
      checkPref("contract_expiry")
        ? applyFilters(
            supabase
              .from("rental_contracts")
              .select(
                "id, deal_id, end_date, start_date, rent_price, deals(property_id, properties(title))",
              )
              .eq("status", "ACTIVE")
              .not("end_date", "is", null)
              .gte("end_date", new Date().toISOString())
              .order("end_date", { ascending: true }),
          )
        : Promise.resolve({ data: [] }),
    ]);

    const recentLeads = leadsResult.data || [];
    const recentProfiles = profilesResult.data || [];
    const recentLogs = logsResult.data || [];
    const recentActivities = activitiesResult.data || [];

    // 1. New Leads
    (recentLeads as LeadRow[]).forEach((lead) => {
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
    (recentLogs as AuditLogRow[]).forEach((log) => {
      const meta = log.metadata as Record<string, any>;
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

      // Login (Security)
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
    (recentActivities as ActivityRow[]).forEach((act) => {
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
    (recentProfiles as (Database["public"]["Tables"]["profiles"]["Row"])[]).forEach((profile) => {
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

    (expiringContracts as ContractRow[]).forEach((contract) => {
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
      .from("leads")
      .select("id, full_name, created_at, lead_type")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false }),
    "assigned_to",
  );

  // 2. Fetch New Deals Today
  const { data: newDeals } = await applyFilters(
    supabase
      .from("deals")
      .select("id, deal_type, created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false }),
  );

  const agenda: AgendaEvent[] = [];

  // Map Leads to "Call" tasks
  (newLeads as LeadRow[])?.forEach((lead) => {
    agenda.push({
      id: `lead-${lead.id}`,
      time: lead.created_at ? new Date(lead.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }) : "--:--",
      title: `ติดต่อลูกค้าใหม่: ${lead.full_name}`,
      type: "call",
      priority: "high",
    });
  });

  // Map Deals to "Meeting" or "Task"
  (newDeals as DealRow[])?.forEach((deal) => {
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

