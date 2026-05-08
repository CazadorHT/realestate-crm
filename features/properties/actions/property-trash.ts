"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";

/**
 * Soft delete a property by setting deleted_at to now
 * Hardened: Enforces tenant isolation and revenue status protection
 */
export async function softDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    if (!tenantId)
      return { success: false, error: "ไม่พบข้อมูล Tenant ID ของคุณ" };
    // 🛡️ SECURITY LOCK 1: Always check within tenant boundary
    const { data: prop, error: fetchErr } = await supabase
      .from("properties")
      .select("status, tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !prop)
      return {
        success: false,
        error: "ไม่พบข้อมูลทรัพย์สินในเขตพื้นที่ของคุณ",
      };

    // 💰 REVENUE PROTECTION: SOLD/RENTED objects are protected
    const isRevenueAsset = ["SOLD", "RENTED"].includes(prop.status || "");
    const canBypass = role === "ADMIN" || role === "MANAGER";

    if (isRevenueAsset && !canBypass) {
      return {
        success: false,
        error:
          "สิทธิ์ไม่เพียงพอ: ทรัพย์สินที่ปิดการขายแล้วต้องให้ระดับ Manager หรือ Admin เป็นผู้ดำเนินการ",
      };
    }

    // 🛡️ SECURITY LOCK 2: Update with strict tenant isolation
    const { error } = await supabase
      .from("properties")
      .update({ 
        deleted_at: new Date().toISOString(),
        status: "ARCHIVED" as any 
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Error soft deleting property:", error);
      return { success: false, error: mapDbError(error) };
    }

    // 📝 Log Audit
    await logAudit(ctx, {
      action: "property.trash",
      entity: "properties",
      entityId: id,
      metadata: { status: prop.status },
    });

    revalidatePath("/protected/properties");
    revalidatePath("/");
    revalidateTag("properties", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Restore a property from trash
 */
export async function restoreProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId } = ctx;
    if (!tenantId) return { success: false, error: "ไม่พบข้อมูล Tenant ID" };
    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: mapDbError(error) };

    await logAudit(ctx, {
      action: "property.restore",
      entity: "properties",
      entityId: id,
    });
    revalidatePath("/protected/properties");
    revalidatePath("/");
    revalidateTag("properties", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Permanently delete a property from the database
 * Hardened: Prevents deletion of revenue records by non-admins
 */
export async function permanentDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    if (!tenantId) return { success: false, error: "ไม่พบข้อมูล Tenant ID" };
    const { data: prop, error: fetchErr } = await supabase
      .from("properties")
      .select("status, tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !prop)
      return { success: false, error: "ไม่พบข้อมูลทรัพย์สิน" };

    const isRevenueAsset = ["SOLD", "RENTED"].includes(prop.status || "");
    if (isRevenueAsset && role !== "ADMIN") {
      return {
        success: false,
        error:
          "สิทธิ์ไม่เพียงพอ: ข้อมูลรายการขาย/เช่าสำเร็จ ห้ามลบออกจากฐานข้อมูลถาวร (ให้ใช้สิทธิ์ Admin เท่านั้น)",
      };
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: mapDbError(error) };

    await logAudit(ctx, {
      action: "property.permanent_delete",
      entity: "properties",
      entityId: id,
    });
    revalidatePath("/protected/properties/trash");
    revalidateTag("properties", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}
