"use server";

import { createClient } from "@/lib/supabase/server";
import { FollowUpLead, RiskDeal } from "./types";

export async function getSetupProgress(tenantId?: string | null): Promise<{
  hasBranchProfile: boolean;
  hasStaff: boolean;
  hasProperty: boolean;
  isLineConnected: boolean;
  isLineSkipped: boolean;
  isStaffSkipped: boolean;
  branchCount: number;
}> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const { getSiteSettings } = await import("@/features/site-settings/actions");

    const [staffRes, propRes, tenantRes, settings, profilesWithLine] =
      await Promise.all([
        applyTenantFilter(
          supabase
            .from("tenant_members")
            .select("*", { count: "exact", head: true }),
        ),
        applyTenantFilter(
          supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .is("deleted_at", null),
        ),
        tenantId && tenantId !== "ALL"
          ? supabase
              .from("tenants")
              .select("logo_url", { count: "exact" })
              .eq("id", tenantId)
          : supabase.from("tenants").select("logo_url", { count: "exact" }),
        getSiteSettings(),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .not("line_id", "is", null),
      ]);

    const isLineConnected =
      !!settings.line_id ||
      !!process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      (profilesWithLine.count || 0) > 0;

    return {
      hasBranchProfile: !!tenantRes.data?.[0]?.logo_url,
      hasStaff: (staffRes.count || 0) > 0,
      hasProperty: (propRes.count || 0) > 0,
      isLineConnected,
      isLineSkipped: !!settings.onboarding_line_skipped,
      isStaffSkipped: !!settings.onboarding_staff_skipped,
      branchCount: tenantRes.count || 0,
    };
  } catch (error) {
    console.error("getSetupProgress Error:", error);
    return {
      hasBranchProfile: false,
      hasStaff: false,
      hasProperty: false,
      isLineConnected: false,
      isLineSkipped: false,
      isStaffSkipped: false,
      branchCount: 0,
    };
  }
}

export async function getFollowUpLeads(
  tenantId?: string | null,
): Promise<FollowUpLead[]> {
  const supabase = await createClient();

  const applyTenantFilter = (query: any) => {
    if (tenantId && tenantId !== "ALL") {
      return query.eq("tenant_id", tenantId);
    }
    return query;
  };

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Fetch leads not updated in last 3 days and not closed
  const { data: leads } = await applyTenantFilter(
    supabase
      .from("leads")
      .select("id, full_name, updated_at, stage")
      .lt("updated_at", threeDaysAgo.toISOString())
      .neq("stage", "CLOSED")
      .limit(5),
  );

  if (!leads) return [];

  return leads.map((l: any) => {
    const updated = new Date(l.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: l.id,
      name: l.full_name,
      daysQuiet: diffDays,
      stage: l.stage,
    };
  });
}

export async function getRiskDeals(tenantId?: string | null): Promise<RiskDeal[]> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: deals } = await applyTenantFilter(
      supabase
        .from("deals")
        .select("id, updated_at, status, properties(title)")
        .lt("updated_at", sevenDaysAgo.toISOString())
        .neq("status", "CLOSED_WIN")
        .neq("status", "CLOSED_LOSS")
        .limit(5),
    );

    if (!deals) return [];

    return deals.map((d: any) => {
      const updated = new Date(d.updated_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - updated.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: d.id,
        title: d.properties?.title || `Deal #${d.id.slice(0, 4)}`,
        daysInStage: diffDays,
        stage: d.status,
      };
    });
  } catch (error) {
    console.error("getRiskDeals Error:", error);
    return [];
  }
}
