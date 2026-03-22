"use server";

import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { autoPurgeOldLogs } from "./queries";

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "USER" | "AGENT" | "ADMIN";
  created_at: string;
  last_sign_in_at?: string | null; // Note: simplified, might need to join auth.users if strict
};

export async function getAdminUsersAction() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertAdmin(role);

  // Fetch profiles
  let query = supabase
    .from("profiles")
    .select("*");

  if (tenantId && tenantId !== "ALL") {
    // Join tenant_members to filter by branch
    const { data: memberIds } = await supabase
      .from("tenant_members")
      .select("profile_id")
      .eq("tenant_id", tenantId);
    
    const ids = (memberIds || []).map(m => m.profile_id);
    query = query.in("id", ids);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminUserRow[];
}

export async function updateUserRoleAction(
  userId: string,
  newRole: "USER" | "AGENT" | "ADMIN",
) {
  const { supabase, role, user, tenantId } = await requireAuthContext();
  assertAdmin(role);

  // Security Check: Verify target user belongs to the same branch if not Super Admin
  if (tenantId && tenantId !== "ALL") {
    const { data: member } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("profile_id", userId)
      .eq("tenant_id", tenantId)
      .single();
    
    if (!member) throw new Error("Unauthorized: User belongs to a different branch");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/protected/admin/users");
  return { success: true };
}

export async function purgeOldLogsAction() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  await autoPurgeOldLogs();

  revalidatePath("/protected/admin/audit-logs");
  return {
    success: true,
    message: `ลบประวัติการใช้งานที่เก่ากว่า 30 วันสำเร็จเรียบร้อยแล้ว`,
  };
}
