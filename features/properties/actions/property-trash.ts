"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";

/**
 * Soft delete a property by setting deleted_at to now
 */
export async function softDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    
    // 💰 REVENUE PROTECTION: Check status before trashing
    const { data: prop, error: fetchErr } = await supabase
      .from("properties")
      .select("status, tenant_id")
      .eq("id", id)
      .single();

    if (fetchErr || !prop) return { success: false, error: "ไม่พบข้อมูลทรัพย์สิน" };

    const isRevenueAsset = ["SOLD", "RENTED"].includes(prop.status || "");
    if (isRevenueAsset && role !== "ADMIN") {
      return { 
        success: false, 
        error: "สิทธิ์ไม่เพียงพอ: ทรัพย์สินที่มีสถานะ 'ขายแล้ว' หรือ 'เช่าแล้ว' ต้องให้ผู้ดูแลระบบสูงสุดเป็นผู้ดำเนินการลบเท่านั้น" 
      };
    }

    let query = supabase
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
      
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    
    const { error } = await query;

    if (error) {
      console.error("Error soft deleting property:", error);
      return { success: false, error: mapDbError(error) };
    }

    // 📝 Log Audit
    await logAudit(ctx, {
      action: "property.trash",
      entity: "properties",
      entityId: id,
      metadata: { timestamp: new Date().toISOString() }
    });

    revalidatePath("/properties"); 
    revalidatePath("/protected"); 
    revalidatePath("/protected/properties"); 
    revalidatePath("/protected/properties/trash");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in softDeleteProperty:", err);
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Restore a property from trash by setting deleted_at to null
 */
export async function restoreProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId } = ctx;

    let query = supabase
      .from("properties")
      .update({ deleted_at: null })
      .eq("id", id);
      
    const { role } = ctx;
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error restoring property:", error);
      return { success: false, error: mapDbError(error) };
    }

    // 📝 Log Audit
    await logAudit(ctx, {
      action: "property.restore",
      entity: "properties",
      entityId: id
    });

    revalidatePath("/properties");
    revalidatePath("/protected");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in restoreProperty:", err);
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Permanently delete a property from the database
 */
export async function permanentDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;

    // 💰 REVENUE PROTECTION: Check status before permanent delete
    const { data: prop, error: fetchErr } = await supabase
      .from("properties")
      .select("status, tenant_id")
      .eq("id", id)
      .single();

    if (fetchErr || !prop) return { success: false, error: "ไม่พบข้อมูลทรัพย์สิน" };

    const isRevenueAsset = ["SOLD", "RENTED"].includes(prop.status || "");
    if (isRevenueAsset && role !== "ADMIN") {
      return { 
        success: false, 
        error: "สิทธิ์ไม่เพียงพอ: ไม่สามารถลบข้อมูลทรัพย์สินที่เป็น 'รายการขาย/เช่าสำเร็จ' ออกจากฐานข้อมูลได้ (ต้องใช้สิทธิ์ SuperAdmin)" 
      };
    }

    let query = supabase.from("properties").delete().eq("id", id);
    
    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error permanently deleting property:", error);
      return { success: false, error: mapDbError(error) };
    }

    // 📝 Log Audit
    await logAudit(ctx, {
      action: "property.permanent_delete",
      entity: "properties",
      entityId: id
    });

    revalidatePath("/properties");
    revalidatePath("/protected");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in permanentDeleteProperty:", err);
    return { success: false, error: mapDbError(err) };
  }
}
