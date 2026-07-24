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
        .from("crm_leads_v3")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Base query for won deals
      let dealQuery = supabase
        .from("crm_deals_v3")
        .select("commission_total, commissions:crm_deal_commissions_v3(recipient_role, amount, net_amount)")
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
        (sum: number, deal: any) => {
          const commissionsList = deal.commissions || [];
          const gross = Number(deal.commission_total) || 0;
          let agencyNet = 0;
          if (commissionsList.length > 0) {
            const agencyComm = commissionsList.find((c: any) => c.recipient_role === "AGENCY");
            if (agencyComm) {
              agencyNet = Number(agencyComm.net_amount ?? agencyComm.amount) || 0;
            } else {
              const agentSplits = commissionsList
                .filter((c: any) => c.recipient_role !== "AGENCY")
                .reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
              agencyNet = Math.max(0, gross - agentSplits);
            }
          } else {
            agencyNet = gross;
          }
          return sum + agencyNet;
        },
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
