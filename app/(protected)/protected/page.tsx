import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "แดชบอร์ด",
  description: "ภาพรวมระบบ CRM อสังหาริมทรัพย์ สถิติ รายได้ และข้อมูลสำคัญ",
};

// วิดเจ็ตต่างๆ
import { StatsSectionSuspense } from "@/components/dashboard/StatsSection";
import { SmartSummary } from "@/components/dashboard/SmartSummary";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AlertCircle } from "lucide-react";

const FunnelChart = dynamic(
  () =>
    import("@/components/dashboard/FunnelChart").then((mod) => mod.FunnelChart),
  {
    loading: () => (
      <div className="h-[250px] w-full bg-slate-50 animate-pulse rounded-xl" />
    ),
  },
);
const RevenueChart = dynamic(
  () =>
    import("@/components/dashboard/RevenueChart").then(
      (mod) => mod.RevenueChart,
    ),
  {
    loading: () => (
      <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />
    ),
  },
);
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
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

// คิวรีข้อมูล
import {
  getDashboardStats,
  getRevenueChartData,
  getFunnelStats,
  getPipelineStats,
} from "@/features/dashboard/queries/stats";
import { getSystemConfig } from "@/lib/actions/system-config";
import {
  getTopAgents,
  getMarketingPerformanceData,
} from "@/features/dashboard/queries/performance";
import {
  getRecentNotifications,
  getTodayAgenda,
} from "@/features/dashboard/queries/notifications";
import {
  getFollowUpLeads,
  getRiskDeals,
  getSetupProgress,
} from "@/features/dashboard/queries/maintenance";
import type {
  DashboardStats,
  RevenueChartData,
  FunnelData,
  PipelineData,
  TopAgent,
  Notification,
  AgendaEvent,
  FollowUpLead,
  RiskDeal,
} from "@/features/dashboard/queries/types";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { ProactiveSetupTrigger } from "@/components/dashboard/ProactiveSetupTrigger";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { siteConfig } from "@/lib/site-config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";
import { isStaff } from "@/lib/authz";
import { getCalendarEvents } from "@/features/calendar/queries";
import { UpcomingEvents } from "@/features/dashboard/components/UpcomingEvents";
import { addDays } from "date-fns";
import {
  getAgentDashboardStats,
  getAgentTasks,
} from "@/features/dashboard/queries/agent-dashboard";
import { AgentTaskBoard } from "@/features/dashboard/components/agent/AgentTaskBoard";

import type { Database } from "@/lib/database.types.generated";

// การควบคุมฟีเจอร์
import { isFeatureEnabled } from "@/lib/features";

