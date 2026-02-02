import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isStaff } from "@/lib/auth-shared";
import { UserNav } from "@/components/dashboard/UserNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // ดึงข้อมูล Profile (ชื่อ, รูป, Role) จาก Server-side เพื่อส่งให้ Client Component แสดงผล
  const profile = await getCurrentProfile();

  if (!profile) {
    return redirect("/auth/login");
  }
  if (!isStaff(profile.role)) {
    return redirect("/auth/error?error=forbidden");
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-slate-950">
      <SidebarNav role={profile.role} />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-white/80 dark:bg-slate-900/80 px-6 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-slate-900/60">
          <div className="flex items-center gap-4">
            <MobileNav role={profile.role} />

            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight sm:hidden">
              CAZADOR
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block" />
            <UserNav profile={profile} />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
