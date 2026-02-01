import { getAdminUsersAction } from "@/features/admin/actions";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { UserStats } from "@/features/admin/components/UserStats";

export default async function AdminUsersPage() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const users = await getAdminUsersAction();

  // Calculate statistics
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const agents = users.filter((u) => u.role === "AGENT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            จัดการผู้ใช้ระบบ
          </h1>
          <p className="text-slate-500 mt-2">
            จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <UserStats users={users} />

      {/* Users Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <UsersTable initialUsers={users} />
      </div>

      {/* Footer Stats */}
      {users.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalUsers} ผู้ใช้</span>
            {admins > 0 && (
              <span className="text-red-600 font-medium">{admins} Admin</span>
            )}
            {agents > 0 && (
              <span className="text-blue-600 font-medium">{agents} Agent</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
