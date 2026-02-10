"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Soft delete a property by setting deleted_at to now
 */
export async function softDeleteProperty(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error soft deleting property:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/properties"); // สำหรับหน้า Public หรือหน้ารายการทั่วไป
    revalidatePath("/protected/properties"); // เส้นทางที่ถูกต้องสำหรับรายการ protected
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
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("properties")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) {
      console.error("Error restoring property:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/properties");
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
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("Error permanently deleting property:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/properties");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in permanentDeleteProperty:", err);
    return { success: false, error: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
