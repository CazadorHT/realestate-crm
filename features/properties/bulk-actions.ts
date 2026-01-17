"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const PROPERTY_IMAGES_BUCKET = "property-images";

export type BulkDeleteResult = {
  success: boolean;
  deletedCount: number;
  message?: string;
};

/**
 * Bulk delete properties - ลบหลายทรัพย์พร้อมกัน
 */
export async function bulkDeletePropertiesAction(
  ids: string[]
): Promise<BulkDeleteResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    if (!ids || ids.length === 0) {
      return {
        success: false,
        deletedCount: 0,
        message: "ไม่มีรายการที่เลือก",
      };
    }

    // 1) Get all images to delete from storage
    const { data: images } = await supabase
      .from("property_images")
      .select("storage_path")
      .in("property_id", ids);

    // 2) Delete images from storage
    if (images && images.length > 0) {
      const pathsToRemove = images
        .map((img) => img.storage_path)
        .filter((path): path is string => !!path);

      if (pathsToRemove.length > 0) {
        await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .remove(pathsToRemove);
      }
    }

    // 3) Delete properties (cascade will delete property_images records)
    const { error, count } = await supabase
      .from("properties")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) throw error;

    // 4) Audit log
    await logAudit(
      { supabase, user, role },
      {
        action: "property.bulk_delete",
        entity: "properties",
        entityId: ids.join(","),
        metadata: { deletedCount: count },
      }
    );

    // 5) Cleanup temp uploads
    await supabase
      .from("property_image_uploads")
      .delete()
      .eq("user_id", user.id)
      .eq("status", "TEMP");

    revalidatePath("/protected/properties");

    return {
      success: true,
      deletedCount: count ?? ids.length,
      message: `ลบทรัพย์สำเร็จ ${count ?? ids.length} รายการ`,
    };
  } catch (error) {
    console.error("bulkDeletePropertiesAction error:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
