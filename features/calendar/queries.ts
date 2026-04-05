import { formatISO } from "date-fns";
import { requireAuthContext } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { cache } from "react";

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
  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const isAdmin = role === "ADMIN";

  const startIso = formatISO(startDate);
  const endIso = formatISO(endDate);

  const events: CalendarEvent[] = [];

  // 1. Fetch Viewings (Lead Activities)
  let viewingsQuery = supabase
    .from("lead_activities")
    .select(
      `
      id,
      created_at,
      lead_id,
      activity_type,
      note,
      created_by,
      leads!inner ( full_name, tenant_id ),
      property_id,
      properties ( title, images:property_images(image_url) )
    `,
    )
    .gte("created_at", startIso)
    .lte("created_at", endIso);
  
  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    viewingsQuery = viewingsQuery.eq("leads.tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("created_by", agentId);
  }

  const { data: viewings } = await viewingsQuery;

  if (viewings) {
    viewings.forEach((v: any) => {
      let type: EventType = "viewing";
      let titlePrefix = "นัดชม";
      let color = "bg-blue-500";

      if (v.activity_type === "FOLLOW_UP") {
        type = "follow_up";
        titlePrefix = "ติดตามผล";
        color = "bg-amber-500";
      } else if (v.activity_type === "CALL") {
        type = "call";
        titlePrefix = "โทรหา";
        color = "bg-green-500";
      } else if (v.activity_type === "LINE_CHAT") {
        type = "line_chat";
        titlePrefix = "ไลน์หา";
        color = "bg-green-600";
      }

      events.push({
        id: v.id,
        title: `${titlePrefix}: ${v.leads?.full_name || "Unknown Lead"}`,
        start: v.created_at,
        type: type,
        color: color,
        meta: {
          leadId: v.lead_id,
          leadName: v.leads?.full_name,
          note: v.note,
          propertyTitle: v.properties?.title,
          propertyId: v.property_id,
          propertyImage: v.properties?.images?.[0]?.image_url || null,
          start: v.created_at,
          agentId: v.created_by,
        },
      });
    });
  }

  // 2. Fetch Contract Start Dates
  let contractStartQuery = supabase
    .from("rental_contracts")
    .select(
      `
      id,
      start_date,
      end_date,
      contract_number,
      lease_term_months,
      rent_price,
      deals!inner (
         property_id,
         tenant_id,
         created_by,
         property:properties (
           title,
           images:property_images(image_url)
         )
      )
    `,
    )
    .gte("start_date", startIso)
    .lte("start_date", endIso)
    .neq("status", "TERMINATED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    contractStartQuery = contractStartQuery.eq("deals.tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("deals.property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("deals.lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("deals.created_by", agentId);
  }

  const { data: contractStarts } = await contractStartQuery;

  if (contractStarts) {
    contractStarts.forEach((c: any) => {
      const propertyTitle = c.deals?.property?.title || "Unknown Property";
      const propertyImage = c.deals?.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-start`,
        title: `เริ่มสัญญา: ${propertyTitle}`,
        start: c.start_date,
        type: "contract_start",
        color: "bg-emerald-500",
        meta: {
          contractNumber: c.contract_number,
          propertyTitle,
          propertyImage,
          leaseTermMonths: c.lease_term_months,
          rentPrice: c.rent_price,
          startDate: c.start_date,
          endDate: c.end_date,
          agentId: c.deals?.created_by,
        },
      });
    });
  }

  // 3. Fetch Contract Expirations
  let contractsQuery = supabase
    .from("rental_contracts")
    .select(
      `
      id,
      start_date,
      end_date,
      contract_number,
      lease_term_months,
      rent_price,
      deals!inner (
         property_id,
         tenant_id,
         created_by,
         property:properties (
           title,
           images:property_images(image_url)
         )
      )
    `,
    )
    .gte("end_date", startIso)
    .lte("end_date", endIso)
    .neq("status", "TERMINATED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    contractsQuery = contractsQuery.eq("deals.tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    contractsQuery = contractsQuery.eq("deals.property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    contractsQuery = contractsQuery.eq("deals.lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    contractsQuery = contractsQuery.eq("deals.created_by", agentId);
  }

  const { data: contracts } = await contractsQuery;

  if (contracts) {
    contracts.forEach((c: any) => {
      const propertyTitle = c.deals?.property?.title || "Unknown Property";
      const propertyImage = c.deals?.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-end`,
        title: `สิ้นสุดสัญญา: ${propertyTitle}`,
        start: c.end_date,
        type: "contract_end",
        color: "bg-red-500",
        meta: {
          contractNumber: c.contract_number,
          propertyTitle,
          propertyImage,
          leaseTermMonths: c.lease_term_months,
          rentPrice: c.rent_price,
          startDate: c.start_date,
          endDate: c.end_date,
          agentId: c.deals?.created_by,
        },
      });
    });
  }

  // 4. Fetch Early Terminations
  let terminatedQuery = supabase
    .from("rental_contracts")
    .select(
      `
      id,
      start_date,
      end_date,
      check_out_date,
      contract_number,
      lease_term_months,
      rent_price,
      deals!inner (
         property_id,
         tenant_id,
         created_by,
         property:properties (
           title,
           images:property_images(image_url)
         )
      )
    `,
    )
    .eq("status", "TERMINATED")
    .not("check_out_date", "is", null)
    .gte("check_out_date", startIso)
    .lte("check_out_date", endIso);

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    terminatedQuery = terminatedQuery.eq("deals.tenant_id", tenantId);
  }

  if (propertyId && propertyId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("deals.property_id", propertyId);
  }

  if (leadId && leadId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("deals.lead_id", leadId);
  }

  if (agentId && agentId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("deals.created_by", agentId);
  }

  const { data: terminated } = await terminatedQuery;

  if (terminated) {
    terminated.forEach((c: any) => {
      const propertyTitle = c.deals?.property?.title || "Unknown Property";
      const propertyImage = c.deals?.property?.images?.[0]?.image_url || null;

      events.push({
        id: `${c.id}-terminated`,
        title: `ยุติสัญญา: ${propertyTitle}`,
        start: c.check_out_date,
        type: "early_termination",
        color: "bg-orange-500",
        meta: {
          contractNumber: c.contract_number,
          propertyTitle,
          propertyImage,
          leaseTermMonths: c.lease_term_months,
          rentPrice: c.rent_price,
          startDate: c.start_date,
          endDate: c.end_date,
          agentId: c.deals?.created_by,
        },
      });
    });
  }

  // 5. Fetch Deal Closings
  let dealsQuery = supabase
    .from("deals")
    .select(
      `
      id,
      transaction_date,
      deal_type,
      property_id,
      tenant_id,
      created_by,
      property:properties (
        title,
        images:property_images(image_url)
      )
    `,
    )
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
        title: `ปิดดีล: ${d.property?.title}`,
        start: d.transaction_date,
        type: "deal_closing",
        color: "bg-purple-500",
        meta: {
          type: d.deal_type,
          propertyTitle: d.property?.title,
          propertyImage: d.property?.images?.[0]?.image_url || null,
          agentId: d.created_by,
        },
      });
    });
  }

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
});

export const getCompactProperties = cache(async () => {
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
  return data || [];
});

export const getCompactLeads = cache(async () => {
  const { supabase, tenantId, role } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;
  const isAdmin = role === "ADMIN";

  let query = supabase
    .from("leads")
    .select("id, full_name")
    .neq("stage", "CLOSED");

  if (isMultiTenant && tenantId && tenantId !== "ALL" && !isAdmin) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data } = await query.order("full_name");

  return data || [];
});

export async function getCalendarAgents() {
  const { supabase } = await requireAuthContext();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
  return data.map(p => ({ id: p.id, title: p.full_name || "Unknown" }));
}
