import { requireAuthContext, assertStaff } from "@/lib/authz";
import type { DealWithProperty } from "./types";

type ListArgs = {
  q?: string;
  property_id?: string;
  lead_id?: string;
  page?: number;
  pageSize?: number;
  order?: "created_at" | "transaction_date";
  ascending?: boolean;
};

export async function getDeals({
  q = "",
  property_id,
  lead_id,
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
      property:properties ( id, title, price, rental_price, property_images ( id, property_id, image_url, is_cover ) ),
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

      const propIds = (propRes.data ?? []).map((p: any) => p.id);
      const leadIds = (leadRes.data ?? []).map((l: any) => l.id);

      // Build a new deals query scoped by found property/lead ids (if any)
      if (propIds.length > 0 || leadIds.length > 0 || /^[0-9a-fA-F-]{36}$/.test(trimmed)) {
        let q2 = supabase
          .from("deals")
          .select(
            `
      *,
      property:properties ( id, title, price, rental_price, property_images ( id, property_id, image_url, is_cover ) ),
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
  const normalized = (finalData ?? []).map((d: any) => {
    if (d.property) {
      d.property.images = d.property.property_images ?? [];
    }
    // attach lead object if present
    if (!d.lead) d.lead = null;
    return d;
  });

  return {
    data: normalized as DealWithProperty[],
    count: finalCount,
    page: pageSafe,
    pageSize: size,
  };
}
