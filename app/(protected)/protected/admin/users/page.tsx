import { getAdminUsersAction } from "@/features/admin/actions";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { UserStats } from "@/features/admin/components/UserStats";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

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
        <TableFooterStats
          totalCount={totalUsers}
          unitLabel="ผู้ใช้"
          secondaryStats={[
            ...(admins > 0
              ? [
                  {
                    label: "Admin",
                    value: admins,
                    color: "red" as const,
                  },
                ]
              : []),
            ...(agents > 0
              ? [
                  {
                    label: "Agent",
                    value: agents,
                    color: "blue" as const,
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
