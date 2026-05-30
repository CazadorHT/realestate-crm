"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function renewPropertyAction(id: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // Fetch the property to check ownership/permission
    const { data: property, error: fetchErr } = await supabase
      .from("properties_core")
      .select("created_by, assigned_to")
      .eq("id", id)
      .single();

    if (fetchErr || !property) throw new Error("ไม่พบข้อมูลทรัพย์");

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    const isOwner = property.created_by === user.id || property.assigned_to === user.id;

    if (!isOwner && !canBypassOwnership) {
      throw new Error("คุณไม่มีสิทธิ์ดันประกาศทรัพย์สินของผู้อื่น");
    }

    const { error } = await supabase
      .from("properties_core")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: id,
        metadata: { field: "updated_at", type: "renewal" },
      }
    );

    revalidatePath("/protected/properties");
    return { success: true };
  } catch (error) {
    console.error("Renew property error:", error);
    return { success: false, message: "Failed to renew property" };
  }
}
