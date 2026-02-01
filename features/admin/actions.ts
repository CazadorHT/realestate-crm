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
  const { supabase, role } = await requireAuthContext();
  assertAdmin(role);

  // Fetch profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminUserRow[];
}

export async function updateUserRoleAction(
  userId: string,
  newRole: "USER" | "AGENT" | "ADMIN",
) {
  const { supabase, role, user } = await requireAuthContext();
  assertAdmin(role);

  // Prevent self-demotion if desired, or allow it with warning.
  // Let's prevent removing the LAST admin? That's complex logic.
  // For now just allow update.

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
