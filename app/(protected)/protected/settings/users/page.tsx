import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { UsersPageHeader } from "@/features/users/UsersPageHeader";
import { UsersStatsSummary } from "@/features/users/UsersStatsSummary";
import { UsersTable } from "@/features/users/UsersTable";
import { Separator } from "@/components/ui/separator";

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
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return (
      <div className="p-8 text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้
      </div>
    );
  }

  // คำนวณสถิติ
  const totalUsers = users?.length || 0;
  const totalAdmins = users?.filter((u) => u.role === "ADMIN").length || 0;
  const totalAgents = users?.filter((u) => u.role === "AGENT").length || 0;
  const totalUsersWaiting =
    users?.filter((u) => u.role === "USER" || !u.role).length || 0;

  return (
    <div className=" mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <UsersPageHeader />

      <Separator />

      {/* Statistics Summary */}
      <UsersStatsSummary
        totalUsers={totalUsers}
        totalAdmins={totalAdmins}
        totalAgents={totalAgents}
        totalUsersWaiting={totalUsersWaiting}
      />

      {/* Users Table */}
      <UsersTable users={users || []} currentUserId={user.id} />
    </div>
  );
}
