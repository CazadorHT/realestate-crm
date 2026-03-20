"use server";

import { revalidatePath } from "next/cache";
import {
  requireAuthContext,
  assertAdmin,
  authzFail,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getSystemConfig } from "@/lib/actions/system-config";
import { mapDbError } from "@/lib/db-error";

/**
 * ดึงรายชื่อ tenants (branches) ทั้งหมด — Admin only
 */
export async function getTenantsAction() {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { data, error } = await ctx.supabase
    .from("tenants")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }

  return data ?? [];
}

/**
 * ย้าย Property ไป branch อื่น — Admin only
 */
export async function transferPropertyBranchAction(
  propertyId: string,
  targetTenantId: string,
) {
  try {
    const ctx = await requireAuthContext();
    assertAdmin(ctx.role);

    const config = await getSystemConfig();
    if (!config.multi_tenant_enabled) {
      return { success: false, message: "Multi-branch is not enabled" };
    }

    // Verify target tenant exists
    const { data: tenant, error: tenantError } = await ctx.supabase
      .from("tenants")
      .select("id, name")
      .eq("id", targetTenantId)
      .single();

    if (tenantError || !tenant) {
      return { success: false, message: "ไม่พบสาขาปลายทาง" };
    }

    // Get current property info for audit
    const { data: property, error: propError } = await ctx.supabase
      .from("properties")
      .select("id, title, tenant_id")
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบทรัพย์สินที่ต้องการย้าย" };
    }

    const fromTenantId = property.tenant_id;

    // Update tenant_id
    const { error } = await ctx.supabase
      .from("properties")
      .update({
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId);

    if (error) return { success: false, message: mapDbError(error) };

    await logAudit(ctx, {
      action: "property.transfer_branch",
      entity: "properties",
      entityId: propertyId,
      metadata: {
        from_tenant_id: fromTenantId,
        to_tenant_id: targetTenantId,
        to_tenant_name: tenant.name,
      },
    });

    revalidatePath("/protected/properties");
    return {
      success: true,
      message: `ย้ายทรัพย์สินไปสาขา "${tenant.name}" เรียบร้อยแล้ว`,
    };
  } catch (err) {
    return authzFail(err);
  }
}

/**
 * ย้าย Owner ไป branch อื่น — Admin only
 */
export async function transferOwnerBranchAction(
  ownerId: string,
  targetTenantId: string,
) {
  try {
    const ctx = await requireAuthContext();
    assertAdmin(ctx.role);

    const config = await getSystemConfig();
    if (!config.multi_tenant_enabled) {
      return { success: false, message: "Multi-branch is not enabled" };
    }

    // Verify target tenant exists
    const { data: tenant, error: tenantError } = await ctx.supabase
      .from("tenants")
      .select("id, name")
      .eq("id", targetTenantId)
      .single();

    if (tenantError || !tenant) {
      return { success: false, message: "ไม่พบสาขาปลายทาง" };
    }

    // Get current owner for audit
    const { data: owner, error: ownerError } = await ctx.supabase
      .from("owners")
      .select("id, full_name, tenant_id")
      .eq("id", ownerId)
      .single();

    if (ownerError || !owner) {
      return { success: false, message: "ไม่พบเจ้าของทรัพย์ที่ต้องการย้าย" };
    }

    const fromTenantId = owner.tenant_id;

    // Update tenant_id
    const { error } = await ctx.supabase
      .from("owners")
      .update({
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (error) return { success: false, message: mapDbError(error) };

    await logAudit(ctx, {
      action: "owner.transfer_branch",
      entity: "owners",
      entityId: ownerId,
      metadata: {
        from_tenant_id: fromTenantId,
        to_tenant_id: targetTenantId,
        to_tenant_name: tenant.name,
      },
    });

    revalidatePath("/protected/owners");
    revalidatePath("/protected/properties");
    return {
      success: true,
      message: `ย้ายเจ้าของทรัพย์ไปสาขา "${tenant.name}" เรียบร้อยแล้ว`,
    };
  } catch (err) {
    return authzFail(err);
  }
}
