"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
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

export async function getFaqs(page = 1, pageSize = 10, isTrash = false, search = "") {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("faqs")
    .select("*", { count: "exact" });

  if (isTrash) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (search) {
    // Use Full-Text Search against the fts_vector column
    // 'plain' config handles multiple words naturally
    query = query.textSearch("fts_vector", search, {
      config: "simple",
      type: "plain",
    });
  }

  const { data, error, count } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
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
    const { role, user, supabase } = await requireAuthContext();
    assertStaff(role);

    const { data: faq, error } = await supabase
      .from("faqs")
      .insert([validated])
      .select()
      .single();

    if (error) throw error;
    
    await logAudit(
      { supabase, user, role },
      {
        action: "faq.create",
        entity: "faqs",
        entityId: faq.id,
        metadata: { question: faq.question },
      }
    );

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    return { success: true, message: "สร้างคำถามสำเร็จ" };
  } catch (error: unknown) {
    console.error("createFaq error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    return { 
      success: false, 
      message: mapDbError(error) 
    };
  }
}

export async function updateFaq(input: UpdateFaqInput) {
  try {
    const validated = updateFaqSchema.parse(input);
    const { role, user, supabase } = await requireAuthContext();
    assertStaff(role);

    const { id, ...updates } = validated;
    const { error } = await supabase
      .from("faqs")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.update",
        entity: "faqs",
        entityId: id,
        metadata: { question: updates.question },
      }
    );

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    return { success: true, message: "แก้ไขคำถามสำเร็จ" };
  } catch (error: unknown) {
    console.error("updateFaq error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    return { 
      success: false, 
      message: mapDbError(error) 
    };
  }
}

export async function moveToTrashAction(id: string) {
  try {
    const { role, user, supabase } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("faqs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.trash",
        entity: "faqs",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    return { success: true, message: "ย้ายลงถังขยะเรียบร้อย" };
  } catch (error: unknown) {
    console.error("moveToTrash error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function restoreFaqAction(id: string) {
  try {
    const { role, user, supabase } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("faqs")
      .update({ deleted_at: null })
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.restore",
        entity: "faqs",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    return { success: true, message: "กู้คืนข้อมูลสำเร็จ" };
  } catch (error: unknown) {
    console.error("restoreFaq error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function permanentDeleteFaqAction(id: string) {
  try {
    const { role, user, supabase } = await requireAuthContext();
    assertStaff(role);

    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.permanent_delete",
        entity: "faqs",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    return { success: true, message: "ลบข้อมูลถาวรเรียบร้อย" };
  } catch (error: unknown) {
    console.error("permanentDelete error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function incrementFaqViewAction(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("increment_faq_view", { faq_id: id });
    
    // Fallback if RPC doesn't exist yet
    if (error) {
      const { data: faq } = await supabase.from("faqs").select("view_count").eq("id", id).single();
      await supabase.from("faqs").update({ view_count: (faq?.view_count || 0) + 1 }).eq("id", id);
    }
    
    return { success: true };
  } catch (error) {
    console.error("incrementFaqView error:", error);
    return { success: false };
  }
}
