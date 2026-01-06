import { getAdminUsersAction } from "@/features/admin/actions";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { requireAuthContext, assertAdmin } from "@/lib/authz";

export default async function AdminUsersPage() {
  // Server-side check
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const users = await getAdminUsersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage system users and their roles.
        </p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
