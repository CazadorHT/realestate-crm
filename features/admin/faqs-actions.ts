"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";

type CreateFaqInput = {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
};

type UpdateFaqInput = {
  id: string;
  question?: string;
  answer?: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function getFaqs(page = 1, pageSize = 10) {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("faqs")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching FAQs:", error);
    throw new Error(mapDbError(error));
  }

  return { faqs: data || [], count: count || 0 };
}

export async function getFaq(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createFaq(input: CreateFaqInput) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("faqs").insert([input]);

    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/faqs");
    revalidatePath("/"); // Update public page
    return { success: true, message: "สร้างคำถามสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

export async function updateFaq(input: UpdateFaqInput) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { id, ...updates } = input;
    const { error } = await supabase.from("faqs").update(updates).eq("id", id);

    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/faqs");
    revalidatePath("/");
    return { success: true, message: "แก้ไขคำถามสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

export async function deleteFaq(id: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("faqs").delete().eq("id", id);

    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/faqs");
    revalidatePath("/");
    return { success: true, message: "ลบคำถามสำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}
