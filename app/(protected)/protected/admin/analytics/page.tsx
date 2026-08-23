import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isAdmin } from "@/lib/auth-shared";
import {
  getAnalyticsStats,
} from "@/features/dashboard/queries";
import { AnalyticsSkeleton } from "./components/AnalyticsSkeleton";
import { AnalyticsPageView } from "./components/AnalyticsPageView";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";

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
    <AnalyticsPageView
      topProperties={topProperties}
      topPropertiesCount={topPropertiesCount}
      topAreas={topAreas}
      totalViews={totalViews}
      listingTypeDistribution={listingTypeDistribution}
      propertyTypeDistribution={propertyTypeDistribution}
      viewsTrend={viewsTrend}
      agentPerformance={agentPerformance}
      funnel={funnel}
      error={error}
      days={days}
      page={page}
      pageSize={pageSize}
    />
  );
}
