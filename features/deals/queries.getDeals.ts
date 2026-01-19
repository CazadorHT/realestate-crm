import { requireAuthContext, assertStaff } from "@/lib/authz";
import { differenceInMonths } from "date-fns";
import type { DealWithProperty } from "./types";

import { Deal, DealStatus } from "./types";

type ListArgs = {
  q?: string;
  property_id?: string;
  lead_id?: string;
  status?: DealStatus;
  page?: number;
  pageSize?: number;
  order?: "created_at" | "transaction_date";
  ascending?: boolean;
};

// Helper interface for the joined result structure
// Helper interface for the joined result structure

type RawDealWithJoin = Deal & {
  property: {
    id: string;
    title: string;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    property_images: {
      id: string;
      property_id: string;
      image_url: string;
      is_cover: boolean;
      sort_order: number;
    }[];
  } | null;
  lead: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;
};

export async function getDeals({
  q = "",
  property_id,
  lead_id,
  status,
  page = 1,
  pageSize = 20,
  order = "created_at",
  ascending = false,
}: ListArgs = {}) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const trimmed = q.trim();
  const pageSafe = Math.max(1, page);
  const size = Math.min(100, Math.max(5, pageSize));

  let query = supabase
    .from("deals")
    .select(
      `
      *,
      property:properties ( id, title, price, original_price, rental_price, original_rental_price, property_images ( id, property_id, image_url, is_cover, sort_order ) ),
      lead:leads ( id, full_name, phone )
    `,
      { count: "exact" }
    )
    .order(order, { ascending });

  if (trimmed) {
    // search property title or lead name
    query = query.or(
      `property.title.ilike.%${trimmed}%,lead.full_name.ilike.%${trimmed}%,id.eq.${trimmed}`
    );
  }

  if (property_id) query = query.eq("property_id", property_id);
  if (lead_id) query = query.eq("lead_id", lead_id);
  if (status) query = query.eq("status", status);

  const from = (pageSafe - 1) * size;
  const to = from + size - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("getDeals error:", error);
    return { data: [], count: 0, page: pageSafe, pageSize: size };
  }

  // If we had a search q but zero results, try a safer fallback:
  // search directly in properties and leads and match by ids.
  let finalData = data ?? [];
  let finalCount = count ?? 0;

  if (trimmed && (finalData.length === 0 || finalCount === 0)) {
    try {
      const propRes = await supabase
        .from("properties")
        .select("id")
        .ilike("title", `%${trimmed}%`);
      const leadRes = await supabase
        .from("leads")
        .select("id")
        .ilike("full_name", `%${trimmed}%`);

      const propIds = (propRes.data ?? []).map((p) => p.id);
      const leadIds = (leadRes.data ?? []).map((l) => l.id);

      // Build a new deals query scoped by found property/lead ids (if any)
      if (
        propIds.length > 0 ||
        leadIds.length > 0 ||
        /^[0-9a-fA-F-]{36}$/.test(trimmed)
      ) {
        let q2 = supabase
          .from("deals")
          .select(
            `
      *,
      property:properties ( id, title, price, original_price, rental_price, original_rental_price, property_images ( id, property_id, image_url, is_cover, sort_order ) ),
      lead:leads ( id, full_name, phone )
    `,
            { count: "exact" }
          )
          .order(order, { ascending });

        if (propIds.length > 0) q2 = q2.in("property_id", propIds);
        if (leadIds.length > 0) q2 = q2.in("lead_id", leadIds);
        if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) q2 = q2.eq("id", trimmed);

        const { data: d2, count: c2 } = await q2.range(from, to);
        finalData = d2 ?? [];
        finalCount = c2 ?? 0;
      }
    } catch (e) {
      // ignore fallback errors, we'll return original empty result
      console.warn("getDeals fallback search failed:", e);
    }
  }

  // normalize property to include `images` for the DealWithProperty view model
  const rawData = (finalData ?? []) as unknown as RawDealWithJoin[];

  const normalized: DealWithProperty[] = rawData.map((d) => {
    // Transform property structure if it exists
    const property = d.property
      ? {
          id: d.property.id,
          title: d.property.title,
          price: d.property.price,
          original_price: d.property.original_price,
          rental_price: d.property.rental_price,
          original_rental_price: d.property.original_rental_price,
          images: d.property.property_images ?? [],
        }
      : null;

    // Calculate duration_months for RENT deals
    let duration_months: number | undefined | null = undefined;
    if (
      d.deal_type === "RENT" &&
      d.transaction_date &&
      d.transaction_end_date
    ) {
      duration_months = differenceInMonths(
        new Date(d.transaction_end_date),
        new Date(d.transaction_date)
      );
    }

    // Return the correctly typed shape
    return {
      ...d,
      property,
      lead: d.lead ? { id: d.lead.id, full_name: d.lead.full_name } : null,
      duration_months,
    } as DealWithProperty;
  });

  return {
    data: normalized,
    count: finalCount,
    page: pageSafe,
    pageSize: size,
  };
}
