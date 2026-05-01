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
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const FunnelChart = dynamic(() => import("@/components/dashboard/FunnelChart").then(mod => mod.FunnelChart), {
  loading: () => <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />
});
const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart").then(mod => mod.RevenueChart), {
  loading: () => <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />
});
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
  getPipelineStats 
} from "@/features/dashboard/queries/stats";
import { getTopAgents, getMarketingPerformanceData } from "@/features/dashboard/queries/performance";
import { getRecentNotifications, getTodayAgenda } from "@/features/dashboard/queries/notifications";
import { getFollowUpLeads, getRiskDeals, getSetupProgress } from "@/features/dashboard/queries/maintenance";
import type { 
  DashboardStats, 
  RevenueChartData, 
  FunnelData, 
  PipelineData, 
  TopAgent, 
  Notification, 
  AgendaEvent, 
  FollowUpLead, 
  RiskDeal 
} from "@/features/dashboard/queries/types";
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

  // [PERFORMANCE] Parallel Fetching: Core Auth & Context
  const [userResponse, tenantId, profile] = await Promise.all([
    supabase.auth.getUser(),
    getActiveTenantCookie(),
    getCurrentProfile(),
  ]);

  const user = userResponse.data.user;
  const staff = profile ? isStaff(profile.role) : false;

  const showAnalytics = isFeatureEnabled("dashboard_analytics");
  const showSmartSummary = isFeatureEnabled("ai_smart_summary");

  // Basic info promises (non-blocking)
  const notificationsPromise = getRecentNotifications(
    profile?.notification_preferences as any,
    tenantId,
  );
  const agendaPromise = getTodayAgenda(tenantId);
  const followUpPromise = getFollowUpLeads(tenantId);
  const riskPromise = getRiskDeals(tenantId);
  const upcomingPromise = getCalendarEvents(new Date(), addDays(new Date(), 7));
  const setupProgressPromise = getSetupProgress(tenantId);

  // If not staff, show simple card
  if (!staff) {
    return (
      <div className="flex flex-col gap-6 p-2 pb-20">
        <DashboardHeader email={user?.email} name={profile?.full_name} />
        <PendingApprovalCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2 pb-20">
      {/* 1. HEADER & SEARCH */}
      <DashboardHeader email={user?.email} name={profile?.full_name} />

      <SystemStatus />

      <Suspense fallback={<div className="h-20 animate-pulse bg-slate-50 rounded-2xl" />}>
        <SetupSectionWrapper promise={setupProgressPromise} role={profile?.role} />
      </Suspense>

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
                    <ErrorBoundary>
                      <RevenueWrapper tenantId={tenantId} />
                    </ErrorBoundary>
                  </Suspense>
                </div>

                {/* PIPELINE & FUNNEL ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense fallback={<ChartSkeleton />}>
                    <PipelineWrapper tenantId={tenantId} />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <ErrorBoundary>
                      <FunnelWrapper tenantId={tenantId} />
                    </ErrorBoundary>
                  </Suspense>
                  
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
                    <FollowUpWrapper promise={followUpPromise} />
                  </Suspense>
                  <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
                    <RiskWrapper promise={riskPromise} />
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

            {/* Daily Management */}
            <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
              <UpcomingEventsWrapper promise={upcomingPromise} />
            </Suspense>
            <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
              <AgendaWrapper promise={agendaPromise} />
            </Suspense>
            <Suspense fallback={<div className="h-40 animate-pulse bg-slate-50 rounded-2xl" />}>
              <NotificationsWrapper promise={notificationsPromise} />
            </Suspense>
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

// Inline Wrappers for simpler refactoring and Non-blocking data flow
async function SetupSectionWrapper({ promise, role }: { promise: Promise<any>, role?: string }) {
  const setupProgress = await promise;
  return (
    <>
      <ProactiveSetupTrigger
        branchCount={setupProgress.branchCount}
        role={role}
      />
      <SetupChecklist progress={setupProgress} />
    </>
  );
}

async function FollowUpWrapper({ promise }: { promise: Promise<any> }) {
  const data = await promise;
  return <FollowUpInsights leads={data} />;
}

async function RiskWrapper({ promise }: { promise: Promise<any> }) {
  const data = await promise;
  return <RiskAlerts deals={data} />;
}

async function UpcomingEventsWrapper({ promise }: { promise: Promise<any> }) {
  const data = await promise;
  return <UpcomingEvents events={data} />;
}

async function AgendaWrapper({ promise }: { promise: Promise<any> }) {
  const data = await promise;
  return <AgendaList agenda={data} />;
}

async function NotificationsWrapper({ promise }: { promise: Promise<any> }) {
  const data = await promise;
  return <NotificationCenter notifications={data} />;
}

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
