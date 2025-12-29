import { requireAuthContext, assertStaff } from "@/lib/authz";
import { DealWithProperty } from "./types";

export async function getDealsByLeadId(
  leadId: string
): Promise<DealWithProperty[]> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  // Fetch deals and join with properties (select title, price, etc.)
  const { data, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        rental_price,
        images
      )
    `
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    return [];
  }

  return data as unknown as DealWithProperty[];
}

export async function getDealById(
  dealId: string
): Promise<DealWithProperty | null> {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        rental_price,
        images
      )
    `
    )
    .eq("id", dealId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as DealWithProperty;
}
