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
  type DashboardStats,
  type RevenueChartData,
  type FunnelData,
  type PipelineData,
  type TopAgent,
  type Notification,
  type AgendaEvent,
  type FollowUpLead,
  type RiskDeal,
} from "@/features/dashboard/queries";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
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

  const profile = await getCurrentProfile();
  const staff = profile ? isStaff(profile.role) : false;

  const showAnalytics = isFeatureEnabled("dashboard_analytics");
  const showSmartSummary = isFeatureEnabled("ai_smart_summary");

  // Basic info always fetched fast
  const notificationsPromise = getRecentNotifications(
    profile?.notification_preferences as any,
  );
  const agendaPromise = getTodayAgenda();
  const followUpPromise = getFollowUpLeads();
  const riskPromise = getRiskDeals();
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

  return (
    <div className="flex flex-col gap-6 p-2 pb-20">
      {/* 1. HEADER & SEARCH */}
      <DashboardHeader email={user?.email} name={profile?.full_name} />

      <>
        {/* 2. SMART SUMMARY (AI GATED) */}
        {showSmartSummary ? (
          <Suspense fallback={<Skeleton className="h-14 w-full rounded-2xl" />}>
            <SmartSummaryWrapper />
          </Suspense>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm italic">
            Dashboard Overview (Lite Edition)
          </div>
        )}

        {/* 3. KPI CARDS (ANALYTICS GATED) */}
        {showAnalytics && <StatsSectionSuspense />}

        {/* 4. MAIN ANALYTICS & OPERATIONS GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT COLUMN (2/3 width on large screens) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {showAnalytics ? (
              <>
                {/* PIPELINE & FUNNEL ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Suspense fallback={<ChartSkeleton />}>
                    <PipelineWrapper />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton />}>
                    <FunnelWrapper />
                  </Suspense>
                </div>

                {/* REVENUE CHART */}
                <div className="min-h-[400px]">
                  <Suspense fallback={<ChartSkeleton />}>
                    <RevenueWrapper />
                  </Suspense>
                </div>

                {/* TOP AGENTS & INSIGHTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Suspense fallback={<ListSkeleton />}>
                      <TopAgentsWrapper />
                    </Suspense>
                  </div>
                  <div className="flex flex-col gap-4">
                    <FollowUpInsights leads={followUpLeads} />
                    <RiskAlerts deals={riskDeals} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <FollowUpInsights leads={followUpLeads} />
                <RiskAlerts deals={riskDeals} />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (1/3 width) */}
          <div className="flex flex-col gap-6 ">
            <QuickActions />
            <UpcomingEvents events={upcomingEvents} />
            <NotificationCenter notifications={notifications} />
            <AgendaList agenda={agendaData} />
          </div>
        </div>

        {/* 5. RECENT PROPERTIES TABLE */}
        <RecentPropertiesSectionSuspense />
      </>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// Inline Wrappers for simpler refactoring
async function SmartSummaryWrapper() {
  const stats = await getDashboardStats();
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

async function PipelineWrapper() {
  const data = await getPipelineStats();
  return <PipelineSummary data={data || []} />;
}

async function FunnelWrapper() {
  const data = await getFunnelStats();
  return <FunnelChart data={data} />;
}

async function RevenueWrapper() {
  const data = await getRevenueChartData();
  return <RevenueChart initialData={data} />;
}

async function TopAgentsWrapper() {
  const data = await getTopAgents();
  return <TopAgents data={data} />;
}
