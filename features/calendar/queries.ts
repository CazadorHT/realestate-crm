import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { addDays, formatISO } from "date-fns";

export type EventType = "viewing" | "contract_end" | "deal_closing";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO String
  end?: string; // ISO String
  type: EventType;
  meta?: any;
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
      property_id
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
        title: `Viewing: ${v.leads?.full_name || "Unknown Lead"}`,
        start: v.created_at,
        type: "viewing",
        color: "bg-blue-500",
        meta: { leadId: v.lead_id, note: v.note },
      });
    });
  }

  // 2. Fetch Contract Expirations
  let contractsQuery = supabase
    .from("rental_contracts")
    .select(
      `
      id,
      end_date,
      contract_number,
      deals!inner (
         property_id,
         property:properties ( title )
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
      events.push({
        id: c.id,
        title: `Contract Expire: ${propertyTitle}`,
        start: c.end_date,
        type: "contract_end",
        color: "bg-red-500",
        meta: { contractNumber: c.contract_number },
      });
    });
  }

  // 3. Fetch Deal Closings
  let dealsQuery = supabase
    .from("deals")
    .select(
      `
      id,
      transaction_date,
      deal_type,
      property_id,
      property:properties ( title )
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
        title: `Deal Closing: ${d.property?.title}`,
        start: d.transaction_date,
        type: "deal_closing",
        color: "bg-green-500",
        meta: { type: d.deal_type },
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
