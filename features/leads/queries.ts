import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { mapDbError } from "@/lib/db-error";
import { decrypt } from "@/lib/crypto";
import type { LeadRow, LeadWithActivities, LeadWithJoins } from "./types";
import type { Database } from "@/lib/database.types.generated";

type PropertyRow = Database["public"]["Tables"]["properties_core"]["Row"];
type PropertyImageRow = Database["public"]["Tables"]["property_media_v3"]["Row"];

export type PropertySummary = Pick<
  PropertyRow,
  | "id"
  | "property_type"
  | "listing_type"
  | "status"
  | "currency"
> & {
  title: string | null;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  cover_url: string | null;
};

type ListArgs = {
  q?: string;
  stage?: string;
  source?: string;
  page?: number;
  pageSize?: number;
};
// ใช้สำหรับแสดง leads หลายรายการ
export async function getLeadsQuery(args: ListArgs = {}) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const q = (args.q ?? "").trim();
  const stage = (args.stage ?? "").trim();
  const source = (args.source ?? "").trim();
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(200, Math.max(5, args.pageSize ?? 10));

  let query = supabase
    .from("crm_leads_v3")
    .select("id, stage, source, budget_min, budget_max, created_at, updated_at, tenant_id, assigned_to, ai_summary, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone)", { count: "exact" });

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  query = query.order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
      { foreignTable: "identities_v3" }
    );
  }
  if (stage && stage !== "ALL") {
    query = query.eq("stage", stage);
  }
  if (source && source !== "ALL") {
    query = query.eq("source", source);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) throw new Error(mapDbError(error));

  const leads = (data || []).map((l: any) => ({
    ...l,
    full_name: decrypt(l.identity?.display_name) || "Unknown",
    phone: decrypt(l.identity?.phone) || null,
    email: decrypt(l.identity?.email) || null,
    note: l.ai_summary || null,
  })) as unknown as LeadWithJoins[];
  const leadIds = leads.map((l) => l.id);

  // fetch deals for these leads and compute counts client-side
  let dealsCountMap: Record<string, number> = {};
  if (leadIds.length > 0) {
    const { data: dealsForLeads, error: dealsErr } = await supabase
      .from("crm_deals_v3")
      .select("id, lead_id")
      .in("lead_id", leadIds);

    if (!dealsErr && dealsForLeads) {
      (dealsForLeads as { lead_id: string }[]).forEach((d) => {
        dealsCountMap[d.lead_id] = (dealsCountMap[d.lead_id] || 0) + 1;
      });
    }
  }

  // attach counts to leads
  const leadsWithCounts = leads.map((l) => ({
    ...l,
    deals_count: dealsCountMap[l.id] ?? 0,
  }));

  return {
    data: leadsWithCounts as LeadWithJoins[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Fetch ONLY IDs of all leads matching the filters (no pagination)
 * Used for "Select All across pages" feature.
 */
export async function getAllLeadIdsQuery(args: { q?: string; stage?: string; source?: string } = {}) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const q = (args.q ?? "").trim();
  const stage = (args.stage ?? "").trim();
  const source = (args.source ?? "").trim();

  let query = supabase.from("crm_leads_v3").select("id, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, phone, email)");

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
      { foreignTable: "identities_v3" }
    );
  }
  if (stage && stage !== "ALL") {
    query = query.eq("stage", stage);
  }
  if (source && source !== "ALL") {
    query = query.eq("source", source);
  }

  const { data, error } = await query;
  if (error) throw new Error(mapDbError(error));

  return (data || []).map((l) => l.id);
}

/**
 * Optimized query for Kanban view, fetching all active/recent leads (limited)
 */
