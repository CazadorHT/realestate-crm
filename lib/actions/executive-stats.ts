"use server";

import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/authz";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";

export async function getExecutiveStatsAction() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  // Ensure only ADMIN can access cross-branch stats
  assertAdmin(profile.role);

  const supabase = await createClient();

  // 1. Get all active tenants
  const { data: tenants, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, name")
    .or("is_deleted.is.null,is_deleted.eq.false");

  if (tenantErr) throw new Error(tenantErr.message);

  // 2. Aggregate stats per tenant
  const stats = await Promise.all(
    tenants.map(async (tenant) => {
      // Leads count
      const { count: leadCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Deals count (Won)
      const { count: dealCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "CLOSED_WIN");

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        leadCount: leadCount || 0,
        dealCount: dealCount || 0,
      };
    }),
  );

  return stats;
}
