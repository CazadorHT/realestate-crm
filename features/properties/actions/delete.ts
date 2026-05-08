"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  isAdmin,
  authzFail,
  AuthzError
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { PROPERTY_IMAGES_BUCKET } from "../logic/images";
import { mapDbError } from "@/lib/db-error";

/**
 * Delete property and cleanup storage
 * ใช้กับ server action ที่รับ FormData จากฟอร์มลบทรัพย์
 * ลบได้เฉพาะเจ้าของทรัพย์หรือแอดมินเท่านั้น
 */
export async function deletePropertyAction(formData: FormData) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const id = formData.get("id") as string | null;
    if (!id) throw new Error("Missing property id");

    // 0) โหลดเจ้าของทรัพย์เพื่อเช็คสิทธิ (owner/admin)
    const { data: property, error: propErr } = await supabase
      .from("properties")
      .select("id, created_by, tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (propErr || !property) throw new Error("Property not found");

    // 0.1) Authorization: Only Owner or Admin can delete
    if (property.created_by !== user.id && !isAdmin(role)) {
      throw new Error("Forbidden: You can only delete your own properties");
    }

    assertAuthenticated({ userId: user.id, role });

    // 0.2) Check for dependencies that block deletion (like active Deals)
    const { count: dealCount, error: dealErr } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id);

    if (dealCount && dealCount > 0) {
      throw new Error(
        "ไม่สามารถลบทรัพย์ที่มีการทำ Deal ไปแล้วได้ (กรุณาใช้การ Archive แทน)",
      );
    }

    // 1) Get image paths first (to use for cleanup later)
    const { data: images } = await supabase
      .from("property_images")
      .select("storage_path")
      .eq("property_id", id);

    // 2) Manual Cleanup of Dependencies (Fix for Foreign Key Constraint 23503)
    // 2.1 Unlink Leads (don't delete leads, just remove association)
    await supabase
      .from("leads")
      .update({ property_id: null })
      .eq("property_id", id)
      .eq("tenant_id", tenantId);

    // 2.2 Delete Sub-tables
    await supabase.from("property_features").delete().eq("property_id", id);
    await supabase.from("property_agents").delete().eq("property_id", id);
    await supabase.from("property_matches").delete().eq("property_id", id);
    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("property_id", id);

    // Explicitly delete property_images rows (DB)
    await supabase.from("property_images").delete().eq("property_id", id);

    // 3) Delete main property record
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "ลบไม่สำเร็จ: ข้อมูลมีการใช้งานอยู่ในส่วนอื่น (กรุณาแจ้ง Admin หรือลอง Archive แทน)",
        );
      }
      throw error;
    }

    // 4) 🛡️ [ZERO-ADMIN] ATOMIC CLEANUP: Delete from storage in background
    if (images && images.length > 0) {
      const pathsToRemove = images
        .map((img) => img.storage_path)
        .filter((path): path is string => !!path);

      if (pathsToRemove.length > 0) {
        const { inngest } = await import("@/lib/inngest/client");
        await inngest.send({
          name: "storage.cleanup.requested",
          data: {
            bucket: PROPERTY_IMAGES_BUCKET,
            paths: pathsToRemove
          }
        });
      }
    }

    // 5) Audit log delete
    await logAudit(
      { supabase, user, role },
      {
        action: "property.delete",
        entity: "properties",
        entityId: id,
        metadata: {
          // ใส่ได้ตามต้องการ เช่นจำนวนรูปที่ลบจริง (ถ้าคำนวณไว้)
        },
      },
    );

    // Clean up TEMP uploads (legacy logic, keep it)
    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("status", "TEMP");

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true, message: "ลบทรัพย์สำเร็จ" };
  } catch (error: unknown) {
    console.error("deletePropertyAction → error:", error);
    if (error instanceof AuthzError) {
      return authzFail(error);
    }
    return { success: false, message: mapDbError(error) };
  }
}
