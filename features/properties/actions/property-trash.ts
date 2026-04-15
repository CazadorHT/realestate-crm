"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

/**
 * Soft delete a property by setting deleted_at to now
 */
export async function softDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;
    
    // 🛡️ Admin can delete any, Staff can only delete from their branch
    if (role !== "ADMIN" && !tenantId) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error soft deleting property:", error);
      return { success: false, error: error.message };
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
  } catch (err) {
    console.error("Unexpected error in softDeleteProperty:", err);
    return { success: false, error: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}

/**
 * Restore a property from trash by setting deleted_at to null
 */
export async function restoreProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId } = ctx;

    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Error restoring property:", error);
      return { success: false, error: error.message };
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
  } catch (err) {
    console.error("Unexpected error in restoreProperty:", err);
    return { success: false, error: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}

/**
 * Permanently delete a property from the database
 */
export async function permanentDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase } = ctx;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("Error permanently deleting property:", error);
      return { success: false, error: error.message };
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
  } catch (err) {
    console.error("Unexpected error in permanentDeleteProperty:", err);
    return { success: false, error: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
