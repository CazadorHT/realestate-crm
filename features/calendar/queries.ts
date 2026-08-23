import { requireAuthContext, AuthContext, UserRole } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types.generated";
import { formatISO } from "date-fns";
import { cookies } from "next/headers";

export type EventType =
  | "viewing"
  | "follow_up"
  | "call"
  | "line_chat"
  | "contract_start"
  | "contract_end"
  | "early_termination"
  | "deal_closing";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO String
  end?: string; // ISO String
  type: EventType;
  meta?: {
    leadId?: string;
    note?: string;
    propertyTitle?: string;
    propertyId?: string;
    propertyImage?: string | null;
    contractNumber?: string;
    type?: string;
    leaseTermMonths?: number;
    rentPrice?: number;
    startDate?: string;
    endDate?: string;
    leadName?: string;
    start?: string;
    agentId?: string;
  };
  color?: string; // For UI
};

/**
 * 🔒 SECURITY: ดึงข้อมูลนัดหมายทั้งหมดโดยกรองตาม Tenant อัตโนมัติจาก Auth Context
 * ใช้ React cache เพื่อป้องกันการ Query ซ้ำซ้อนใน Request เดียวกัน
 */
export const getCalendarEvents = cache(async (
  startDate: Date,
  endDate: Date,
  propertyId?: string,
  leadId?: string,
  agentId?: string,
): Promise<CalendarEvent[]> => {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const isAdmin = role === "ADMIN";

  const startIso = formatISO(startDate);
  const endIso = formatISO(endDate);

  const events: CalendarEvent[] = [];

  // 1. Fetch Viewings (Lead Activities from activity_timeline_v3)
  let viewingsQuery = supabase
    .from("activity_timeline_v3")
    .select("id, created_at, target_id, activity_type, description, actor_id, metadata, tenant_id")
    .eq("target_entity", "LEAD")
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  
  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    viewingsQuery = viewingsQuery.eq("tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    viewingsQuery = viewingsQuery.filter("metadata->>property_id", "eq", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("target_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("actor_id", agentId);
  }

  const { data: viewings } = await viewingsQuery;

  if (viewings && viewings.length > 0) {
    // Fetch lead names
    const leadIds = Array.from(new Set(viewings.map((v: any) => v.target_id).filter(Boolean))) as string[];
    let leadsMap: Record<string, { full_name: string; tenant_id: string | null }> = {};
    if (leadIds.length > 0) {
      const { data: leadsData } = await supabase
        .from("crm_leads_v3")
        .select("id, tenant_id, identity:identities_v3(display_name)")
        .in("id", leadIds);
      (leadsData || []).forEach((l: any) => {
        leadsMap[l.id] = { 
          full_name: l.identity?.display_name || (isEn ? "Unknown Lead" : "ไม่ระบุชื่อ"),
          tenant_id: l.tenant_id
        };
      });
    }

    // Fetch property titles
    const propIds = Array.from(new Set(viewings.map((v: any) => (v.metadata as any)?.property_id).filter(Boolean))) as string[];
    let propsMap: Record<string, { title: string; image_url: string | null }> = {};
    if (propIds.length > 0) {
      const { data: propsData } = await supabase
        .from("properties")
        .select("id, title, images:property_images(image_url)")
        .in("id", propIds);
      (propsData || []).forEach((p: any) => {
        propsMap[p.id] = {
          title: p.title || (isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ"),
          image_url: p.images?.[0]?.image_url || null
        };
      });
    }

    viewings.forEach((v: any) => {
      if (!v.created_at) return;
      let type: EventType = "viewing";
      let titlePrefix = isEn ? "Viewing" : "นัดชม";
      let color = "bg-blue-500";

      if (v.activity_type === "FOLLOW_UP") {
        type = "follow_up";
        titlePrefix = isEn ? "Follow-up" : "ติดตามผล";
        color = "bg-amber-500";
      } else if (v.activity_type === "CALL") {
        type = "call";
        titlePrefix = isEn ? "Call" : "โทรหา";
        color = "bg-green-500";
      } else if (v.activity_type === "LINE_CHAT") {
        type = "line_chat";
        titlePrefix = isEn ? "LINE Chat" : "ไลน์หา";
        color = "bg-green-600";
      }

      const leadInfo = leadsMap[v.target_id] || { full_name: isEn ? "Unknown Lead" : "ไม่ระบุชื่อ" };
      const propInfo = propsMap[(v.metadata as any)?.property_id] || { title: isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ", image_url: null };

      events.push({
        id: v.id,
        title: `${titlePrefix}: ${leadInfo.full_name}`,
        start: v.created_at,
        type: type,
        color: color,
        meta: {
          leadId: v.target_id ?? undefined,
          leadName: leadInfo.full_name ?? undefined,
          note: v.description ?? undefined,
          propertyTitle: propInfo.title ?? undefined,
          propertyId: (v.metadata as any)?.property_id ?? undefined,
          propertyImage: propInfo.image_url ?? undefined,
          start: v.created_at,
          agentId: v.actor_id ?? undefined,
        },
      });
    });
  }

  // 2. Fetch Contract Start Dates (crm_deals_v3)
  let contractStartQuery = supabase
    .from("crm_deals_v3")
    .select("id, transaction_date, transaction_end_date, metadata, property_id, tenant_id, created_by, property:properties(title, images:property_images(image_url))")
    .gte("transaction_date", startIso)
    .lte("transaction_date", endIso)
    .neq("status", "TERMINATED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    contractStartQuery = contractStartQuery.eq("tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("created_by", agentId);
  }

  const { data: contractStarts } = await contractStartQuery;

  if (contractStarts) {
    contractStarts.forEach((c: any) => {
      const meta = (c.metadata || {}) as Record<string, any>;
      if (!meta.contract_number && c.deal_type !== "RENTAL") return;

      const propertyTitle = c.property?.title || (isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ");
      const propertyImage = c.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-start`,
        title: `${isEn ? "Lease Start" : "เริ่มสัญญา"}: ${propertyTitle}`,
        start: c.transaction_date,
        type: "contract_start",
        color: "bg-emerald-500",
        meta: {
          contractNumber: meta.contract_number ?? undefined,
          propertyTitle: propertyTitle ?? undefined,
          propertyImage: propertyImage ?? undefined,
          leaseTermMonths: meta.lease_term_months ?? undefined,
          rentPrice: meta.rent_price ?? undefined,
          startDate: c.transaction_date ?? undefined,
          endDate: c.transaction_end_date ?? undefined,
          agentId: c.created_by ?? undefined,
        },
      });
    });
  }

  // 3. Fetch Contract Expirations (crm_deals_v3)
  let contractsQuery = supabase
    .from("crm_deals_v3")
    .select("id, transaction_date, transaction_end_date, metadata, property_id, tenant_id, created_by, property:properties(title, images:property_images(image_url))")
    .gte("transaction_end_date", startIso)
    .lte("transaction_end_date", endIso)
    .neq("status", "TERMINATED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    contractsQuery = contractsQuery.eq("tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    contractsQuery = contractsQuery.eq("property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    contractsQuery = contractsQuery.eq("lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    contractsQuery = contractsQuery.eq("created_by", agentId);
  }

  const { data: contracts } = await contractsQuery;

  if (contracts) {
    contracts.forEach((c: any) => {
      const meta = (c.metadata || {}) as Record<string, any>;
      if (!meta.contract_number && c.deal_type !== "RENTAL") return;

      const propertyTitle = c.property?.title || (isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ");
      const propertyImage = c.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-end`,
        title: `${isEn ? "Lease End" : "สิ้นสุดสัญญา"}: ${propertyTitle}`,
        start: c.transaction_end_date,
        type: "contract_end",
        color: "bg-red-500",
        meta: {
          contractNumber: meta.contract_number ?? undefined,
          propertyTitle: propertyTitle ?? undefined,
          propertyImage: propertyImage ?? undefined,
          leaseTermMonths: meta.lease_term_months ?? undefined,
          rentPrice: meta.rent_price ?? undefined,
          startDate: c.transaction_date ?? undefined,
          endDate: c.transaction_end_date ?? undefined,
          agentId: c.created_by ?? undefined,
        },
      });
    });
  }

  // 4. Fetch Early Terminations (crm_deals_v3)
  let terminatedQuery = supabase
    .from("crm_deals_v3")
    .select("id, transaction_date, transaction_end_date, metadata, property_id, tenant_id, created_by, property:properties(title, images:property_images(image_url))")
    .eq("status", "TERMINATED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    terminatedQuery = terminatedQuery.eq("tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("created_by", agentId);
  }

  const { data: terminated } = await terminatedQuery;

  if (terminated) {
    terminated.forEach((c: any) => {
      const meta = (c.metadata || {}) as Record<string, any>;
      if (!meta.check_out_date) return;
      if (meta.check_out_date < startIso || meta.check_out_date > endIso) return;

      const propertyTitle = c.property?.title || (isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ");
      const propertyImage = c.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-terminated`,
        title: `${isEn ? "Terminated" : "ยุติสัญญา"}: ${propertyTitle}`,
        start: meta.check_out_date,
        type: "early_termination",
        color: "bg-orange-500",
        meta: {
          contractNumber: meta.contract_number ?? undefined,
          propertyTitle: propertyTitle ?? undefined,
          propertyImage: propertyImage ?? undefined,
          leaseTermMonths: meta.lease_term_months ?? undefined,
          rentPrice: meta.rent_price ?? undefined,
          startDate: c.transaction_date ?? undefined,
          endDate: c.transaction_end_date ?? undefined,
          agentId: c.created_by ?? undefined,
        },
      });
    });
  }

  // 5. Fetch Deal Closings (crm_deals_v3)
  let dealsQuery = supabase
    .from("crm_deals_v3")
    .select("id, transaction_date, deal_type, property_id, tenant_id, created_by, property:properties(title, images:property_images(image_url))")
    .gte("transaction_date", startIso)
    .lte("transaction_date", endIso);

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    dealsQuery = dealsQuery.eq("tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    dealsQuery = dealsQuery.eq("property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    dealsQuery = dealsQuery.eq("lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    dealsQuery = dealsQuery.eq("created_by", agentId);
  }

  const { data: deals } = await dealsQuery;

  if (deals) {
    deals.forEach((d: any) => {
      if (!d.transaction_date) return;
      events.push({
        id: d.id,
        title: `${isEn ? "Deal Closed" : "ปิดดีล"}: ${d.property?.title || (isEn ? "Unknown Property" : "ทรัพย์ไม่ระบุชื่อ")}`,
        start: d.transaction_date,
        type: "deal_closing",
        color: "bg-purple-500",
        meta: {
          type: d.deal_type ?? undefined,
          propertyTitle: d.property?.title ?? undefined,
          propertyImage: d.property?.images?.[0]?.image_url ?? undefined,
          agentId: d.created_by ?? undefined,
        },
      });
    });
  }

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
});


export const getCompactProperties = cache(async (): Promise<{ id: string; title: string }[]> => {
  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const isAdmin = role === "ADMIN";

  let query = supabase
    .from("properties")
    .select("id, title")
    .eq("status", "ACTIVE");
  
  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data } = await query.order("title");
  return (data || []).map((p: any) => ({
    id: p.id!,
    title: p.title || "Unknown Property"
  }));
});

export const getCompactLeads = cache(async () => {
  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const isAdmin = role === "ADMIN";

  let query = supabase
    .from("crm_leads_v3")
    .select("id, tenant_id, stage, identity:identities_v3(display_name)")
    .neq("stage", "CLOSED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data } = await query;

  return (data || []).map((l: any) => ({
    id: l.id,
    full_name: l.identity?.display_name || "Unknown Lead"
  })).sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));
});

export async function getCalendarAgents() {
  const { supabase } = await requireAuthContext();
  
  const { data, error } = await supabase
    .from("identities_v3")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
  return (data || []).map((p: any) => ({ id: p.id, title: p.display_name || "Unknown" }));
}
