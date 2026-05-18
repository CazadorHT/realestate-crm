import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export type AuditLogWithUser = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: import("@/lib/database.types.generated").Json;
  created_at: string;
  user_id: string | null;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    role: string | null;
  } | null;
};

export async function getAllUsers() {
  noStore();
  const { supabase, tenantId } = await (async () => {
    const { requireAuthContext } = await import("@/lib/authz");
    return await requireAuthContext();
  })();

  // Query V3 Core identity table directly and alias display_name to full_name
  // to maintain perfect compatibility with existing UI interfaces
  let query = supabase
    .from("identities_v3")
    .select("id, full_name:display_name, email, role")
    .order("display_name", { ascending: true });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data;
}

export async function getAuditLogs({
  page = 1,
  pageSize = 50,
  filters = {},
}: {
  page?: number;
  pageSize?: number;
  filters?: {
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  noStore();
  const { supabase, tenantId } = await (async () => {
    const { requireAuthContext } = await import("@/lib/authz");
    return await requireAuthContext();
  })();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 1. Build Query with Filters using specific field projections from V3 Core table (Faster & Economical)
  // Aliasing columns to match legacy UI interfaces exactly
  let query = supabase
    .from("system_audit_logs_v3")
    .select(
      "id, action, entity:entity_table, entity_id, metadata:new_data, user_id:actor_id, tenant_id, created_at",
      { count: "exact" },
    );

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  if (filters.action && filters.action !== "ALL") {
    query = query.eq("action", filters.action);
  }

  if (filters.entity && filters.entity !== "ALL") {
    query = query.eq("entity_table", filters.entity);
  }

  if (filters.userId && filters.userId !== "ALL") {
    query = query.eq("actor_id", filters.userId);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    const end = filters.endDate.includes("T")
      ? filters.endDate
      : `${filters.endDate}T23:59:59.999Z`;
    query = query.lte("created_at", end);
  }

  // 2. Fetch Logs (without join first, to be safe and performant)
  const {
    data: logs,
    error: logsError,
    count,
  } = await query.order("created_at", { ascending: false }).range(from, to);

  if (logsError) {
    console.error(
      "Error fetching audit logs:",
      JSON.stringify(logsError, null, 2),
    );
    return { data: [], count: 0 };
  }

  if (!logs || logs.length === 0) {
    return { data: [], count: 0 };
  }

  // 3. Extract User IDs (Filtering out nulls)
  const userIds = Array.from(
    new Set(logs.map((log) => log.user_id).filter(Boolean)),
  ) as string[];

  // 4. Fetch Profiles manually from V3 Core Identity table
  const { data: profiles, error: profilesError } = await supabase
    .from("identities_v3")
    .select("id, full_name:display_name, avatar_url, email, role")
    .in("id", userIds);

  if (profilesError) {
    console.error(
      "Error fetching profiles for audit logs:",
      JSON.stringify(profilesError, null, 2),
    );
    // Proceed with available logs, user will be null
  }

  // 5. Map profiles to logs
  const profileMap = new Map(profiles?.map((p) => [p.id, p]));

  const formattedData: AuditLogWithUser[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entity_id: log.entity_id,
    metadata: log.metadata || {},
    created_at: log.created_at,
    user_id: log.user_id,
    user: log.user_id ? (profileMap.get(log.user_id) || null) : null,
  }));

  return {
    data: formattedData,
    count: count || 0,
  };
}

export async function autoPurgeOldLogs() {
  const supabase = await createClient();

  // Calculate the date 30 days ago
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 30);
  const dateString = ninetyDaysAgo.toISOString();

  try {
    const { error } = await supabase
      .from("system_audit_logs_v3")
      .delete()
      .lt("created_at", dateString);

    if (error) console.error("Auto-purge logs error:", error);
  } catch (err) {
    console.error("Auto-purge systemic error:", err);
  }
}
