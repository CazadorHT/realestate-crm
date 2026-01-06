"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function renewPropertyAction(id: string) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("properties")
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
