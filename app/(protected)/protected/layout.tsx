import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isStaff } from "@/lib/auth-shared";
import { UserNav } from "@/components/dashboard/UserNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { siteConfig } from "@/lib/site-config";
import { getPropertiesDashboardStatsQuery } from "@/features/properties/queries/stats";

import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

import { SocialPostMonitor } from "@/components/properties/SocialPostMonitor";
import { TenantSwitcher } from "@/components/common/TenantSwitcher";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { ProcessProvider } from "@/components/providers/ProcessProvider";
import { ProcessMonitor } from "@/components/common/ProcessMonitor";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // [PERFORMANCE] Parallel Fetching: Core Profile & Sidebar Stats
  const [profile, propertyStats, cookieStore] = await Promise.all([
    getCurrentProfile(),
    getPropertiesDashboardStatsQuery(),
    cookies(),
  ]);

  if (!profile) {
    return redirect("/auth/login");
  }
  if (!isStaff(profile.role)) {
    return redirect("/auth/pending");
  }

  // Note: Notifications are fetched client-side inside NotificationBell

  // อ่านสถานะ Sidebar จาก Cookie (เพื่อให้ตอน Refresh หน้าเว็บ ไม่เกิดอาการกางแล้วหุบ)
  const initialCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return (
    <TenantProvider>
      <RealtimeProvider>
        <ProcessProvider>
          <div className="flex min-h-screen w-full bg-slate-50/50">
          <SidebarNav 
            role={profile.role} 
            initialCollapsed={initialCollapsed} 
            aiReviewCount={propertyStats.aiReviewCount}
          />

          <div className="flex flex-1 flex-col min-w-0">
            <header className="sticky top-0 z-50 flex h-16 items-center gap-1 sm:gap-4 bg-white px-4 md:px-6 backdrop-blur-md border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-4">
                <MobileNav role={profile.role} profile={profile} />

                <h1 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight sm:hidden truncate max-w-[40px] min-[360px]:max-w-[70px] min-[400px]:max-w-[120px] uppercase">
                  {siteConfig.name}
                </h1>
              </div>
              <div className="flex flex-1 items-center justify-end gap-1 sm:gap-3 shrink-0">
                <GlobalSearch />
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                  <TenantSwitcher />
                  <NotificationBell />
                </div>
                <div className="h-6 w-px bg-slate-200 mx-0.5 hidden md:block shrink-0" />
                <div className="shrink-0">
                  <UserNav profile={profile} />
                </div>
              </div>
            </header>

            <main className="flex-1 p-6 md:p-8 mx-auto w-full">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <SocialPostMonitor />
            <ProcessMonitor />
          </div>
        </div>
        </ProcessProvider>
      </RealtimeProvider>
    </TenantProvider>
  );
}
