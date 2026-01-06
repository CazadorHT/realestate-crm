"use server";

import { requireAuthContext, assertAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";

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
  newRole: "USER" | "AGENT" | "ADMIN"
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

// Optional: Delete user (profile only, or full auth user?
// Deleting from 'profiles' is usually enough if cascade is set,
// but typically we want to delete from auth.users via service_role client.
// For now, let's stick to role management as requested.)
