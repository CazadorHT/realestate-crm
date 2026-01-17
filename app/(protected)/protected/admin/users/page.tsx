import { getAdminUsersAction } from "@/features/admin/actions";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserCheck, Activity } from "lucide-react";

export default async function AdminUsersPage() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const users = await getAdminUsersAction();

  // Calculate statistics
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const agents = users.filter((u) => u.role === "AGENT").length;
  const customers = users.filter((u) => u.role === "USER").length;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{admins}</div>
            <p className="text-xs text-slate-500 mt-1">Administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอเจนต์</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{agents}</div>
            <p className="text-xs text-slate-500 mt-1">Agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้า</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customers}</div>
            <p className="text-xs text-slate-500 mt-1">Customers</p>
          </CardContent>
        </Card>
      </div>

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
