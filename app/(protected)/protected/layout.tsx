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
import { getAiReviewCountQuery } from "@/features/properties/queries/stats";

import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

import { TenantSwitcher } from "@/components/common/TenantSwitcher";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { ProcessProvider } from "@/components/providers/ProcessProvider";
import { ProcessMonitor } from "@/components/common/ProcessMonitor";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();

    // 1. First, get the profile to verify identity and role
    const profile = await getCurrentProfile();

    if (!profile) {
      return redirect("/auth/login");
    }

    // 2. Critical: Check staff access BEFORE running any other queries
    // This prevents the "Error Digest" crash when unauthorized users access the page
    if (!isStaff(profile.role) || !profile.is_active) {
      return redirect("/auth/pending");
    }

    // 3. Parallel Fetching: Now safe to run staff-only queries (0-bytes payload egress via head query)
    const [aiReviewCount, cookieStore] = await Promise.all([
      getAiReviewCountQuery(),
      cookies(),
    ]);

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
              aiReviewCount={aiReviewCount}
            />

          <div className="flex flex-1 flex-col min-w-0">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-1 sm:gap-4 bg-white px-4 md:px-6 backdrop-blur-md border-b border-slate-100 shadow-sm">
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

            <main className="flex-1 p-4 sm:p-6 md:p-8 mx-auto w-full">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <ProcessMonitor />
          </div>
          </div>
          </ProcessProvider>
        </RealtimeProvider>
      </TenantProvider>
    );
  } catch (error: any) {
    // Re-throw Next.js internal errors (redirect, notFound) so they work properly
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.digest?.startsWith('NEXT_NOT_FOUND')) {
      throw error;
    }
    console.error("[protected/layout] Server render failed", error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg w-full rounded-3xl border border-red-100 bg-white p-6 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">ระบบส่วนหลังบ้านขัดข้องชั่วคราว</h1>
          <p className="mt-2 text-sm text-slate-500">
            เราพบข้อผิดพลาดระหว่างเตรียมหน้า protected และได้หยุดการ render ไว้อย่างปลอดภัยแล้ว
          </p>
        </div>
      </div>
    );
  }
}
