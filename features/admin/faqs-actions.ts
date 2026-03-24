"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";

import { z } from "zod";

const faqSchema = z.object({
  question: z.string().min(1, "กรุณาระบุคำถาม"),
  question_en: z.string().optional().nullable(),
  question_cn: z.string().optional().nullable(),
  answer: z.string().min(1, "กรุณาระบุคำตอบ"),
  answer_en: z.string().optional().nullable(),
  answer_cn: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  sort_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const updateFaqSchema = faqSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateFaqInput = z.infer<typeof faqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

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
    const validated = faqSchema.parse(input);
    const { role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant context required");

    const supabase = await createClient();
    const { error } = await supabase.from("faqs").insert([{
      ...validated,
      tenant_id: tenantId
    }]);

    if (error) throw error;
    
    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/"); // Update public page
    return { success: true, message: "สร้างคำถามสำเร็จ" };
  } catch (error: any) {
    console.error("createFaq error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function updateFaq(input: UpdateFaqInput) {
  try {
    const validated = updateFaqSchema.parse(input);
    const { role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant context required");

    const supabase = await createClient();
    const { id, ...updates } = validated;
    const { error } = await supabase
      .from("faqs")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    return { success: true, message: "แก้ไขคำถามสำเร็จ" };
  } catch (error: any) {
    console.error("updateFaq error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function deleteFaq(id: string) {
  try {
    const { role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant context required");

    const supabase = await createClient();
    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    return { success: true, message: "ลบคำถามสำเร็จ" };
  } catch (error: any) {
    console.error("deleteFaq error:", error);
    return { success: false, message: mapDbError(error) };
  }
}
