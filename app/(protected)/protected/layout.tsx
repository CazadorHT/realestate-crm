import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { isStaff } from "@/lib/auth-shared";
import { UserNav } from "@/components/dashboard/UserNav";

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
    <div className="flex min-h-screen w-full flex-col bg-bg text-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/10 bg-surface/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu could go here */}
          <h1 className="text-xl font-bold leading-none tracking-tight text-primary">
            CRM Dashboard
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <UserNav profile={profile} />
        </div>
      </header>
      <div className="flex flex-1">
        <SidebarNav role={profile.role} />
        <main className="flex-1 bg-bg p-4 sm:px-6 sm:py-6 md:gap-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
