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
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <UsersPageHeader />

      {/* Statistics Summary */}
      <UsersStatsSummary
        totalUsers={totalUsers}
        totalAdmins={totalAdmins}
        totalAgents={totalAgents}
        totalUsersWaiting={totalUsersWaiting}
      />

      {/* Table Section with title */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-4 w-1 bg-blue-600 rounded-full" />
          <h2 className="text-lg font-bold text-slate-800">
            รายชื่อสมาชิกทีมทั้งหมด
          </h2>
        </div>
        <UsersTable users={users || []} currentUserId={user.id} />
      </div>
    </div>
  );
}