export async function getLeadsForKanbanQuery() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("crm_leads_v3")
    .select("id, stage, source, budget_min, budget_max, created_at, updated_at, tenant_id, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name)");

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(mapDbError(error));

  return (data || []).map((l: any) => ({
    ...l,
    full_name: decrypt(l.identity?.display_name) || "Unknown",
  })) as unknown as LeadWithJoins[];
}
// ใช้สำหรับแสดง leads รายเดียว
export async function getLeadByIdQuery(id: string): Promise<LeadWithJoins | null> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("crm_leads_v3")
    .select("id, stage, source, budget_min, budget_max, min_bedrooms, preferred_locations, ai_summary, created_at, updated_at, tenant_id, assigned_to, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone, line_id, social_links)")
    .eq("id", id);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error && "code" in error && error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  
  const lead: any = data;
  const utmData = (lead.utm_data as Record<string, any>) || {};
  const prefs = utmData.preferences || {};
  const socialLinks = lead.identity?.social_links || {};
  return {
    ...lead,
    full_name: decrypt(lead.identity?.display_name) || "Unknown",
    email: decrypt(lead.identity?.email) || null,
    phone: decrypt(lead.identity?.phone) || null,
    line_id: decrypt(lead.identity?.line_id) || null,
    wechat_id: decrypt(socialLinks.wechat_id) || null,
    whatsapp: decrypt(socialLinks.whatsapp) || null,
    facebook_psid: decrypt(socialLinks.facebook_psid) || null,
    instagram_sid: decrypt(socialLinks.instagram_sid) || null,
    pdpa_consent: !!utmData.pdpa_consent,
    consent_date: utmData.consent_date || null,
    ai_summary_content: lead.ai_summary || null,
    
    // preferences unpacks
    preferences: prefs,
    note: prefs.note || lead.ai_summary || null,
    nationality: prefs.nationality || null,
    is_foreigner: !!prefs.is_foreigner,
    preferred_property_types: prefs.property_types || null,
    min_bedrooms: lead.min_bedrooms !== null && lead.min_bedrooms !== undefined ? Number(lead.min_bedrooms) : (prefs.min_bedrooms ? Number(prefs.min_bedrooms) : null),
    min_bathrooms: prefs.min_bathrooms || null,
    min_size_sqm: prefs.min_size || null,
    max_size_sqm: prefs.max_size || null,
    num_occupants: prefs.occupants || null,
    has_pets: !!prefs.has_pets,
    need_company_registration: !!prefs.need_company,
    allow_airbnb: !!prefs.allow_airbnb,
    property_id: prefs.property_id || null,
  } as unknown as LeadWithJoins;
}
// ใช้สำหรับแสดง leads พร้อมกับ activities
export async function getLeadWithActivitiesQuery(
  id: string,
): Promise<LeadWithActivities | null> {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;

    let query = supabase
      .from("crm_leads_v3")
      .select("id, stage, source, budget_min, budget_max, min_bedrooms, preferred_locations, ai_summary, created_at, updated_at, tenant_id, assigned_to, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone, line_id, social_links)")
      .eq("id", id);

    if (isMultiTenant && tenantId && tenantId !== "ALL") {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error && "code" in error && error.code === "PGRST116") return null;
      throw new Error(mapDbError(error));
    }
    const lead: any = data;
    
    // Fetch activities separately due to polymorphic relation
    const { data: activities } = await supabase
      .from("activity_timeline_v3")
      .select("id, activity_type, description, created_at, metadata, actor_id, actor:identities_v3!activity_timeline_v3_actor_id_fkey(display_name, avatar_url)")
      .eq("target_entity", "LEAD")
      .eq("target_id", id)
      .order("created_at", { ascending: false });

    const utmData = (lead.utm_data as Record<string, any>) || {};
    const prefs = utmData.preferences || {};
    const socialLinks = lead.identity?.social_links || {};
    return {
      ...lead,
      full_name: decrypt(lead.identity?.display_name) || "Unknown",
      email: decrypt(lead.identity?.email) || null,
      phone: decrypt(lead.identity?.phone) || null,
      line_id: decrypt(lead.identity?.line_id) || null,
      wechat_id: decrypt(socialLinks.wechat_id) || null,
      whatsapp: decrypt(socialLinks.whatsapp) || null,
      facebook_psid: decrypt(socialLinks.facebook_psid) || null,
      instagram_sid: decrypt(socialLinks.instagram_sid) || null,
      pdpa_consent: !!utmData.pdpa_consent,
      consent_date: utmData.consent_date || null,
      ai_summary_content: lead.ai_summary || null,
      
      // preferences unpacks
      preferences: prefs,
      note: prefs.note || lead.ai_summary || null,
      nationality: prefs.nationality || null,
      is_foreigner: !!prefs.is_foreigner,
      preferred_property_types: prefs.property_types || null,
      min_bedrooms: lead.min_bedrooms !== null && lead.min_bedrooms !== undefined ? Number(lead.min_bedrooms) : (prefs.min_bedrooms ? Number(prefs.min_bedrooms) : null),
      min_bathrooms: prefs.min_bathrooms || null,
      min_size_sqm: prefs.min_size || null,
      max_size_sqm: prefs.max_size || null,
      num_occupants: prefs.occupants || null,
      has_pets: !!prefs.has_pets,
      need_company_registration: !!prefs.need_company,
      allow_airbnb: !!prefs.allow_airbnb,
      property_id: prefs.property_id || null,
      
      lead_activities: (activities || []).map((a: any) => ({
        ...a,
        profiles: a.actor ? { full_name: a.actor.display_name, avatar_url: a.actor.avatar_url } : null,
        note: a.description,
        created_by: a.actor_id
      }))
    } as unknown as LeadWithActivities;
  } catch (error) {
    console.error("getLeadWithActivitiesQuery error:", error);
    return null;
  }
}
// ใช้สำหรับแสดง summary ของ property ที่มีใน leads
export async function getPropertySummariesByIdsQuery(ids: string[]) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const uniq = Array.from(new Set(ids)).filter(Boolean);
  if (uniq.length === 0) return {} as Record<string, PropertySummary>;

  let query = supabase
    .from("properties_core")
    .select(
      "id,property_type,listing_type,status,sale_price,rent_price,currency",
    )
    .is("deleted_at", null)
    .in("id", uniq);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data: props, error: propsErr } = await query;

  if (propsErr) throw new Error(mapDbError(propsErr));

  const { data: covers, error: coversErr } = await supabase
    .from("property_media_v3")
    .select("property_id,url,is_cover,sort_order")
    .in("property_id", uniq)
    .eq("is_cover", true);

  if (coversErr) throw new Error(mapDbError(coversErr));

  const coverMap = new Map<string, string>();
  (covers ?? []).forEach((c: any) => {
    // ถ้ามีหลาย cover ให้เลือกตัวแรก (ปกติควรมี 1)
    if (!coverMap.has(c.property_id)) coverMap.set(c.property_id, c.url);
  });

  const out: Record<string, PropertySummary> = {};
  (props ?? []).forEach((p: any) => {
    out[p.id] = {
      id: p.id,
      title: p.title || "No Title",
      property_type: p.property_type,
      listing_type: p.listing_type,
      status: p.status,
      price: p.sale_price,
      original_price: null,
      rental_price: p.rent_price,
      original_rental_price: null,
      currency: p.currency,
      cover_url: coverMap.get(p.id) ?? null,
    };
  });

  return out;
}

// ใช้สำหรับ dashboard stats
export async function getLeadsDashboardStatsQuery() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // 1. Total Count
  let totalQuery = supabase
    .from("crm_leads_v3")
    .select("id", { count: "exact", head: true });

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    totalQuery = totalQuery.eq("tenant_id", tenantId);
  }
  const { count: totalLeads } = await totalQuery;

  // 2. Active Count (Not closed)
  let activeQuery = supabase
    .from("crm_leads_v3")
    .select("id", { count: "exact", head: true })
    .neq("stage", "CLOSED");

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    activeQuery = activeQuery.eq("tenant_id", tenantId);
  }
  const { count: activeLeads } = await activeQuery;

  // 3. New this month
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  let newQuery = supabase
    .from("crm_leads_v3")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    newQuery = newQuery.eq("tenant_id", tenantId);
  }
  const { count: newLeadsMonth } = await newQuery;

  // 4. Source distribution (for Chart/Cards)
  let distributionQuery = supabase
    .from("crm_leads_v3")
    .select("stage, source");

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    distributionQuery = distributionQuery.eq("tenant_id", tenantId);
  }
  const { data: leads } = await distributionQuery;

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
