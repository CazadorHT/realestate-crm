import { getAdminUsersAction } from "@/features/admin/actions";
import { AdminUsersPageView } from "@/features/admin/components/AdminUsersPageView";
import { requireAuthContext, assertAdmin } from "@/lib/authz";

export default async function AdminUsersPage() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const users = await getAdminUsersAction();

  return <AdminUsersPageView users={users} />;
}

