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
import { purgeCloudflareCache } from "@/lib/cloudflare";
import { refreshProjectStatsView } from "./refresh-stats";

/**
 * Delete property and cleanup storage
 * ใช้กับ server action ที่รับ FormData จากฟอร์มลบทรัพย์
 * ลบได้เฉพาะเจ้าของทรัพย์หรือแอดมินเท่านั้น
 */
export async function deletePropertyAction(formData: FormData) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const id = formData.get("id") as string | null;
    if (!id) throw new Error("Missing property id");

    // 0) โหลดเจ้าของทรัพย์เพื่อเช็คสิทธิ (owner/admin) โดยดึงข้อมูลโดยตรงก่อน เพื่อเช็คข้ามสาขาแบบปลอดภัยได้
    const { data: property, error: propErr } = await supabase
      .from("properties_core")
      .select("id, created_by, tenant_id")
      .eq("id", id)
      .single();

    if (propErr || !property) throw new Error("Property not found");

    const propertyTenantId = property.tenant_id;
    if (!propertyTenantId) throw new Error("Property does not belong to any tenant/branch");

    // ตรวจสอบสิทธิ์สำหรับคนที่ไม่ใช่ ADMIN
    if (role !== "ADMIN") {
      // ถ้าเลือกเจาะจงสาขา (tenantId) ต้องตรงกับสาขาของทรัพย์
      if (tenantId && tenantId !== propertyTenantId) {
        throw new Error("Forbidden: You do not have access to this tenant's property");
      }
      
      // ถ้าเลือก "ALL" (tenantId เป็น undefined) ให้ตรวจความเป็นสมาชิกของสาขานี้
      if (!tenantId) {
        const { data: member, error: memberErr } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", propertyTenantId)
          .eq("identity_id", user.id)
          .maybeSingle();

        if (memberErr || !member) {
          throw new Error("Forbidden: You are not a member of this property's tenant/branch");
        }
      }
    }

    // 0.1) Authorization: Only Owner, Admin or Manager can delete
    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    if (property.created_by !== user.id && !canBypassOwnership) {
      throw new Error("Forbidden: You can only delete your own properties");
    }

    assertAuthenticated({ userId: user.id, role });

    // 0.2) Check for dependencies that block deletion (like active Deals)
    const { count: dealCount, error: dealErr } = await supabase
      .from("crm_deals_v3")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id);

    if (dealCount && dealCount > 0) {
      throw new Error(
        "ไม่สามารถลบทรัพย์ที่มีการทำ Deal ไปแล้วได้ (กรุณาใช้การ Archive แทน)",
      );
    }

    // 1) Get image paths first (to use for cleanup later)
    const { data: images } = await supabase
      .from("property_media_v3")
      .select("storage_path")
      .eq("property_id", id);

    // 2) Manual Cleanup of Dependencies (V3 Details, Media, Agents, Features)
    // In a perfect V3, these should have ON DELETE CASCADE, 
    // but we'll do explicit cleanup for extra safety during migration.
    
    await Promise.all([
      supabase.from("properties_details").delete().eq("property_id", id),
      supabase.from("property_media_v3").delete().eq("property_id", id),
      supabase.from("property_agents").delete().eq("property_id", id),
      supabase.from("property_features").delete().eq("property_id", id),
    ]);

    // 3) Delete main property record
    const { error } = await supabase
      .from("properties_core")
      .delete()
      .eq("id", id)
      .eq("tenant_id", propertyTenantId);

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
        try {
          const { inngest } = await import("@/lib/inngest/client");
          await inngest.send({
            name: "storage.cleanup.requested",
            data: {
              bucket: PROPERTY_IMAGES_BUCKET,
              paths: pathsToRemove
            }
          });
        } catch (e: any) {
          console.warn("[Storage Cleanup] Inngest skipped, performing direct cleanup:", e?.message);
          await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(pathsToRemove).catch((err) =>
            console.error("[Storage Cleanup] Direct storage remove error:", err)
          );
        }
      }
    }

    // 5) Audit log delete
    await logAudit(
      { supabase, user, role },
      {
        action: "property.delete",
        entity: "properties_core",
        entityId: id,
        metadata: {
          // ใส่ได้ตามต้องการ เช่นจำนวนรูปที่ลบจริง (ถ้าคำนวณไว้)
        },
      },
    );

    // Clean up TEMP uploads (V3 handled via storage cleanup)

    revalidatePath("/");
    revalidatePath("/properties");
    revalidatePath("/api/public/properties");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    refreshProjectStatsView(supabase).catch(e => console.error("[RPC] View refresh failed:", e));
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    purgeCloudflareCache(["/properties", "/", "/api/public/properties"]).catch(e => console.error("[Cloudflare] Auto-purge failed:", e));
    return { success: true, message: "ลบทรัพย์สำเร็จ" };
  } catch (error: unknown) {
    console.error("deletePropertyAction → error:", error);
    if (error instanceof AuthzError) {
      return authzFail(error);
    }
    return { success: false, message: mapDbError(error) };
  }
}
