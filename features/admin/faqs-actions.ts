"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertSystemAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { redis } from "@/lib/redis";

import { z } from "zod";


import { Database } from "@/lib/database.types.generated";

type CmsContentRow = Database["public"]["Tables"]["cms_content_v3"]["Row"];

const faqSchema = z.object({
  question: z.record(z.string()).describe("JSONB for multi-lang: {th, en, cn, ru}"),
  answer: z.record(z.string()).describe("JSONB for multi-lang: {th, en, cn, ru}"),
  category: z.string().optional().nullable(),
  sort_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const updateFaqSchema = faqSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateFaqInput = z.infer<typeof faqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

export interface FAQItem {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  category?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  view_count?: number;
}

function parseRecord(json: CmsContentRow["title"]): Record<string, string> {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      res[k] = String(v || "");
    }
    return res;
  }
  return { th: String(json || "") };
}

function parseMetaData(json: CmsContentRow["meta_data"]): { category?: string | null; sort_order?: number; view_count?: number } {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    const record = json as Record<string, unknown>;
    return {
      category: typeof record.category === "string" ? record.category : null,
      sort_order: typeof record.sort_order === "number" ? record.sort_order : (typeof record.sort_order === "string" ? Number(record.sort_order) : 0),
      view_count: typeof record.view_count === "number" ? record.view_count : (typeof record.view_count === "string" ? Number(record.view_count) : 0),
    };
  }
  return {};
}

export async function getFaqs(page = 1, pageSize = 10, isTrash = false, search = "") {
  const cacheKey = `faqs:list:${page}:${pageSize}:${isTrash}:${search || "none"}`;
  
  // 1. Try Cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as { faqs: FAQItem[]; count: number };
    } catch (e: unknown) {
      console.warn("[Redis] Cache read error:", e);
    }
  }

  const { tenantId } = await requireAuthContext();
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("cms_content_v3")
    .select("id, title, content, meta_data, status, created_at, updated_at", { count: "exact" })
    .eq("content_type", "FAQ");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  if (isTrash) {
    query = query.eq("status", "trash");
  } else {
    query = query.neq("status", "trash");
  }

  if (search) {
    query = query.textSearch("fts_vector", search, {
      config: "simple",
      type: "plain",
    });
  }

  const { data, error, count } = await query
    .order("meta_data->sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Error fetching FAQs:", error);
    throw new Error(mapDbError(error));
  }

  // Map to legacy-like format for UI compatibility with 100% type safety
  const mappedFaqs: FAQItem[] = (data || []).map((item: CmsContentRow) => {
    const meta = parseMetaData(item.meta_data);
    return {
      id: item.id,
      question: parseRecord(item.title),
      answer: parseRecord(item.content),
      category: meta.category || "ทั่วไป",
      sort_order: meta.sort_order || 0,
      is_active: item.status === "published",
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.status === "trash" ? item.updated_at : null,
      view_count: meta.view_count || 0
    };
  });

  const result = { faqs: mappedFaqs, count: count || 0 };

  // 2. Write to Cache (TTL 1 hour)
  if (redis && result.faqs.length > 0) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 });
    } catch (e) {
      console.warn("[Redis] Cache write error:", e);
    }
  }

  return result;
}

/**
 * 🧹 Helper to clear FAQ cache on mutations
 */
async function clearFaqCache() {
  if (!redis) return;
  try {
    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (e) {
    console.warn("[Redis] Cache clear error:", e);
  }
}

export async function getFaq(id: string): Promise<FAQItem> {
  const { tenantId } = await requireAuthContext();
  const supabase = await createClient();
  let query = supabase
    .from("cms_content_v3")
    .select("id, title, content, meta_data, status, created_at, updated_at")
    .eq("id", id)
    .eq("content_type", "FAQ");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error) throw new Error(mapDbError(error));
  
  const meta = parseMetaData(data.meta_data);
  return {
    id: data.id,
    question: parseRecord(data.title),
    answer: parseRecord(data.content),
    category: meta.category || "ทั่วไป",
    sort_order: meta.sort_order || 0,
    is_active: data.status === "published",
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.status === "trash" ? data.updated_at : null,
    view_count: meta.view_count || 0
  };
}

