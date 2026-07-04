import { createClient } from "@/lib/supabase/server";
import { FollowUpLead, RiskDeal } from "./types";
import { PostgrestFilterBuilder } from "@supabase/supabase-js";

interface RawLead {
  id: string;
  full_name: string;
  updated_at: string;
  stage: string;
}

interface RawDeal {
  id: string;
  updated_at: string;
  status: string;
  properties: { title: string } | null;
}

export async function getSetupProgress(tenantId?: string | null, userId?: string): Promise<{
  hasBranchProfile: boolean;
  hasStaff: boolean;
  hasProperty: boolean;
  hasLead: boolean;
  hasPersonalProfile: boolean;
  isLineConnected: boolean;
  isTikTokConnected: boolean;
  isTelegramConnected: boolean;
  isLineSkipped: boolean;
  isStaffSkipped: boolean;
  branchCount: number;
}> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = <T extends { eq: (column: string, value: string) => T }>(query: T): T => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId) as unknown as T;
      }
      return query;
    };

    const { getSiteSettings } = await import("@/features/site-settings/actions");

    const [staffRes, propRes, leadsRes, tenantRes, settings, profilesWithLine, invitationRes, personalProfile] =
      await Promise.all([
        applyTenantFilter(
          supabase
            .from("tenant_members_v3")
            .select("id", { count: "exact", head: true }),
        ),
        applyTenantFilter(
          supabase
            .from("properties_core")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null),
        ),
        applyTenantFilter(
          supabase
            .from("crm_leads_v3")
            .select("id", { count: "exact", head: true }),
        ),
        tenantId && tenantId !== "ALL"
          ? supabase
              .from("tenants_v3")
              .select("name, logo_url", { count: "exact" })
              .eq("id", tenantId)
          : supabase.from("tenants_v3").select("name, logo_url", { count: "exact" }),
        getSiteSettings(),
        supabase
          .from("tenant_members_v3")
          .select("id, profiles!inner(line_user_id, line_id)", { count: "exact", head: true })
          .eq("tenant_id", tenantId || "")
          .or("line_user_id.not.is.null,line_id.not.is.null", { foreignTable: "profiles" }),
        supabase
          .from("tenant_invitations_v3")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId || "")
          .eq("status", "PENDING"),
        userId ? supabase.from("profiles").select("avatar_url, phone").eq("id", userId).single() : Promise.resolve({ data: null }),
      ]);

    const isLineConnected =
      !!settings.line_id ||
      (profilesWithLine.count || 0) > 0;

    const isTikTokConnected = !!settings.tiktok_auth_token;
    const isTelegramConnected = !!(personalProfile.data?.telegram_id || process.env.TELEGRAM_BOT_TOKEN);

    const invitationCount = invitationRes.count || 0;

    return {
      hasBranchProfile: !!(tenantRes.data?.[0]?.name || tenantRes.data?.[0]?.logo_url),
      hasStaff: (staffRes.count || 0) > 1 || (invitationCount || 0) > 0,
      hasProperty: (propRes.count || 0) > 0,
      hasLead: (leadsRes.count || 0) > 0,
      hasPersonalProfile: !!(personalProfile.data?.avatar_url || personalProfile.data?.phone),
      isLineConnected,
      isTikTokConnected,
      isTelegramConnected,
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
      hasLead: false,
      hasPersonalProfile: false,
      isLineConnected: false,
      isTikTokConnected: false,
      isTelegramConnected: false,
      isLineSkipped: false,
      isStaffSkipped: false,
      branchCount: 0,
    };
  }
}

export async function getFollowUpLeads(
  tenantId?: string | null,
  userId?: string,
): Promise<FollowUpLead[]> {
  const supabase = await createClient();

  const applyFilters = <T extends { eq: (column: string, value: string) => T }>(query: T, customColumn?: string): T => {
    let filteredQuery = query;
    if (tenantId && tenantId !== "ALL") {
      filteredQuery = filteredQuery.eq("tenant_id", tenantId) as unknown as T;
    }
    if (userId && userId !== "ALL") {
      filteredQuery = filteredQuery.eq(customColumn || "assigned_to", userId) as unknown as T;
    }
    return filteredQuery;
  };

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Fetch leads not updated in last 3 days and not closed
  const { data: leads } = await applyFilters(
    supabase
      .from("leads")
      .select("id, full_name, updated_at, stage")
      .lt("updated_at", threeDaysAgo.toISOString())
      .neq("stage", "CLOSED")
      .limit(5),
  );

  if (!leads) return [];

  return (leads as unknown as RawLead[]).map((l) => {
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

export async function getRiskDeals(
  tenantId?: string | null,
  userId?: string,
): Promise<RiskDeal[]> {
  try {
    const supabase = await createClient();

    const applyFilters = <T extends { eq: (column: string, value: string) => T }>(query: T): T => {
      let filteredQuery = query;
      if (tenantId && tenantId !== "ALL") {
        filteredQuery = filteredQuery.eq("tenant_id", tenantId) as unknown as T;
      }
      if (userId && userId !== "ALL") {
        filteredQuery = filteredQuery.eq("created_by", userId) as unknown as T;
      }
      return filteredQuery;
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: deals } = await applyFilters(
      supabase
        .from("deals")
        .select("id, updated_at, status, properties(title)")
        .lt("updated_at", sevenDaysAgo.toISOString())
        .neq("status", "CLOSED_WIN")
        .neq("status", "CLOSED_LOSS")
        .limit(5),
    );

    if (!deals) return [];

    return (deals as unknown as RawDeal[]).map((d) => {
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
