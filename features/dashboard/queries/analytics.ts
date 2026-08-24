import { createClient } from "@/lib/supabase/server";
import { AnalyticsResult, ViewsTrendData, DistributionData, AreaAnalytics, AgentPerformanceData } from "./types";
import { getListingTypeFromDb, getPropertyTypeFromDb } from "@/features/properties/labels";
import { Database } from "@/lib/database.types.generated";
import { SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

interface AnalyticsSummary {
  daily_trends: { date: string; views: number }[];
  listing_type_distribution: { label: string; value: number }[];
  property_type_distribution: { label: string; value: number }[];
  area_distribution: { label: string; value: number }[];
  agent_performance: { name: string; leads_count: number; deals_count: number }[];
  total_views: number;
  total_leads: number;
  total_deals: number;
}

type TopPropertyRow = {
  id: string;
  slug: string | null;
  listing_type: number | null;
  property_type: number | null;
  price: number | null;
  rental_price: number | null;
  view_count: number | null;
  title: string | null;
  title_en: string | null;
  project_id: string | null;
  property_images: { image_url: string; is_cover: boolean | null }[];
};

export type ExtendedDatabase = Database & {
  public: {
    Functions: Database["public"]["Functions"] & {
      get_analytics_summary_v3: {
        Args: {
          p_tenant_id?: string | null;
          p_days?: number;
          p_listing_type?: string | null;
          p_property_type?: string | null;
          p_area?: string | null;
        };
        Returns: AnalyticsSummary;
      };
    };
  };
};

export async function getAnalyticsStats(
  tenantId?: string | null,
  days?: number,
  page = 1,
  pageSize = 10,
  listingType?: string | null,
  propertyType?: string | null,
  area?: string | null,
  sortBy?: string,
): Promise<AnalyticsResult> {
  try {
    const rawSupabase = await createClient();
    const supabase = rawSupabase as unknown as SupabaseClient<ExtendedDatabase>;

    const applyTenantFilter = <T extends { eq: any }>(query: T): T => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const applyCommonFilters = <T extends { is: any; gte: any; eq: any }>(q: T): T => {
      let filteredQuery = applyTenantFilter(q).is("deleted_at", null) as any;
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filteredQuery = filteredQuery.gte("created_at", startDate.toISOString());
      }

      if (listingType && listingType !== "ALL") {
        filteredQuery = filteredQuery.eq("listing_type", listingType);
      }

      if (propertyType && propertyType !== "ALL") {
        filteredQuery = filteredQuery.eq("property_type", propertyType);
      }

      if (area && area !== "all") {
        filteredQuery = filteredQuery.eq("popular_area", area);
      }

      return filteredQuery;
    };

    const offset = (page - 1) * pageSize;

    // 1. Get Top Properties (Paginated)
    let query = applyCommonFilters(
      supabase
        .from("properties")
        .select(
          "id, slug, listing_type:listing_type_int, property_type:property_type_int, price, rental_price, view_count, title, title_en, project_id, property_images:property_media_v3(image_url:url, is_cover)",
          { count: "exact" },
        )
    );

    const isAscending = sortBy === "views_asc" || sortBy === "view_count_asc";
    const { data: topProps, count: topPropsCount } = await query
      .order("view_count", { ascending: isAscending, nullsFirst: false })
      .range(offset, offset + pageSize - 1);

    // Fetch project details for properties with project_id
    const projectIds = Array.from(
      new Set(
        (topProps || [])
          .map((p) => p.project_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const projectMap = new Map<string, { th: string; en: string }>();
    if (projectIds.length > 0) {
      try {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds);

        if (projects) {
          projects.forEach((proj: any) => {
            let thName = "";
            let enName = "";
            if (proj.name && typeof proj.name === "object") {
              thName = proj.name.th || proj.name.en || "";
              enName = proj.name.en || proj.name.th || "";
            } else if (typeof proj.name === "string") {
              thName = proj.name;
              enName = proj.name;
            }
            projectMap.set(proj.id, { th: thName, en: enName });
          });
        }
      } catch (err) {
        console.warn("Failed to fetch project names:", err);
      }
    }

    // 3. New Enterprise RPC: Get consolidated trends, distributions, and metrics
    const { data, error: summaryError } = await supabase.rpc("get_analytics_summary_v3", {
      p_tenant_id: (tenantId === "ALL" ? null : tenantId) as string,
      p_days: days || 36500, // Use a very large number if range is "all" (undefined)
      p_listing_type: (listingType || null) as string,
      p_property_type: (propertyType || null) as string,
      p_area: (area || null) as string
    });

    if (summaryError) {
       console.error("❌ Analytics RPC Error Details:", summaryError);
       return {
          topProperties: ((topProps as unknown as TopPropertyRow[]) || []).map((p) => {
            const proj = p.project_id ? projectMap.get(p.project_id) : null;
            const finalProjectName = proj?.th || proj?.en || null;
            const finalProjectNameEn = proj?.en || proj?.th || null;
            return {
              ...p,
              title: p.title || p.title_en || "Untitled",
              title_en: p.title_en || null,
              project_name: finalProjectName,
              project_name_en: finalProjectNameEn,
              slug: p.slug || "",
              listing_type: getListingTypeFromDb(p.listing_type),
              property_type: getPropertyTypeFromDb(p.property_type),
              price: p.price || null,
              rental_price: p.rental_price || null,
              view_count: p.view_count || 0,
              property_images: (p.property_images || []).map(img => ({ ...img, is_cover: !!img.is_cover }))
            };
          }),
         topPropertiesCount: topPropsCount || 0,
         topAreas: [],
         totalViews: 0,
         listingTypeDistribution: [],
         propertyTypeDistribution: [],
         viewsTrend: [],
         agentPerformance: [],
         funnel: { views: 0, leads: 0, deals: 0 },
         error: `Analytics RPC Error (CODE: ${summaryError.code}): ${summaryError.message}`
       };
    }

    const summary = data; 

    const viewsTrend: ViewsTrendData[] = (summary?.daily_trends || []).map((d) => ({
      date: d.date,
      views: Number(d.views || 0)
    }));

    const listingTypeDist: DistributionData[] = (summary?.listing_type_distribution || []).map((lt) => ({
      label: lt.label,
      value: Number(lt.value || 0)
    }));

    const propertyTypeDist: DistributionData[] = (summary?.property_type_distribution || []).map((pt) => ({
      label: pt.label,
      value: Number(pt.value || 0)
    }));

    const topAreas: AreaAnalytics[] = (summary?.area_distribution || []).map((a) => ({
      name: a.label,
      view_count: Number(a.value || 0),
      leads_count: 0
    }));

    let agentPerformance: AgentPerformanceData[] = (summary?.agent_performance || []).map((ap) => ({
      name: ap.name,
      leads_count: Number(ap.leads_count || 0),
      deals_count: Number(ap.deals_count || 0),
      avatar_url: null,
    }));

    if (agentPerformance.length > 0) {
      try {
        const { data: identities } = await supabase
          .from("identities_v3")
          .select("id, display_name, email, avatar_url");

        if (identities && identities.length > 0) {
          const avatarMap = new Map<string, string>();
          identities.forEach((iden: any) => {
            if (!iden.avatar_url) return;
            const rawName = decrypt(iden.display_name) || iden.display_name;
            const rawEmail = decrypt(iden.email) || iden.email;
            if (rawName) avatarMap.set(rawName.toLowerCase().trim(), iden.avatar_url);
            if (iden.display_name) avatarMap.set(iden.display_name.toLowerCase().trim(), iden.avatar_url);
            if (rawEmail) avatarMap.set(rawEmail.toLowerCase().trim(), iden.avatar_url);
            if (iden.id) avatarMap.set(iden.id.toLowerCase().trim(), iden.avatar_url);
          });

          agentPerformance = agentPerformance.map((ap) => {
            const cleanName = decrypt(ap.name) || ap.name;
            const avatar = avatarMap.get(cleanName.toLowerCase().trim()) || avatarMap.get(ap.name.toLowerCase().trim()) || null;
            return {
              ...ap,
              name: cleanName && !cleanName.includes("-") ? cleanName : ap.name,
              avatar_url: avatar,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to enrich agent performance avatars:", err);
      }
    }

    return {
      topProperties: ((topProps as unknown as TopPropertyRow[]) || []).map((p) => {
        const proj = p.project_id ? projectMap.get(p.project_id) : null;
        const finalProjectName = proj?.th || proj?.en || null;
        const finalProjectNameEn = proj?.en || proj?.th || null;
        return {
          ...p,
          title: p.title || p.title_en || "Untitled",
          title_en: p.title_en || null,
          project_name: finalProjectName,
          project_name_en: finalProjectNameEn,
          slug: p.slug || "",
          listing_type: getListingTypeFromDb(p.listing_type),
          property_type: getPropertyTypeFromDb(p.property_type),
          price: p.price || null,
          rental_price: p.rental_price || null,
          view_count: p.view_count || 0,
          property_images: (p.property_images || []).map(img => ({ ...img, is_cover: !!img.is_cover }))
        };
      }),
      topPropertiesCount: topPropsCount || 0,
      topAreas,
      totalViews: Number(summary?.total_views || 0),
      listingTypeDistribution: listingTypeDist,
      propertyTypeDistribution: propertyTypeDist,
      viewsTrend,
      agentPerformance,
      funnel: {
        views: Number(summary?.total_views || 0),
        leads: Number(summary?.total_leads || 0),
        deals: Number(summary?.total_deals || 0)
      }
    };
  } catch (error: any) {
    console.error("getAnalyticsStats Error:", error);
    return {
      topProperties: [],
      topPropertiesCount: 0,
      topAreas: [],
      totalViews: 0,
      listingTypeDistribution: [],
      propertyTypeDistribution: [],
      viewsTrend: [],
      agentPerformance: [],
      funnel: {
        views: 0,
        leads: 0,
        deals: 0
      },
      error: error?.message || "เกิดข้อผิดพลาดที่ไม่รู้จักในระบบวิเคราะห์ข้อมูล"
    };
  }
}