export async function createFaq(input: CreateFaqInput) {
  try {
    const validated = faqSchema.parse(input);
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    const faqId = crypto.randomUUID();
    const { data: faq, error } = await supabase
      .from("cms_content_v3")
      .insert([{
        id: faqId,
        content_type: "FAQ",
        tenant_id: tenantId ?? null,
        author_id: user.id,
        title: validated.question,
        content: validated.answer,
        status: validated.is_active ? "published" : "draft",
        slug: `faq-${faqId.slice(0, 8)}`,
        meta_data: {
          category: validated.category,
          sort_order: validated.sort_order
        }
      }])
      .select("id, title")
      .single();

    if (error) throw error;
    
    await logAudit(
      { supabase, user, role },
      {
        action: "faq.create",
        entity: "cms_content_v3",
        entityId: faq.id,
        metadata: { question: faq.title },
      }
    );

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    await clearFaqCache();
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
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    const { id, ...updates } = validated;
    let query = supabase
      .from("cms_content_v3")
      .update({
        title: updates.question,
        content: updates.answer,
        status: updates.is_active ? "published" : "draft",
        meta_data: {
          category: updates.category,
          sort_order: updates.sort_order
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("content_type", "FAQ");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.update",
        entity: "cms_content_v3",
        entityId: id,
        metadata: { question: updates.question },
      }
    );

    revalidatePath("/admin/faqs");
    revalidatePath("/protected/faqs");
    revalidatePath("/");
    await clearFaqCache();
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
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    let query = supabase
      .from("cms_content_v3")
      .update({ 
        status: "trash",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("content_type", "FAQ");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.trash",
        entity: "cms_content_v3",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    await clearFaqCache();
    return { success: true, message: "ย้ายลงถังขยะเรียบร้อย" };
  } catch (error: unknown) {
    console.error("moveToTrash error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function restoreFaqAction(id: string) {
  try {
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    let query = supabase
      .from("cms_content_v3")
      .update({ status: "published" })
      .eq("id", id)
      .eq("content_type", "FAQ");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.restore",
        entity: "cms_content_v3",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    await clearFaqCache();
    return { success: true, message: "กู้คืนข้อมูลสำเร็จ" };
  } catch (error: unknown) {
    console.error("restoreFaq error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function permanentDeleteFaqAction(id: string) {
  try {
    const { role, user, supabase, tenantId } = await requireAuthContext();
    assertSystemAdmin(role);

    let query = supabase
      .from("cms_content_v3")
      .delete()
      .eq("id", id)
      .eq("content_type", "FAQ");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

    if (error) throw error;

    await logAudit(
      { supabase, user, role },
      {
        action: "faq.permanent_delete",
        entity: "cms_content_v3",
        entityId: id,
      }
    );

    revalidatePath("/protected/faqs");
    await clearFaqCache();
    return { success: true, message: "ลบข้อมูลถาวรเรียบร้อย" };
  } catch (error: unknown) {
    console.error("permanentDelete error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function incrementFaqViewAction(id: string) {
  try {
    const supabase = await createClient();
    // In V3, we should use a generic content view counter if available, 
    // or fallback to meta_data increment
    const { data: faq } = await supabase
      .from("cms_content_v3")
      .select("meta_data")
      .eq("id", id)
      .single();
    
    const meta = parseMetaData(faq?.meta_data || null);
    const currentViews = meta.view_count || 0;
    
    await supabase
      .from("cms_content_v3")
      .update({ 
        meta_data: { 
          ...(typeof faq?.meta_data === "object" && faq?.meta_data !== null && !Array.isArray(faq.meta_data) ? faq.meta_data : {}), 
          view_count: currentViews + 1 
        } 
      })
      .eq("id", id);
    
    return { success: true };
  } catch (error: unknown) {
    console.error("incrementFaqView error:", error);
    return { success: false };
  }
}
