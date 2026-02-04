import { createClient } from "@/lib/supabase/server";

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getCurrentProfile();
  const staff = profile ? isStaff(profile.role) : false;

  // Fetch Dashboard Data only for staff
  let properties: PropertyRow[] = [];
  let dashboardStats: DashboardStats | null = null;
  let revenueData: RevenueChartData[] = [];
  let funnelData: FunnelData[] = [];
  let pipelineData: PipelineData[] = [];
  let topAgents: TopAgent[] = [];
  let notifications: Notification[] = [];
  let agendaData: AgendaEvent[] = [];
  let followUpLeads: FollowUpLead[] = [];
  let riskDeals: RiskDeal[] = [];
  let upcomingEvents: any[] = [];

  if (staff) {
    const [
      recentPropertiesResult,
      stats,
      revenue,
      funnel,
      pipeline,
      agents,
      notifs,
      agenda,
      followUp,
      risks,
      upcomingEventsResult,
    ] = await Promise.all([
      supabase
        .from("properties")
        .select(
          `
          *,
          property_images (
             image_url,
             is_cover,
             sort_order
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
      getDashboardStats(),
      getRevenueChartData(),
      getFunnelStats(),
      getPipelineStats(),
      getTopAgents(),
      getRecentNotifications(profile?.notification_preferences as any),
      getTodayAgenda(),
      getFollowUpLeads(),
      getRiskDeals(),
      getCalendarEvents(new Date(), addDays(new Date(), 7)),
    ]);

    // Manually cast to include property_images in the type
    properties = (recentPropertiesResult.data ?? []).map((p: any) => ({
      ...p,
      // Sort images by sort_order
      property_images: p.property_images?.sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      ),
    })) as unknown as PropertyRow[];
    dashboardStats = stats;
    revenueData = revenue;
    funnelData = funnel;

    pipelineData = pipeline || [];
    topAgents = agents;
    notifications = notifs;
    agendaData = agenda;
    followUpLeads = followUp;
    riskDeals = risks;
    upcomingEvents = upcomingEventsResult;
  }

  return (
    <div className="flex flex-col gap-6 p-2 pb-20">
      {/* 1. HEADER & SEARCH */}
      <DashboardHeader email={user?.email} name={profile?.full_name} />

      {!staff ? (
        <PendingApprovalCard />
      ) : (
        <>
          {/* 2. SMART SUMMARY */}
          <SmartSummary
            text={
              dashboardStats
                ? `เดือนนี้มีรายได้รวม ${dashboardStats.revenueThisMonth.toLocaleString()} บาท เก็บ Lead ใหม่อีก ${
                    dashboardStats.leadsThisMonth
                  } คน และปิดการขายไปแล้ว ${dashboardStats.dealsWon} ดีล`
                : "กำลังประมวลผลข้อมูล..."
            }
          />

          {/* 3. KPI CARDS */}
          {dashboardStats && <StatsOverview initialStats={dashboardStats} />}

          {/* 4. MAIN ANALYTICS & OPERATIONS GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2/3 width on large screens) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* PIPELINE & FUNNEL ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PipelineSummary data={pipelineData} />
                <FunnelChart data={funnelData} />
              </div>

              {/* REVENUE CHART */}
              <div className="h-[350px]">
                <RevenueChart initialData={revenueData} />
              </div>

              {/* TOP AGENTS & INSIGHTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <TopAgents data={topAgents} />
                </div>
                <div className="flex flex-col gap-4">
                  <FollowUpInsights leads={followUpLeads} />
                  <RiskAlerts deals={riskDeals} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3 width) */}
            <div className="flex flex-col gap-6">
              <QuickActions />
              <UpcomingEvents events={upcomingEvents} />
              <NotificationCenter notifications={notifications} />
              <AgendaList agenda={agendaData} />
            </div>
          </div>

          {/* 5. RECENT PROPERTIES TABLE */}
          <RecentPropertiesTable properties={properties} />
        </>
      )}
    </div>
  );
}
