// lib/authz.ts
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  role: UserRole;
};

export class AuthzError extends Error {
  constructor(
    public code: "UNAUTHORIZED" | "FORBIDDEN",
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AuthzError";
  }
}

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

/**
 * ดึง role จากตาราง profiles เท่านั้น (ห้ามเดาจาก metadata เพื่อไม่เผลอยกระดับสิทธิ)
 * ถ้าไม่พบ profile ให้ fallback เป็น AGENT (never elevate).
 */
async function getRole(supabase: AuthContext["supabase"], userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data?.role ?? "AGENT") as UserRole;
}

export async function getAuthContextOrNull(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const role = await getRole(supabase, data.user.id);
  return { supabase, user: data.user, role };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContextOrNull();
  if (!ctx) throw new AuthzError("UNAUTHORIZED", "Unauthorized");
  return ctx;
}

/**
 * ใช้กับ resource ที่มีฟิลด์ created_by / owner_id (เช่น properties/leads)
 */


export function assertAuthenticated(input: {
  userId: string;
  role: UserRole;
}) {
  if (!input.userId) {
    throw new AuthzError("UNAUTHORIZED", "Unauthorized");
  }
  // role จะเป็น ADMIN/AGENT ก็ผ่านหมด
}

/**
 * Helper สำหรับ server actions ที่ต้อง return รูปแบบ { success:false, message }
 */
export function authzFail(err: unknown): { success: false; message: string } {
  if (err instanceof AuthzError) {
    return { success: false, message: err.message };
  }
  return { success: false, message: "Unexpected error GG" };
}
