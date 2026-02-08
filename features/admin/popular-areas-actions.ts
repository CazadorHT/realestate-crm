"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  name_en: z.string().optional(),
  name_cn: z.string().optional(),
});

export async function getPopularAreasAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("popular_areas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPopularAreaAction(
  name: string,
  name_en?: string,
  name_cn?: string,
) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const parsed = schema.safeParse({ name, name_en, name_cn });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("popular_areas").insert({
    name: parsed.data.name,
    name_en: parsed.data.name_en,
    name_cn: parsed.data.name_cn,
  });

  if (error) return { success: false, message: error.message };
  revalidatePath("/protected/admin/popular-areas");
  return { success: true, message: "เพิ่มทำเลสำเร็จ" };
}

export async function updatePopularAreaAction(
  id: string,
  name: string,
  name_en?: string,
  name_cn?: string,
) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const parsed = schema.safeParse({ name, name_en, name_cn });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("popular_areas")
    .update({
      name: parsed.data.name,
      name_en: parsed.data.name_en,
      name_cn: parsed.data.name_cn,
    })
    .eq("id", id)
    .select();

  if (error) return { success: false, message: error.message };

  if (!data || data.length === 0) {
    return {
      success: false,
      message: "ไม่สามารถอัปเดตข้อมูลได้ (Matched 0 rows)",
    };
  }

  revalidatePath("/protected/admin/popular-areas");
  return { success: true, message: "แก้ไขทำเลสำเร็จ", data: data[0] };
}

export async function deletePopularAreaAction(id: string) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  const supabase = await createClient();
  const { error } = await supabase.from("popular_areas").delete().eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/protected/admin/popular-areas");
  return { success: true, message: "ลบทำเลสำเร็จ" };
}
