// lib/authz.ts
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

import { type UserRole, isAdmin, isStaff } from "./auth-shared";
export { type UserRole, isAdmin, isStaff };

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  role: UserRole;
  tenantId?: string;
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

/**
 * ดึง role จากตาราง profiles เท่านั้น (ห้ามเดาจาก metadata เพื่อไม่เผลอยกระดับสิทธิ)
 * ถ้าไม่พบ profile ให้ fallback เป็น AGENT (never elevate).
 */
async function getRole(
  supabase: AuthContext["supabase"],
  userId: string,
): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data?.role ?? "USER") as UserRole;
}

export async function getAuthContextOrNull(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const role = await getRole(supabase, data.user.id);
  return { supabase, user: data.user, role };
}

import { getSystemConfig } from "@/lib/actions/system-config";

export async function requireAuthContext(
  requestedTenantId?: string,
): Promise<AuthContext> {
  const ctx = await getAuthContextOrNull();
  if (!ctx) throw new AuthzError("UNAUTHORIZED", "Unauthorized");

  // Get global system config
  const config = await getSystemConfig();

  // Rule 1: If multi-tenant is disabled, always use default tenant
  if (!config.multi_tenant_enabled) {
    return { ...ctx, tenantId: config.default_tenant_id ?? undefined };
  }

  // Rule 2: If multi-tenant is enabled, use requested or throw if missing members
  const finalTenantId = requestedTenantId;

  if (finalTenantId) {
    const { data: member, error } = await ctx.supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", finalTenantId)
      .eq("profile_id", ctx.user.id)
      .single();

    if (error || !member) {
      throw new AuthzError(
        "FORBIDDEN",
        "Forbidden: You are not a member of this tenant",
      );
    }

    return { ...ctx, tenantId: finalTenantId };
  }

  return ctx;
}

/**
 * ใช้กับ resource ที่มีฟิลด์ created_by / owner_id (เช่น properties/leads)
 */

export function assertAuthenticated(input: { userId: string; role: UserRole }) {
  if (!input.userId) {
    throw new AuthzError("UNAUTHORIZED", "Unauthorized");
  }
}
// ตรวจสอบว่า userId ตรงกับ resource ownerId หรือไม่
export function assertStaff(role: UserRole) {
  if (!isStaff(role)) {
    throw new AuthzError("FORBIDDEN", "Forbidden: Staff access only");
  }
}

export function assertAdmin(role: UserRole) {
  if (!isAdmin(role)) {
    throw new AuthzError("FORBIDDEN", "Forbidden: Admin access only");
  }
}

export function assertAdminOrManager(role: UserRole) {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new AuthzError(
      "FORBIDDEN",
      "Forbidden: Admin or Manager access only",
    );
  }
}

/**
 * Helper สำหรับ server actions ที่ต้อง return รูปแบบ { success:false, message }
 */
export function authzFail(err: unknown): { success: false; message: string } {
  if (err instanceof AuthzError) {
    return { success: false, message: err.message };
  }
  if (err instanceof Error) {
    return { success: false, message: err.message };
  }
  return { success: false, message: "An unknown error occurred" };
}
