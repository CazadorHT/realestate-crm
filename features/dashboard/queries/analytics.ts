import { createClient } from "@/lib/supabase/server";
import { AnalyticsResult, ViewsTrendData, DistributionData, AreaAnalytics, AgentPerformanceData } from "./types";
import { getListingTypeFromDb, getPropertyTypeFromDb } from "@/features/properties/labels";
import { Database } from "@/lib/database.types.generated";
import { SupabaseClient } from "@supabase/supabase-js";

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
          "id, slug, listing_type:listing_type_int, property_type:property_type_int, price, rental_price, view_count, title, title_en, property_images:property_media_v3(image_url:url, is_cover)",
          { count: "exact" },
        )
    );

    const { data: topProps, count: topPropsCount } = await query
      .order("view_count", { ascending: false })
      .range(offset, offset + pageSize - 1);


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
          topProperties: ((topProps as unknown as TopPropertyRow[]) || []).map((p) => ({
            ...p,
            title: p.title || p.title_en || "ไม่มีชื่อ",
            slug: p.slug || "",
            listing_type: getListingTypeFromDb(p.listing_type),
            property_type: getPropertyTypeFromDb(p.property_type),
            price: p.price || null,
            rental_price: p.rental_price || null,
            view_count: p.view_count || 0,
            property_images: (p.property_images || []).map(img => ({ ...img, is_cover: !!img.is_cover }))
          })),
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

    const agentPerformance: AgentPerformanceData[] = (summary?.agent_performance || []).map((ap) => ({
      name: ap.name,
      leads_count: Number(ap.leads_count || 0),
      deals_count: Number(ap.deals_count || 0)
    }));

    return {
      topProperties: ((topProps as unknown as TopPropertyRow[]) || []).map((p) => ({
        ...p,
        title: p.title || p.title_en || "ไม่มีชื่อ",
        slug: p.slug || "",
        listing_type: getListingTypeFromDb(p.listing_type),
        property_type: getPropertyTypeFromDb(p.property_type),
        price: p.price || null,
        rental_price: p.rental_price || null,
        view_count: p.view_count || 0,
        property_images: (p.property_images || []).map(img => ({ ...img, is_cover: !!img.is_cover }))
      })),
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
