"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";

/**
 * 🏦 ดึงรายการธนาคารมาตรฐานที่เปิดใช้งานอยู่ (สำหรับเอาไปทำ Combobox/Dropdown)
 */
export async function getBanksAction() {
  try {
    const { supabase } = await requireAuthContext();
    const { data, error } = await supabase
      .from("banks")
      .select("id, code, name_th, name_en, is_active")
      .eq("is_active", true)
      .order("name_th", { ascending: true });

    if (error) {
      // Fallback to legacy ref_banks if banks table is empty or error
      console.warn("Falling back to ref_banks table");
      const { data: refData, error: refError } = await supabase
        .from("ref_banks")
        .select("code, name_th, name_en")
        .eq("is_active", true)
        .order("name_th", { ascending: true });

      if (refError) throw refError;
      return { success: true, data: refData.map((b, i) => ({ id: i, ...b, is_active: true })) };
    }
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error fetching banks:", error);
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถดึงข้อมูลธนาคารได้",
    };
  }
}

/**
 * 🏦 ดึงรายการธนาคารทั้งหมด (สำหรับหน้าจัดการ CRUD)
 */
export async function getAllBanksAction() {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { data, error } = await supabase
      .from("banks")
      .select("id, code, name_th, name_en, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error fetching all banks:", error);
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถดึงข้อมูลธนาคารทั้งหมดได้",
    };
  }
}

/**
 * ➕ เพิ่มธนาคารใหม่
 */
export async function createBankAction(data: {
  code: string;
  name_th: string;
  name_en: string;
  is_active?: boolean;
}) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { data: inserted, error } = await supabase
      .from("banks")
      .insert([
        {
          code: data.code.toUpperCase().trim(),
          name_th: data.name_th.trim(),
          name_en: data.name_en.trim(),
          is_active: data.is_active ?? true,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/protected/finance/banks");
    return { success: true, data: inserted };
  } catch (error: unknown) {
    console.error("Error creating bank:", error);
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถเพิ่มข้อมูลธนาคารได้",
    };
  }
}

/**
 * 📝 แก้ไขข้อมูลธนาคาร
 */
export async function updateBankAction(
  id: string | number,
  data: {
    code?: string;
    name_th?: string;
    name_en?: string;
    is_active?: boolean;
  }
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase().trim();
    if (data.name_th !== undefined) updatePayload.name_th = data.name_th.trim();
    if (data.name_en !== undefined) updatePayload.name_en = data.name_en.trim();
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

    const { data: updated, error } = await supabase
      .from("banks")
      .update(updatePayload)
      .eq("id", id as any)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/protected/finance/banks");
    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error updating bank:", error);
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถแก้ไขข้อมูลธนาคารได้",
    };
  }
}

/**
 * ❌ ลบธนาคาร
 */
export async function deleteBankAction(id: string | number) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("banks")
      .delete()
      .eq("id", id as any);

    if (error) throw error;

    revalidatePath("/protected/finance/banks");
    return { success: true, message: "ลบข้อมูลธนาคารเรียบร้อยแล้ว" };
  } catch (error: unknown) {
    console.error("Error deleting bank:", error);
    return {
      success: false,
      error: (error as Error).message || "ไม่สามารถลบข้อมูลธนาคารได้",
    };
  }
}
