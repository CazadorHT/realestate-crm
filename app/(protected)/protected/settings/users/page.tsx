import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { calculateUsersStats, type EliteUser } from "@/lib/users-utils";
import { getSystemConfig } from "@/lib/actions/system-config";
import { UsersPageView } from "@/features/users/UsersPageView";

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

  // ดึง Auth Provider จาก auth.users และข้อมูลตารางต่างๆ ผ่าน Admin API (service_role) เพื่อเลี่ยงปัญหา RLS
  const adminClient = createAdminClient();

  // ดึงข้อมูลผู้ใช้ทั้งหมด (ตาราง profiles ไม่มีคอลัมน์ team_id ใน V3)
  const { data: users, error: usersError } = await adminClient
    .from("profiles")
    .select(
      "id, full_name, email, avatar_url, phone, role, created_at",
    )
    .order("created_at", { ascending: false });

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
  const { data: teams } = await adminClient.from("teams").select("id, name");

  // ดึงข้อมูลการสังกัดสาขา (Tenant Memberships) และ team_id ทั้งหมด
  const { data: allMemberships } = await adminClient
    .from("tenant_members")
    .select("profile_id, team_id, tenant:tenants(id, name)");

  // ดึง Config ของระบบ
  const config = await getSystemConfig();

  // สร้าง Map: profileId → tenants[] และ profileId → team_id
  const membershipMap = new Map<string, { id: string; name: string }[]>();
  const teamMap = new Map<string, string | null>();

  for (const item of allMemberships || []) {
    if (item.profile_id) {
      const tenants = membershipMap.get(item.profile_id) || [];
      if (item.tenant) {
        tenants.push(item.tenant as { id: string; name: string });
      }
      membershipMap.set(item.profile_id, tenants);
      if (item.team_id) {
        teamMap.set(item.profile_id, item.team_id);
      }
    }
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
  const eliteUsers: EliteUser[] = (users || []).map((u: any) => ({
    ...u,
    team_id: teamMap.get(u.id) || null,
    auth_provider: providerMap.get(u.id) ?? "email",
    tenants: membershipMap.get(u.id) || [],
  })) as EliteUser[];

  // คำนวณสถิติผ่าน Utils (Centralized Engine)
  const stats = calculateUsersStats(eliteUsers);

  return (
    <UsersPageView
      eliteUsers={eliteUsers}
      currentUserId={user.id}
      teams={teams || []}
      isMultiTenant={config.multi_tenant_enabled}
      stats={stats}
    />
  );
}

