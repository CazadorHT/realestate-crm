import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { addDays, formatISO } from "date-fns";

export type EventType =
  | "viewing"
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
    propertyImage?: string | null;
    contractNumber?: string;
    type?: string;
    leaseTermMonths?: number;
    rentPrice?: number;
    startDate?: string;
    endDate?: string;
  };
  color?: string; // For UI
};

export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  propertyId?: string,
): Promise<CalendarEvent[]> {
  noStore();
  const supabase = await createClient();

  const startIso = formatISO(startDate);
  const endIso = formatISO(endDate); // Ensure we cover the full range

  const events: CalendarEvent[] = [];

  // 1. Fetch Viewings (Lead Activities)
  let viewingsQuery = supabase
    .from("lead_activities")
    .select(
      `
      id,
      created_at,
      lead_id,
      note,
      leads ( full_name ),
      property_id,
      properties ( title, images:property_images(image_url) )
    `,
    )
    .eq("activity_type", "VIEWING")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (propertyId && propertyId !== "ALL") {
    viewingsQuery = viewingsQuery.eq("property_id", propertyId);
  }

  const { data: viewings } = await viewingsQuery;

  if (viewings) {
    viewings.forEach((v: any) => {
      events.push({
        id: v.id,
        title: `นัดชม: ${v.leads?.full_name || "Unknown Lead"}`,
        start: v.created_at,
        type: "viewing",
        color: "bg-blue-500",
        meta: {
          leadId: v.lead_id,
          note: v.note,
          propertyTitle: v.properties?.title,
          propertyImage: v.properties?.images?.[0]?.image_url || null,
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

  if (propertyId && propertyId !== "ALL") {
    contractStartQuery = contractStartQuery.eq("deals.property_id", propertyId);
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

  if (propertyId && propertyId !== "ALL") {
    contractsQuery = contractsQuery.eq("deals.property_id", propertyId);
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

  if (propertyId && propertyId !== "ALL") {
    terminatedQuery = terminatedQuery.eq("deals.property_id", propertyId);
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
      property:properties (
        title,
        images:property_images(image_url)
      )
    `,
    )
    .gte("transaction_date", startIso)
    .lte("transaction_date", endIso);

  if (propertyId && propertyId !== "ALL") {
    dealsQuery = dealsQuery.eq("property_id", propertyId);
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
        },
      });
    });
  }

  return events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

export async function getCompactProperties() {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, title")
    .eq("status", "ACTIVE")
    .order("title");
  return data || [];
}

export async function getCompactLeads() {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, full_name")
    .neq("stage", "CLOSED")
    .order("full_name");

  // If full_name is not a column (it might be a computed view or just separate fields), construct it.
  // Based on schema, 'leads' usually has first/last. Checking schema again?
  // Wait, let's assume loose types for now or check 'leads' schema briefly or just use first_name + last_name.
  // Schema in database.types.ts might show it.
  // `leads ( full_name )` was used in `getCalendarEvents` so it likely exists or is a view.

  return data || [];
}
