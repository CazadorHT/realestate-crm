"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { ExportButton } from "./ExportButton";
import { PrintReportButton } from "./PrintReportButton";
import { ResetViewsButton } from "./ResetViewsButton";
import { AnalyticsOverview } from "@/features/analytics/components/AnalyticsOverview";
import { QuickInsights } from "./QuickInsights";
import { AnalyticsFunnel } from "./AnalyticsFunnel";
import { AgentPerformance } from "./AgentPerformance";
import { AnalyticsTrend } from "./AnalyticsTrend";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AreaHeatmap } from "./AreaHeatmap";
import { TopPropertiesTable } from "@/features/analytics/components/TopPropertiesTable";
import { PrintStyles } from "./PrintStyles";
import { AnalyticsError } from "./AnalyticsError";
import {
  type PropertyAnalytics,
  type AreaAnalytics,
  type DistributionData,
  type ViewsTrendData,
  type AgentPerformanceData,
} from "@/features/dashboard/queries";
import { useLanguage } from "@/lib/i18n/language-context";

interface AnalyticsPageViewProps {
  topProperties: PropertyAnalytics[];
  topPropertiesCount: number;
  topAreas: AreaAnalytics[];
  totalViews: number;
  listingTypeDistribution: DistributionData[];
  propertyTypeDistribution: DistributionData[];
  viewsTrend: ViewsTrendData[];
  agentPerformance: AgentPerformanceData[];
  funnel: {
    views: number;
    leads: number;
    deals: number;
  };
  error?: string | null;
  days?: number;
  page: number;
  pageSize: number;
}

export function AnalyticsPageView({
  topProperties,
  topPropertiesCount,
  topAreas,
  totalViews,
  listingTypeDistribution,
  propertyTypeDistribution,
  viewsTrend,
  agentPerformance,
  funnel,
  error,
  days,
  page,
  pageSize,
}: AnalyticsPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <>
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sarabun">
        <PageHeader
          title={isEn ? "Analytics & Market Insights" : "ข้อมูลวิเคราะห์เชิงลึกและการตลาด"}
          subtitle={
            isEn
              ? "Comprehensive property engagement, buyer interest, and area market trends"
              : "ภาพรวมการเข้าชมทรัพย์สินและแนวโน้มตลาดย่านต่างๆ"
          }
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
