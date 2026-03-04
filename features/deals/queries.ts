import { requireAuthContext, assertStaff } from "@/lib/authz";
import { DealWithProperty } from "./types";

export async function getDealsByLeadId(
  leadId: string,
): Promise<DealWithProperty[]> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  if (!tenantId) throw new Error("Tenant ID is required but missing");

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
        original_price,
        rental_price,
        original_rental_price,
        property_images(image_url, is_cover)
      )
    `,
    )
    .eq("lead_id", leadId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    return [];
  }

  return data as unknown as DealWithProperty[];
}

export async function getDealById(
  dealId: string,
): Promise<DealWithProperty | null> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  if (!tenantId) throw new Error("Tenant ID is required but missing");

  const { data, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        original_price,
        rental_price,
        original_rental_price,
        property_images(image_url, is_cover)
      ),
      lead:leads (
        id,
        full_name,
        email,
        phone,
        stage
      )
    `,
    )
    .eq("id", dealId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as DealWithProperty;
}

export async function getDealCommissions(dealId: string) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  if (!tenantId) throw new Error("Tenant ID is required but missing");

  const { data, error } = await (supabase as any)
    .from("deal_commissions")
    .select(
      `
      *,
      agent:profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("deal_id", dealId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching deal commissions:", error);
    return [];
  }

  return data;
}
