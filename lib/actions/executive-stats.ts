"use server";

import { createClient } from "@/lib/supabase/server";
import { assertSystemAdmin } from "@/lib/authz";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { roundToTwo } from "@/lib/finance/commissions";

export interface ExecutiveStatsParams {
  startDate?: string;
  endDate?: string;
}

export async function getExecutiveStatsAction(params: ExecutiveStatsParams = {}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  // Ensure only SuperAdmin can access cross-branch stats
  assertSystemAdmin(profile.role);

  const supabase = await createClient();

  // 1. Get all active tenants
  const { data: tenants, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, name")
    .or("is_deleted.is.null,is_deleted.eq.false");

  if (tenantErr) throw new Error(tenantErr.message);

  // 2. Aggregate stats per tenant
  const stats = await Promise.all(
    tenants.map(async (tenant: { id: string; name: string }) => {
      // Base query for leads
      let leadQuery = supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Base query for won deals
      let dealQuery = supabase
        .from("deals")
        .select("commission_amount")
        .eq("tenant_id", tenant.id)
        .eq("status", "CLOSED_WIN");

      // Apply date filters if provided
      if (params.startDate) {
        leadQuery = leadQuery.gte("created_at", params.startDate);
        dealQuery = dealQuery.gte("created_at", params.startDate);
      }
      if (params.endDate) {
        leadQuery = leadQuery.lte("created_at", params.endDate);
        dealQuery = dealQuery.lte("created_at", params.endDate);
      }

      const [{ count: leadCount }, { data: deals }] = await Promise.all([
        leadQuery,
        dealQuery,
      ]);

      const totalRevenue = (deals || []).reduce(
        (sum: number, deal: { commission_amount: any }) => sum + (Number(deal.commission_amount) || 0),
        0
      );

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        leadCount: leadCount || 0,
        dealCount: (deals || []).length,
        totalRevenue: roundToTwo(totalRevenue),
      };
    }),
  );

  return stats;
}