import { RecentPropertiesSectionSuspense } from "@/components/dashboard/RecentPropertiesSection";
import { Suspense } from "react";
import { StatsSkeleton } from "@/components/dashboard/skeletons/StatsSkeleton";
import { ListSkeleton } from "@/components/dashboard/skeletons/ListSkeleton";
import { ChartSkeleton } from "@/components/dashboard/skeletons/ChartSkeleton";
import {
  MotionSection,
  MotionStaggerContainer,
  MotionStaggerItem,
} from "@/components/shared/MotionSection";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const range = (searchParams.range as string) || "all";
  const branchId = searchParams.branchId as string | undefined;
  const teamId = searchParams.teamId as string | undefined;
  const agentId = searchParams.agentId as string | undefined;

  const supabase = await createClient();

  // [ประสิทธิภาพ] การดึงข้อมูลแบบขนาน: การตรวจสอบสิทธิ์และบริบทหลัก
  const [userResponse, tenantId, profile, config] = await Promise.all([
    supabase.auth.getUser(),
    getActiveTenantCookie(),
    getCurrentProfile(),
    getSystemConfig(),
  ]);

  const user = userResponse.data.user;
  const staff = profile ? isStaff(profile.role) : false;
  const multiTenantEnabled = config.multi_tenant_enabled;

  const defaultView = profile?.role === "AGENT" ? "personal" : "company";
  const view = (searchParams.view as "company" | "personal" | "staff" | "branch" | "team") || defaultView;

  const showAnalytics = isFeatureEnabled("dashboard_analytics");
  const showSmartSummary = isFeatureEnabled("ai_smart_summary");

  // Determine the user ID to filter by (if in staff view, use agentId)
  const currentUserId = view === "staff" ? agentId : user?.id;

  // สัญญาข้อมูลพื้นฐาน (แบบไม่รอคิว)
  const notificationsPromise = getRecentNotifications(
    profile?.notification_preferences as Record<string, any>,
    tenantId,
    currentUserId,
  );
  const agendaPromise = getTodayAgenda(tenantId, currentUserId);
  const followUpPromise = getFollowUpLeads(tenantId, currentUserId);
  const riskPromise = getRiskDeals(tenantId, currentUserId);
  const upcomingPromise = getCalendarEvents(new Date(), addDays(new Date(), 7));
  const setupPromise = getSetupProgress(tenantId, user?.id);

  // หากไม่ใช่พนักงาน ให้แสดงการ์ดแบบง่าย
  if (!staff) {
    return (
      <div className="flex flex-col gap-6 p-2 pb-20">
        <DashboardHeader email={user?.email} name={profile?.full_name} />
        <PendingApprovalCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2 pb-20 overflow-x-hidden">
      {/* 1. ส่วนหัวและการค้นหา */}
      <MotionSection duration={0.6}>
        <DashboardHeader email={user?.email} name={profile?.full_name} />
      </MotionSection>

      {/* 2. สถานะระบบและการเชื่อมต่อ */}
      <MotionSection delay={0.1}>
        <SystemStatus />
      </MotionSection>

      {/* 3. สถานะการตั้งค่า setup เริ่มต้น */}
      <Suspense
        fallback={
          <div className="h-24 animate-shimmer bg-slate-50 rounded-3xl" />
        }
      >
        <MotionSection delay={0.15}>
          <SetupSectionWrapper promise={setupPromise} role={profile?.role} />
        </MotionSection>
      </Suspense>

      <MotionStaggerContainer delayChildren={0.2} staggerChildren={0.1}>
        {/* 4. ภาพรวมระบบวิเคราะห์ Card */}
        <MotionStaggerItem className="flex flex-col gap-6 min-h-[180px]">
          <ErrorBoundary>
            <StatsSectionSuspense
              tenantId={tenantId}
              userId={
                view === "staff"
                  ? agentId
                  : view === "personal"
                    ? user?.id
                    : undefined
              }
              role={profile?.role}
              range={range}
              view={view}
              branchId={branchId}
              teamId={teamId}
            />
          </ErrorBoundary>
        </MotionStaggerItem>

        <MotionStaggerItem className={cn(
          "space-y-6 bg-linear-to-br from-blue-50/50 via-indigo-50 to-blue-50/50 p-4 sm:p-6 lg:p-8 rounded-3xl border border-indigo-100/50 shadow-sm",
          profile?.role === "AGENT" ? "min-h-[400px]" : "min-h-[600px]"
        )}>
          {/* ตัวกรอง */}
          <ErrorBoundary fallback={<div className="p-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 text-xs">ตัวกรองขัดข้อง</div>}>
            <DashboardFilters
              role={profile?.role}
              multiTenantEnabled={multiTenantEnabled}
            />
          </ErrorBoundary>
          {/* 5. ตารางการวิเคราะห์และการดำเนินงานหลัก */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* การวิเคราะห์หลัก (กว้าง 2/3) แถบข้างซ้าย */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* สรุปอัจฉริยะ (AI Gated) */}
              {showSmartSummary ? (
                <ErrorBoundary fallback={<MiniErrorFallback />}>
                  <Suspense
                    fallback={<Skeleton className="h-32 w-full rounded-3xl animate-shimmer" />}
                  >
                    <SmartSummaryWrapper
                      tenantId={tenantId}
                      userId={view === "staff" ? agentId : user?.id}
                      role={profile?.role}
                      view={view}
                      range={range}
                      branchId={branchId}
                    />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm italic">
                  ภาพรวมแดชบอร์ด (ฉบับย่อ)
                </div>
              )}
              {/* กระดานงานตัวแทน (เด่นสำหรับตัวแทน หรือเมื่อ Admin ดูรายพนักงาน) */}
              {(profile?.role === "AGENT" || view === "staff") && (
                <ErrorBoundary fallback={<MiniErrorFallback />}>
                  <Suspense
                    fallback={
                      <div className="h-40 animate-shimmer bg-slate-50 rounded-[2.5rem]" />
                    }
                  >
                    <AgentTasksWrapper userId={view === "staff" ? agentId : user?.id} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {showAnalytics ? (
                <>
                  <ErrorBoundary>
                    <AnalyticsSection
                      role={profile?.role}
                      userId={view === "staff" ? agentId : (view === "personal" ? user?.id : undefined)}
                      multiTenantEnabled={multiTenantEnabled}
                      initialRange={range}
                      initialBranchId={branchId || (tenantId ?? undefined)}
                      initialTeamId={teamId}
                      initialView={view}
                    />
                  </ErrorBoundary>

                  {/* แถวงานและความเสี่ยง */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ErrorBoundary fallback={<MiniErrorFallback />}>
                      <Suspense
                        fallback={
                          <div className="h-48 animate-shimmer bg-slate-50 rounded-3xl" />
                        }
                      >
                        <FollowUpWrapper
                          promise={followUpPromise}
                          role={profile?.role}
                          view={view}
                        />
                      </Suspense>
                    </ErrorBoundary>
                    <ErrorBoundary fallback={<MiniErrorFallback />}>
                      <Suspense
                        fallback={
                          <div className="h-48 animate-shimmer bg-slate-50 rounded-3xl" />
                        }
                      >
                        <RiskWrapper
                          promise={riskPromise}
                          role={profile?.role}
                          view={view}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  </div>

                  {/* ตัวแทนยอดเยี่ยม */}
                  {profile?.role !== "AGENT" && (
                    <ErrorBoundary fallback={<MiniErrorFallback />}>
                      <Suspense fallback={<ListSkeleton />}>
                        <TopAgentsWrapper
                          tenantId={tenantId}
                          role={profile?.role}
                          multiTenantEnabled={multiTenantEnabled}
                          branchId={branchId}
                          teamId={teamId}
                          range={range}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                </>
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className="text-slate-400 mb-2 font-medium">
                    ยังไม่ได้เปิดใช้งานการวิเคราะห์
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    อัปเกรดแผนของคุณเพื่อปลดล็อกการติดตามรายได้แบบเรียลไทม์และข้อมูลเชิงลึกด้านประสิทธิภาพ
                  </p>
                </div>
              )}
            </div>

            {/* แถบข้างขวา: ข้อมูลเชิงลึกและการดำเนินการ (กว้าง 1/3) */}
            <div className="flex flex-col gap-6">
              <QuickActions />

              {/* ข้อมูลเชิงลึกและการแจ้งเตือนโดย AI */}
              <ErrorBoundary fallback={<MiniErrorFallback />}>
                <ExecutiveAISummary
                  tenantId={tenantId}
                  role={profile?.role}
                  userId={user?.id as string | undefined}
                  multiTenantEnabled={multiTenantEnabled}
                />
              </ErrorBoundary>

              <ErrorBoundary fallback={<MiniErrorFallback />}>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarketingROIWrapper
                    tenantId={tenantId}
                    branchId={branchId}
                    teamId={teamId}
                    range={range}
                    view={view}
                    agentId={view === "staff" ? agentId : (view === "personal" ? user?.id : undefined)}
                  />
                </Suspense>
              </ErrorBoundary>

              {/* การจัดการรายวัน */}
              <ErrorBoundary fallback={<MiniErrorFallback />}>
                <Suspense
                  fallback={
                    <div className="h-40 animate-shimmer bg-slate-50 rounded-3xl" />
                  }
                >
                  <UpcomingEventsWrapper
                    promise={upcomingPromise}
                    role={profile?.role}
                    view={view}
                  />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary fallback={<MiniErrorFallback />}>
                <Suspense
                  fallback={
                    <div className="h-40 animate-shimmer bg-slate-50 rounded-3xl" />
                  }
                >
                  <AgendaWrapper
                    promise={agendaPromise}
                    role={profile?.role}
                    view={view}
                  />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary fallback={<MiniErrorFallback />}>
                <Suspense
                  fallback={
                    <div className="h-40 animate-shimmer bg-slate-50 rounded-3xl" />
                  }
                >
                  <NotificationsWrapper
                    promise={notificationsPromise}
                    role={profile?.role}
                    view={view}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </MotionStaggerItem>
        {/* 5. ตารางอสังหาริมทรัพย์ล่าสุด (เต็มความกว้าง) */}
        <MotionStaggerItem className="mt-2 min-h-[300px]">
          <ErrorBoundary>
            <RecentPropertiesSectionSuspense 
              tenantId={branchId || tenantId} 
              userId={view === "staff" ? agentId : (view === "personal" ? user?.id : undefined)} 
            />
          </ErrorBoundary>
        </MotionStaggerItem>
      </MotionStaggerContainer>
    </div>

  );
}

// 🛡️ Error Fallback สำหรับ Widget ขนาดเล็ก
const MiniErrorFallback = () => (
  <div className="p-6 border border-dashed border-red-200 bg-red-50/50 rounded-3xl text-center animate-in fade-in duration-500">
    <div className="flex justify-center mb-2">
      <AlertCircle className="h-5 w-5 text-red-400" />
    </div>
    <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Widget Error</p>
    <p className="text-[10px] text-red-400 mt-1">ไม่สามารถโหลดข้อมูลส่วนนี้ได้</p>
  </div>
);

// ตัวหุ้มอินไลน์สำหรับการปรับโครงสร้างที่ง่ายขึ้นและการไหลของข้อมูลแบบไม่รอคิว
async function SetupSectionWrapper({
  promise,
  role,
}: {
  promise: Promise<any>;
  role?: string;
}) {
  const setupProgress = await promise;
  return (
    <>
      <ProactiveSetupTrigger
        branchCount={setupProgress.branchCount}
        role={role}
      />
      <SetupChecklist progress={setupProgress} role={role} />
    </>
  );
}

async function FollowUpWrapper({
  promise,
  role,
  view,
}: {
  promise: Promise<any>;
  role?: string;
  view?: string;
}) {
  const data = await promise;
  return <FollowUpInsights leads={data} role={role} view={view} />;
}

async function RiskWrapper({
  promise,
  role,
  view,
}: {
  promise: Promise<any>;
  role?: string;
  view?: string;
}) {
  const data = await promise;
  return <RiskAlerts deals={data} role={role} view={view} />;
}

async function UpcomingEventsWrapper({
  promise,
  role,
  view,
}: {
  promise: Promise<any>;
  role?: string;
  view?: string;
}) {
  const data = await promise;
  return <UpcomingEvents events={data} role={role} view={view} />;
}

async function AgendaWrapper({
  promise,
  role,
  view,
}: {
  promise: Promise<any>;
  role?: string;
  view?: string;
}) {
  const data = await promise;
  return <AgendaList agenda={data} role={role} view={view} />;
}

async function NotificationsWrapper({
  promise,
  role,
  view,
}: {
  promise: Promise<any>;
  role?: string;
  view?: string;
}) {
  const data = await promise;
  return <NotificationCenter notifications={data} role={role} view={view} />;
}

async function SmartSummaryWrapper({
  tenantId,
  userId,
  role,
  view,
  range,
  branchId,
}: {
  tenantId?: string | null;
  userId?: string;
  role?: string;
  view?: string;
  range?: string;
  branchId?: string;
}) {
  const isAdmin = role === "ADMIN" || role === "MANAGER" || role === "OWNER";

  // 🏢 ดึงการตั้งค่าระบบสำหรับการควบคุมระบบสาขา
  const config = await getSystemConfig();
  const multiTenantEnabled = config.multi_tenant_enabled;

  const stats = await getDashboardStats({ 
    tenantId: branchId || tenantId, 
    agentId: userId, 
    view, 
    targetId: "all", 
    range: range || "all" 
  });

  return (
    <SmartSummary
      initialStats={stats}
      role={role}
      userId={userId as string | undefined}
      multiTenantEnabled={multiTenantEnabled}
    />
  );
}

async function PipelineWrapper({ tenantId, range }: { tenantId?: string | null; range?: string }) {
  const data = await getPipelineStats({ tenantId, range });
  return <PipelineSummary data={data || []} />;
}

async function FunnelWrapper({ tenantId, range }: { tenantId?: string | null; range?: string }) {
  const data = await getFunnelStats({ tenantId, range });
  return <FunnelChart data={data} />;
}

async function RevenueWrapper({ tenantId, range }: { tenantId?: string | null; range?: string }) {
  const data = await getRevenueChartData({ tenantId, range });
  return <RevenueChart data={data} />;
}

async function TopAgentsWrapper({
  tenantId,
  role,
  multiTenantEnabled,
  branchId,
  teamId,
  range,
}: {
  tenantId?: string | null;
  role?: string;
  multiTenantEnabled?: boolean;
  branchId?: string;
  teamId?: string;
  range?: string;
}) {
  const data = await getTopAgents({ 
    tenantId: branchId || tenantId, 
    teamId,
    range 
  });
  return (
    <TopAgents
      data={data}
      role={role}
      multiTenantEnabled={multiTenantEnabled}
      range={range}
    />
  );
}

async function AgentTasksWrapper({ userId }: { userId?: string }) {
  const tasks = await getAgentTasks(userId);
  return <AgentTaskBoard tasks={tasks} />;
}

async function MarketingROIWrapper({
  tenantId,
  branchId,
  teamId,
  range,
  view,
  agentId,
}: {
  tenantId?: string | null;
  branchId?: string;
  teamId?: string;
  range?: string;
  view?: string;
  agentId?: string | null;
}) {
  const data = await getMarketingPerformanceData({
    tenantId: branchId || tenantId,
    teamId,
    range,
    view,
    agentId,
  });
  return <MarketingROISummary data={data} />;
}
