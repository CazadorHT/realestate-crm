import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { UsersPageHeader } from "@/features/users/UsersPageHeader";
import { UsersStatsSummary } from "@/features/users/UsersStatsSummary";
import { UsersTable } from "@/features/users/UsersTable";
import { Separator } from "@/components/ui/separator";
import { calculateUsersStats, type EliteUser } from "@/lib/users-utils";
import { getSystemConfig } from "@/lib/actions/system-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersManagementPage() {
  const supabase = await createClient();

  // ตรวจสอบ Authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/auth/login");
  }

  // ดึงข้อมูลโปรไฟล์เพื่อตรวจสอบ role
  const currentProfile = await getCurrentProfile();

  // Admin Only Access - ถ้าไม่ใช่ ADMIN ให้ redirect ออก
  if (currentProfile?.role !== "ADMIN") {
    return redirect("/protected");
  }

  // ดึงข้อมูลผู้ใช้ทั้งหมด
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, phone, role, created_at, team_id",
    )
    .order("created_at", { ascending: false });

  // ดึง Auth Provider จาก auth.users ผ่าน Admin API
  const adminClient = createAdminClient();
  const { data: authUsersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  // สร้าง Map: userId → provider
  const providerMap = new Map<string, string>();
  for (const authUser of authUsersData?.users ?? []) {
    const provider =
      authUser.app_metadata?.provider ??
      authUser.identities?.[0]?.provider ??
      "email";
    providerMap.set(authUser.id, provider);
  }

  // ดึงข้อมูลทีมทั้งหมด
  const { data: teams } = await supabase.from("teams").select("id, name");

  // ดึงข้อมูลการสังกัดสาขา (Tenant Memberships) ทั้งหมด
  const { data: allMemberships } = await supabase
    .from("tenant_members")
    .select("profile_id, tenant:tenants(id, name)");

  // ดึง Config ของระบบ
  const config = await getSystemConfig();

  // สร้าง Map: profileId → tenants[]
  const membershipMap = new Map<string, { id: string; name: string }[]>();
  for (const item of allMemberships || []) {
    const tenants = membershipMap.get(item.profile_id) || [];
    if (item.tenant) {
      tenants.push(item.tenant as { id: string; name: string });
    }
    membershipMap.set(item.profile_id, tenants);
  }

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return (
      <div className="p-8 text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้
      </div>
    );
  }

  // Transform to EliteUser type
  const eliteUsers: EliteUser[] = (users || []).map((u) => ({
    ...u,
    auth_provider: providerMap.get(u.id) ?? "email",
    tenants: membershipMap.get(u.id) || [],
  })) as EliteUser[];

  // คำนวณสถิติผ่าน Utils (Centralized Engine)
  const stats = calculateUsersStats(eliteUsers);

  return (
    <div className="relative min-h-[calc(100vh-12rem)] pb-20 overflow-visible">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Elite Header */}
        <UsersPageHeader />

        {/* Statistics Summary - Elite Glassmorphism */}
        <UsersStatsSummary
          totalUsers={stats.totalUsers}
          totalAdmins={stats.totalAdmins}
          totalAgents={stats.totalAgents}
          totalUsersWaiting={stats.totalUsersWaiting}
        />

        {/* Table Section with Elite title and Glass Table */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1.5 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                รายชื่อสมาชิกทีมทั้งหมด
              </h2>
            </div>
          </div>
          
          <UsersTable
            users={eliteUsers}
            currentUserId={user.id}
            teams={teams || []}
            isMultiTenant={config.multi_tenant_enabled}
          />
        </div>
      </div>
    </div>
  );
}
