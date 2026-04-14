import { createClient } from "@/lib/supabase/server";
import { AnalyticsResult, ViewsTrendData, DistributionData, AreaAnalytics, AgentPerformanceData } from "./types";

export async function getAnalyticsStats(
  tenantId?: string | null,
  days?: number,
  page = 1,
  pageSize = 10,
  listingType?: string | null,
  propertyType?: string | null,
  area?: string | null,
): Promise<AnalyticsResult> {
  try {
    const supabase = await createClient();

    const applyTenantFilter = (query: any) => {
      if (tenantId && tenantId !== "ALL") {
        return query.eq("tenant_id", tenantId);
      }
      return query;
    };

    const applyCommonFilters = (q: any) => {
      let filteredQuery = applyTenantFilter(q).is("deleted_at", null);
      
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

    // 1. Get Top Properties by Views (Paginated)
    let query = applyCommonFilters(
      supabase
        .from("properties")
        .select(
          "id, title, slug, view_count, listing_type, property_type, price, rental_price, property_images(image_url, is_cover)",
          { count: "exact" },
        )
    );

    const { data: topProps, count: topPropsCount } = await query
      .order("view_count", { ascending: false })
      .range(offset, offset + pageSize - 1);


    // 3. New Enterprise RPC: Get consolidated trends, distributions, and metrics
    const { data, error: summaryError } = await supabase.rpc("get_analytics_summary_v2", {
      p_tenant_id: (tenantId === "ALL" ? null : tenantId) as string,
      p_days: days || 30,
      p_listing_type: (listingType || null) as string,
      p_property_type: (propertyType || null) as string,
      p_area: (area || null) as string
    });

    if (summaryError) {
       console.error("❌ Analytics RPC Error Details:", {
         message: summaryError.message,
         details: summaryError.details,
         hint: summaryError.hint,
         code: summaryError.code
       });
       return {
         topProperties: (topProps as any) || [],
         topPropertiesCount: topPropsCount || 0,
         topAreas: [],
         totalViews: 0,
         listingTypeDistribution: [],
         propertyTypeDistribution: [],
         viewsTrend: [],
         agentPerformance: [],
         funnel: { views: 0, leads: 0, deals: 0 },
         error: `ระบบวิเคราะห์ข้อมูลขัดข้อง (CODE: ${summaryError.code}): ${summaryError.message}`
       };
    }

    const summary = data as any; // RPC returns Json, we safely cast and map below

    const viewsTrend: ViewsTrendData[] = (summary?.daily_trends || []).map((d: any) => ({
      date: d.date,
      views: Number(d.views || 0)
    }));

    const listingTypeDist: DistributionData[] = (summary?.listing_type_distribution || []).map((lt: any) => ({
      label: lt.label,
      value: Number(lt.value || 0)
    }));

    const propertyTypeDist: DistributionData[] = (summary?.property_type_distribution || []).map((pt: any) => ({
      label: pt.label,
      value: Number(pt.value || 0)
    }));

    const topAreas: AreaAnalytics[] = (summary?.area_distribution || []).map((a: any) => ({
      name: a.label,
      view_count: Number(a.value || 0),
      leads_count: 0
    }));

    const agentPerformance: AgentPerformanceData[] = (summary?.agent_performance || []).map((ap: any) => ({
      name: ap.name,
      leads_count: Number(ap.leads_count || 0),
      deals_count: Number(ap.deals_count || 0)
    }));

    return {
      topProperties: (topProps as any) || [],
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
