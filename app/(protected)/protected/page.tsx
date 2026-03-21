import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "แดชบอร์ด",
  description: "ภาพรวมระบบ CRM อสังหาริมทรัพย์ สถิติ รายได้ และข้อมูลสำคัญ",
};

// Widgets
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { SmartSummary } from "@/components/dashboard/SmartSummary";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AgendaList } from "@/components/dashboard/AgendaList";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { FollowUpInsights } from "@/components/dashboard/FollowUpInsights";
import { RiskAlerts } from "@/components/dashboard/RiskAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PendingApprovalCard } from "@/components/dashboard/PendingApprovalCard";
import { RecentPropertiesTable } from "@/components/dashboard/RecentPropertiesTable";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { MarketingROISummary } from "@/components/dashboard/MarketingROISummary";
import { ExecutiveAISummary } from "@/components/dashboard/ExecutiveAISummary";

// Queries
import {
  getDashboardStats,
  getRevenueChartData,
  getFunnelStats,
  getPipelineStats,
  getTopAgents,
  getRecentNotifications,
  getTodayAgenda,
  getFollowUpLeads,
  getRiskDeals,
  getMarketingPerformanceData,
  type DashboardStats,
  type RevenueChartData,
  type FunnelData,
  type PipelineData,
  type TopAgent,
  type Notification,
  type AgendaEvent,
  type FollowUpLead,
  type RiskDeal,
  getSetupProgress,
} from "@/features/dashboard/queries";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { ProactiveSetupTrigger } from "@/components/dashboard/ProactiveSetupTrigger";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { siteConfig } from "@/lib/site-config";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";
import { isStaff } from "@/lib/authz";
import { getCalendarEvents } from "@/features/calendar/queries";
import { UpcomingEvents } from "@/features/dashboard/components/UpcomingEvents";
import { addDays } from "date-fns";

import type { Database } from "@/lib/database.types";
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

// Feature Gating
import { isFeatureEnabled } from "@/lib/features";

