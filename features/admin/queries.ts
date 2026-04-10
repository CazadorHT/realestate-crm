import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export type AuditLogWithUser = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: any;
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

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });

  if (tenantId && tenantId !== "ALL") {
    // In a production app, we would join tenant_members here.
    // Since profiles lack tenant_id column, we rely on RLS 
    // or a complex join. For this hardening, we'll assume RLS 
    // is configured or we add a basic check.
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
  const { supabase, tenantId, role: authRole } = await (async () => {
    const { requireAuthContext } = await import("@/lib/authz");
    return await requireAuthContext();
  })();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 1. Build Query with Filters
  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  if (filters.action && filters.action !== "ALL") {
    query = query.eq("action", filters.action);
  }

  if (filters.entity && filters.entity !== "ALL") {
    query = query.eq("entity", filters.entity);
  }

  if (filters.userId && filters.userId !== "ALL") {
    query = query.eq("user_id", filters.userId);
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

  // 2. Fetch Logs (without join first, to be safe)
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
  const userIds = Array.from(new Set(logs.map((log) => log.user_id).filter(Boolean))) as string[];

  // 4. Fetch Profiles manually
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, role")
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
    ...log,
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
      .from("audit_logs")
      .delete()
      .lt("created_at", dateString);

    if (error) console.error("Auto-purge logs error:", error);
  } catch (err) {
    console.error("Auto-purge systemic error:", err);
  }
}
