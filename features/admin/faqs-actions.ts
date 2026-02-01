"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function getFaqs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
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
