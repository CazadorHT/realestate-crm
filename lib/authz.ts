import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

import { type UserRole, isAdmin, isStaff } from "./auth-shared";
import { cookies } from "next/headers";
import { mapDbError } from "./db-error";
export { type UserRole, isAdmin, isStaff };

export type AuthContext = {
  supabase: SupabaseClient<Database>;
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
): Promise<UserRole | null> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.role) return null;
  return data.role as UserRole;
}

export async function getAuthContextOrNull(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  // 🛡️ Zombie Session Protection: Verify user exists and JWT is still valid
  if (error || !data?.user) return null;

  const role = await getRole(supabase, data.user.id);
  if (!role) return null; // 🛡️ Mission Critical: No profile = No access

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

  // Rule 2: If multi-tenant is enabled, use requested or default to cookie
  let finalTenantId = requestedTenantId;

  // 2.1 If no explicit tenant requested, look at the cookie
  if (!finalTenantId) {
    const cookieStore = await cookies();
    const cookieTenantId = cookieStore.get("active_tenant_id")?.value;
    
    // If cookie is "ALL", we explicitly want cross-branch (tenantId: undefined)
    if (cookieTenantId === "ALL") {
      return ctx; // Return with undefined tenantId
    }

    if (cookieTenantId) {
      finalTenantId = cookieTenantId;
    }
  }

  // 2.2 If we have a tenant ID (from param or cookie), verify membership
  if (finalTenantId) {
    const { data: member, error } = await ctx.supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", finalTenantId)
      .eq("profile_id", ctx.user.id)
      .single();

    if (error || !member) {
      // Fallback: If they requested a branch they don't belong to (or it's stale), 
      // we'll proceed to the default "first available" logic below
      finalTenantId = undefined;
    } else {
      return { ...ctx, tenantId: finalTenantId };
    }
  }

  // Rule 3: If still no tenant (or switch failed), pick the first one from their membership
  const { data: firstMember } = await ctx.supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("profile_id", ctx.user.id)
    .limit(1)
    .maybeSingle();

  if (firstMember) {
    return { ...ctx, tenantId: firstMember.tenant_id };
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

/**
 * 🛡️ Branch Admin: ตรวจสอบสิทธิ์ผู้จัดการสาขา
 * สามารถเห็นและจัดการข้อมูลภายในสาขาที่ตนเองสังกัดเท่านั้น
 */
export function assertAdmin(role: UserRole) {
  if (!isAdmin(role)) {
    throw new AuthzError("FORBIDDEN", "Forbidden: Admin access only");
  }
}

/**
 * 👑 Platform SuperAdmin: ตรวจสอบสิทธิ์ผู้ดูแลระบบสูงสุด
 * มีสิทธิ์เข้าถึงข้อมูลข้ามสาขา และจัดการค่า Global ของทั้งระบบ (FAQ, Partners)
 */
export function assertSystemAdmin(role: UserRole) {
  if (role !== "ADMIN") {
    throw new AuthzError("FORBIDDEN", "สิทธิ์เฉพาะผู้ดูแลระบบส่วนกลางเท่านั้น");
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
    if (err.code === "UNAUTHORIZED") return { success: false, message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
    if (err.code === "FORBIDDEN") return { success: false, message: "คุณไม่มีสิทธิ์ดำเนินการในส่วนนี้" };
    return { success: false, message: err.message };
  }
  return { success: false, message: mapDbError(err) };
}
