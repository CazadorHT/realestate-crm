import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isAdmin } from "@/lib/auth-shared";
import {
  getAnalyticsStats,
  type PropertyAnalytics,
  type AreaAnalytics,
} from "@/features/dashboard/queries";
import { LISTING_TYPE_LABELS } from "@/features/properties/labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Eye,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { ExportButton } from "./components/ExportButton";
import { PrintReportButton } from "./components/PrintReportButton";
import { ResetViewsButton } from "./components/ResetViewsButton";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { QuickInsights } from "./components/QuickInsights";
import { AnalyticsSkeleton } from "./components/AnalyticsSkeleton";
import { AnalyticsTrend } from "./components/AnalyticsTrend";
import { AreaHeatmap } from "./components/AreaHeatmap";
import { AnalyticsFunnel } from "./components/AnalyticsFunnel";
import { AgentPerformance } from "./components/AgentPerformance";
import { PrintStyles } from "./components/PrintStyles";
import { AnalyticsError } from "./components/AnalyticsError";
import Image from "next/image";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ range?: string; page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return redirect("/protected");
  }

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent searchParams={props.searchParams} />
    </Suspense>
  );
}

import { AnalyticsOverview } from "@/features/analytics/components/AnalyticsOverview";
import { TopPropertiesTable } from "@/features/analytics/components/TopPropertiesTable";

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; page?: string; listingType?: string; area?: string; sortBy?: string }>;
}) {
  const params = await searchParams;
  const tenantId = await getActiveTenantCookie();
  const range = params.range;
  const days = range && range !== "all" ? parseInt(range) : undefined;
  const page = Number(params.page) || 1;
  const pageSize = 10;
  const listingType = params.listingType === "all" ? undefined : params.listingType;
  const area = params.area === "all" ? undefined : params.area;
  const sortBy = params.sortBy;

  const { 
    topProperties, 
    topPropertiesCount, 
    topAreas, 
    totalViews,
    listingTypeDistribution,
    propertyTypeDistribution,
    viewsTrend,
    agentPerformance,
    funnel,
    error
  } = await getAnalyticsStats(tenantId, days, page, pageSize, listingType, undefined, area, sortBy);

  return (
    <>
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sarabun">
      <PageHeader
        title="ข้อมูลวิเคราะห์ (Analytics)"
        subtitle="ภาพรวมการเข้าชมทรัพย์สินและแนวโน้มตลาดย่านต่างๆ"
        icon="trendingUp"
        gradient="blue"
        actionSlot={
          <div className="grid grid-cols-4 sm:grid-cols-1 lg:grid-cols-2 xl:flex items-center gap-2">
            <AnalyticsFilters />
            <PrintReportButton />
            <ExportButton 
              topProperties={topProperties} 
              topAreas={topAreas} 
              totalViews={totalViews} 
            />
            <ResetViewsButton />
          </div>
        }
      />

      {error && <AnalyticsError message={error} />}

      <AnalyticsOverview 
        totalViews={totalViews} 
        topAreas={topAreas} 
        topProperties={topProperties} 
        days={days} 
      />

      <QuickInsights 
        topAreas={topAreas} 
        listingTypeDist={listingTypeDistribution} 
        propertyTypeDist={propertyTypeDistribution}
        totalViews={totalViews}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsFunnel data={funnel} />
        <AgentPerformance data={agentPerformance} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnalyticsTrend data={viewsTrend} />
        <AnalyticsCharts 
          topAreas={topAreas} 
          listingTypeDist={listingTypeDistribution} 
          propertyTypeDist={propertyTypeDistribution} 
        />

        <AreaHeatmap data={topAreas} />
      </div>

      <TopPropertiesTable 
        topProperties={topProperties} 
        topPropertiesCount={topPropertiesCount} 
        page={page} 
        pageSize={pageSize} 
      />
    </div>

    <PrintStyles />
    </>
  );
}
