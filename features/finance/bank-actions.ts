"use server";

import { requireAuthContext } from "@/lib/authz";

/**
 * 🏦 ดึงรายการธนาคารมาตรฐาน (Standardized Banks)
 */
export async function getBanksAction() {
  try {
    const { supabase } = await requireAuthContext();
    const { data, error } = await supabase
      .from("ref_banks")
      .select("*")
      .eq("is_active", true)
      .order("name_th", { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error fetching banks:", error);
    return { 
      success: false, 
      error: (error as Error).message || "ไม่สามารถดึงข้อมูลธนาคารได้" 
    };
  }
}
