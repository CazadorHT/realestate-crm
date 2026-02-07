import { requireAuthContext, assertStaff } from "@/lib/authz";
import type { LeadRow, LeadWithActivities } from "./types";
import type { Database } from "@/lib/database.types";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type PropertyImageRow = Database["public"]["Tables"]["property_images"]["Row"];

export type PropertySummary = Pick<
  PropertyRow,
  | "id"
  | "title"
  | "property_type"
  | "listing_type"
  | "status"
  | "price"
  | "original_price"
  | "rental_price"
  | "original_rental_price"
  | "currency"
> & {
  cover_url: string | null;
};

type ListArgs = {
  q?: string;
  stage?: string;
  page?: number;
  pageSize?: number;
};
// ใช้สำหรับแสดง leads หลายรายการ
export async function getLeadsQuery(args: ListArgs = {}) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const q = (args.q ?? "").trim();
  const stage = (args.stage ?? "").trim();
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(200, Math.max(5, args.pageSize ?? 10));

  let query = supabase
    .from("leads")
    .select("*, property:properties(id, title)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // ค้นชื่อ/เบอร์/อีเมล (ปรับ field ได้)
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }
  if (stage && stage !== "ALL") {
    query = query.eq("stage", stage as any);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const leads = data as LeadRow[];
  const leadIds = leads.map((l) => l.id);

  // fetch deals for these leads and compute counts client-side (avoid unsupported .group in types)
  let dealsCountMap: Record<string, number> = {};
  if (leadIds.length > 0) {
    const { data: dealsForLeads, error: dealsErr } = await supabase
      .from("deals")
      .select("id, lead_id")
      .in("lead_id", leadIds);

    if (!dealsErr && dealsForLeads) {
      (dealsForLeads as any[]).forEach((d) => {
        dealsCountMap[d.lead_id] = (dealsCountMap[d.lead_id] || 0) + 1;
      });
    }
  }

  // attach counts to leads (non-breaking addition)
  const leadsWithCounts = leads.map((l) => ({
    ...l,
    deals_count: dealsCountMap[l.id] ?? 0,
  }));

  return {
    data: leadsWithCounts as LeadRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Optimized query for Kanban view, fetching all active/recent leads (limited)
 */
export async function getLeadsForKanbanQuery() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? []) as LeadRow[];
}
// ใช้สำหรับแสดง leads รายเดียว
export async function getLeadByIdQuery(id: string): Promise<LeadRow | null> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error && "code" in error && error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data;
}
// ใช้สำหรับแสดง leads พร้อมกับ activities
export async function getLeadWithActivitiesQuery(
  id: string,
): Promise<LeadWithActivities | null> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { data, error } = await supabase
      .from("leads")
      .select(
        `
                *,
                lead_activities (
                id, lead_id, property_id, activity_type, note, created_by, created_at,
                properties ( id, title )
                )
            `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error && "code" in error && error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    const lead = data as unknown as LeadWithActivities;

    lead.lead_activities?.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return lead;
  } catch (error) {
    console.error("getLeadWithActivitiesQuery error:", error);
    return null;
  }
}
// ใช้สำหรับแสดง summary ของ property ที่มีใน leads
export async function getPropertySummariesByIdsQuery(ids: string[]) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);
  const uniq = Array.from(new Set(ids)).filter(Boolean);
  if (uniq.length === 0) return {} as Record<string, PropertySummary>;

  const { data: props, error: propsErr } = await supabase
    .from("properties")
    .select(
      "id,title,property_type,listing_type,status,price,original_price,rental_price,original_rental_price,currency",
    )
    .in("id", uniq);

  if (propsErr) throw new Error(propsErr.message);

  const { data: covers, error: coversErr } = await supabase
    .from("property_images")
    .select("property_id,image_url,is_cover,sort_order")
    .in("property_id", uniq)
    .eq("is_cover", true);

  if (coversErr) throw new Error(coversErr.message);

  const coverMap = new Map<string, PropertyImageRow>();
  (covers ?? []).forEach((c) => {
    // ถ้ามีหลาย cover ให้เลือกตัวแรก (ปกติควรมี 1)
    if (!coverMap.has(c.property_id)) coverMap.set(c.property_id, c as any);
  });

  const out: Record<string, PropertySummary> = {};
  (props ?? []).forEach((p) => {
    out[p.id] = {
      ...(p as any),
      cover_url: coverMap.get(p.id)?.image_url ?? null,
    };
  });

  return out;
}

// ใช้สำหรับ dashboard stats
export async function getLeadsDashboardStatsQuery() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  // 1. Total Count
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  // 2. Active Count (Not closed)
  const { count: activeLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .neq("stage", "CLOSED");

  // 3. New this month
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const { count: newLeadsMonth } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  // 4. Source distribution (for Chart/Cards)
  const { data: leads } = await supabase.from("leads").select("stage, source");

  const byStage: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  (leads || []).forEach((l) => {
    if (l.stage) byStage[l.stage] = (byStage[l.stage] || 0) + 1;
    if (l.source) bySource[l.source] = (bySource[l.source] || 0) + 1;
  });

  return {
    totalLeads: totalLeads || 0,
    activeLeads: activeLeads || 0,
    newLeadsMonth: newLeadsMonth || 0,
    byStage,
    bySource,
  };
}
