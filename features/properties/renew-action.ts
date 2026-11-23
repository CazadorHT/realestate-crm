"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

    const bumpIso = new Date().toISOString();

    // 1. Fetch current meta_data from properties_details and slug from properties_core
    const [{ data: detailsData }, { data: coreData }] = await Promise.all([
      supabase
        .from("properties_details")
        .select("meta_data")
        .eq("property_id", id)
        .maybeSingle(),
      supabase
        .from("properties_core")
        .select("slug")
        .eq("id", id)
        .maybeSingle(),
    ]);

    const currentMeta = (detailsData?.meta_data as Record<string, unknown>) || {};
    const updatedMeta = {
      ...currentMeta,
      bumped_at: bumpIso,
    };

    // 2. Update properties_core.display_order_at (dedicated sort timestamp — editing other fields won't bump!)
    //    and keep properties_details.meta_data.bumped_at synced for backwards compatibility.
    const [coreRes, detailsRes] = await Promise.all([
      (supabase as any)
        .from("properties_core")
        .update({ display_order_at: bumpIso, updated_at: bumpIso })
        .eq("id", id),
      supabase
        .from("properties_details")
        .update({ meta_data: updatedMeta })
        .eq("property_id", id),
    ]);

    // Graceful fallback if display_order_at column migration hasn't been applied yet
    if (coreRes.error && (coreRes.error.code === "42703" || coreRes.error.code === "PGRST204")) {
      const fallbackCore = await supabase
        .from("properties_core")
        .update({ updated_at: bumpIso })
        .eq("id", id);
      if (fallbackCore.error) throw fallbackCore.error;
    } else if (coreRes.error) {
      throw coreRes.error;
    }
    if (detailsRes.error) throw detailsRes.error;

    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: id,
        metadata: { field: "bumped_at", type: "renewal", timestamp: bumpIso },
      }
    );

    revalidatePath("/protected/properties");
    const { revalidatePropertyPublicCache } = await import("./actions/revalidate-property-cache");
    await revalidatePropertyPublicCache({ slug: coreData?.slug });
    return { success: true };
  } catch (error) {
    console.error("Renew property error:", error);
    return { success: false, message: "Failed to renew property" };
  }
}