// Streaming Wrappers
import { StatsSectionSuspense } from "@/components/dashboard/StatsSection";
import { RecentPropertiesSectionSuspense } from "@/components/dashboard/RecentPropertiesSection";
import { Suspense } from "react";
import { StatsSkeleton } from "@/components/dashboard/skeletons/StatsSkeleton";
import { ListSkeleton } from "@/components/dashboard/skeletons/ListSkeleton";
import { ChartSkeleton } from "@/components/dashboard/skeletons/ChartSkeleton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId = await getActiveTenantCookie();

  const profile = await getCurrentProfile();
  const staff = profile ? isStaff(profile.role) : false;

  const showAnalytics = isFeatureEnabled("dashboard_analytics");
  const showSmartSummary = isFeatureEnabled("ai_smart_summary");

  // Basic info always fetched fast
  const notificationsPromise = getRecentNotifications(
    profile?.notification_preferences as any,
    tenantId,
  );
  const agendaPromise = getTodayAgenda(tenantId);
  const followUpPromise = getFollowUpLeads(tenantId);
  const riskPromise = getRiskDeals(tenantId);
  const upcomingPromise = getCalendarEvents(new Date(), addDays(new Date(), 7));

  // If not staff, show simple card
  if (!staff) {
    return (
      <div className="flex flex-col gap-6 p-2 pb-20">
        <DashboardHeader email={user?.email} name={profile?.full_name} />
        <PendingApprovalCard />
      </div>
    );
  }

  // Await basic info (fast queries)
  const [notifications, agendaData, followUpLeads, riskDeals, upcomingEvents] =
    await Promise.all([
      notificationsPromise,
      agendaPromise,
      followUpPromise,
      riskPromise,
      upcomingPromise,
    ]);
  const setupProgress = await getSetupProgress();

  return (
    <div className="flex flex-col gap-6 p-2 pb-20">
      {/* 1. HEADER & SEARCH */}
      <DashboardHeader email={user?.email} name={profile?.full_name} />

      <SystemStatus />

      <ProactiveSetupTrigger
        branchCount={setupProgress.branchCount}
        role={profile?.role}
      />

      <SetupChecklist progress={setupProgress} />

      <>
        {/* 2. SMART SUMMARY (AI GATED) */}
        {showSmartSummary ? (
          <Suspense fallback={<Skeleton className="h-14 w-full rounded-2xl" />}>
            <SmartSummaryWrapper tenantId={tenantId} />
          </Suspense>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm italic">
            Dashboard Overview (Lite Edition)
          </div>
        )}

        {/* 3. KPI CARDS & QUICK ACTIONS */}
        <div className="flex flex-col gap-6">
          {showAnalytics && <StatsSectionSuspense tenantId={tenantId} />}
          <QuickActions />
        </div>

        {/* 4. MAIN ANALYTICS & OPERATIONS GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* CORE ANALYTICS (2/3 width) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {showAnalytics ? (
              <>
                {/* REVENUE CHART (Priority 1) */}
                <div className="min-h-[400px]">
                  <Suspense fallback={<ChartSkeleton />}>
                    <RevenueWrapper tenantId={tenantId} />
                  </Suspense>
                </div>

                {/* PIPELINE & FUNNEL ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense fallback={<ChartSkeleton />}>
                    <PipelineWrapper tenantId={tenantId} />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <FunnelWrapper tenantId={tenantId} />
                  </Suspense>
                </div>

                {/* TOP AGENTS */}
                <Suspense fallback={<ListSkeleton />}>
                  <TopAgentsWrapper tenantId={tenantId} />
                </Suspense>
              </>
            ) : (
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="text-slate-400 mb-2">Analytics not enabled</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Upgrade your plan to unlock real-time revenue tracking and performance insights.
                </p>
              </div>
            )}
          </div>

          {/* SIDEBAR: INSIGHTS & OPS (1/3 width) */}
          <div className="flex flex-col gap-6">
            {/* AI Insights & Alerts */}
            <ExecutiveAISummary tenantId={tenantId} />
            
            <Suspense fallback={<ChartSkeleton />}>
              <MarketingROIWrapper tenantId={tenantId} />
            </Suspense>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
               <FollowUpInsights leads={followUpLeads} />
               <RiskAlerts deals={riskDeals} />
            </div>

            {/* Daily Management */}
            <UpcomingEvents events={upcomingEvents} />
            <AgendaList agenda={agendaData} />
            <NotificationCenter notifications={notifications} />
          </div>
        </div>

        {/* 5. RECENT PROPERTIES TABLE (Full Width) */}
        <div className="mt-2">
           <RecentPropertiesSectionSuspense tenantId={tenantId} />
        </div>
      </>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// Inline Wrappers for simpler refactoring
async function SmartSummaryWrapper({ tenantId }: { tenantId?: string | null }) {
  const stats = await getDashboardStats(tenantId);
  return (
    <SmartSummary
      text={
        stats
          ? `เดือนนี้มีรายได้รวม ${stats.revenueThisMonth.toLocaleString()} บาท เก็บ Lead ใหม่อีก ${
              stats.leadsThisMonth
            } คน และปิดการขายไปแล้ว ${stats.dealsWon} ดีล`
          : "กำลังประมวลผลข้อมูล..."
      }
    />
  );
}

async function PipelineWrapper({ tenantId }: { tenantId?: string | null }) {
  const data = await getPipelineStats(tenantId);
  return <PipelineSummary data={data || []} />;
}

async function FunnelWrapper({ tenantId }: { tenantId?: string | null }) {
  const data = await getFunnelStats(tenantId);
  return <FunnelChart data={data} />;
}

async function RevenueWrapper({ tenantId }: { tenantId?: string | null }) {
  const data = await getRevenueChartData(tenantId);
  return <RevenueChart initialData={data} />;
}

async function TopAgentsWrapper({ tenantId }: { tenantId?: string | null }) {
  const data = await getTopAgents(tenantId);
  return <TopAgents data={data} />;
}

async function MarketingROIWrapper({ tenantId }: { tenantId?: string | null }) {
  const data = await getMarketingPerformanceData(tenantId);
  return <MarketingROISummary data={data} />;
}
