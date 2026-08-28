"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini";
import { popularAreaSchema } from "./popular-areas-validation";
import { mapDbError } from "@/lib/db-error";
import { Database, type Json } from "@/lib/database.types.generated";
import { logAudit } from "@/lib/audit";
import { type SupabaseClient } from "@supabase/supabase-js";

import { isCbdProperty } from "@/lib/property-utils";

/** Row shape returned by the get_popular_areas_with_counts RPC.
 *  Defined here because the Supabase generated types lag behind the DB schema
 *  (name_ru was added after the last type generation). */
interface PopularAreaRpcRow {
  id: string;
  name: string;
  name_en: string | null;
  name_cn: string | null;
  name_ru: string | null;
  slug: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  featured: boolean | null;
  is_cbd?: boolean | null;
  province: string | null;
  property_count: number | null;
  created_at: string | null;
  description: Record<string, string> | null;
  seo_title: Record<string, string> | null;
  seo_description: Record<string, string> | null;
  is_ai_generated: boolean | null;
}

type PopularAreaInsert =
  Database["public"]["Tables"]["popular_areas_v3"]["Insert"];
type PopularAreaUpdate =
  Database["public"]["Tables"]["popular_areas_v3"]["Update"];

/** Extended Database interface to include dynamic RPC function */
type ExtendedDatabase = Database & {
  public: {
    Functions: {
      get_popular_areas_with_counts: {
        Args: { target_tenant_id?: string };
        Returns: PopularAreaRpcRow[];
      };
    };
  };
};

/**
 * Get popular areas with optional search and pagination (Server-side)
 */
export async function getPopularAreas({
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "sort_order",
  sortOrder = "asc",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    const { supabase, tenantId } = await requireAuthContext();
    const offset = (page - 1) * pageSize;

    // Use the Dynamic RPC for reading to support branch-specific property counting
    // We skip .select() because the generated Supabase types don't include name_ru yet
    // (needs `supabase gen types` re-run). Cast to PopularAreaRpcRow[] after execution.
    const extendedSupabase = supabase as unknown as SupabaseClient<ExtendedDatabase>;
    let query = extendedSupabase
      .rpc(
        "get_popular_areas_with_counts",
        { target_tenant_id: tenantId ?? undefined },
        { count: "exact" },
      );

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,name_en.ilike.%${search}%,name_cn.ilike.%${search}%,name_ru.ilike.%${search}%`,
      );
    }

    // Defensive check: Only sort by columns that exist in the view
    const validColumns = [
      "id",
      "name",
      "sort_order",
      "created_at",
      "property_count",
    ];
    const actualSortBy = validColumns.includes(sortBy) ? sortBy : "sort_order";

    // Default primary sort
    query = query.order(
      actualSortBy as keyof PopularAreaRpcRow,
      { ascending: sortOrder === "asc" },
    );

    // Fallback secondary sort for consistency
    if (actualSortBy !== "sort_order") {
      query = query.order("sort_order", { ascending: true });
    }

    const {
      data: rawAreas,
      count,
      error,
    } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Cast to our explicit type and map is_cbd dynamically
    const areas = ((rawAreas ?? []) as unknown as PopularAreaRpcRow[]).map(
      (area) => {
        const isCbd =
          (area.description as any)?.is_cbd !== undefined
            ? Boolean((area.description as any).is_cbd)
            : isCbdProperty(area);
        return {
          ...area,
          is_cbd: isCbd,
        };
      }
    );

    return {
      success: true,
      data: areas,
      totalCount: count || 0,
    };
  } catch (error: unknown) {
    console.error("getPopularAreas error:", error);
    return {
      success: false,
      message: mapDbError(error),
      data: [],
      totalCount: 0,
    };
  }
}

/**
 * Create a new popular area
 */
export async function createPopularArea(
  values: z.infer<typeof popularAreaSchema>,
) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const parsed = popularAreaSchema.parse(values);
    const supabase = await createClient();

    // Get next sort order (With better null handling)
    let lastQuery = supabase
      .from("popular_areas_v3")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    if (ctx.tenantId) {
      lastQuery = lastQuery.eq("tenant_id", ctx.tenantId);
    }

    const { data: lastItem } = await lastQuery;

    const nextOrder = (Number(lastItem?.[0]?.sort_order) || 0) + 1;

    const insertData: PopularAreaInsert = {
      id: crypto.randomUUID(),
      name: {
        th: parsed.name || parsed.name_en || "",
        en: parsed.name_en || parsed.name || "",
        cn: parsed.name_cn || "",
        ru: parsed.name_ru || "",
      },
      province: parsed.province,
      slug: parsed.slug,
      image_url: parsed.image_url,
      featured: parsed.featured,
      is_active: parsed.is_active,
      sort_order: nextOrder,
      tenant_id: ctx.tenantId ?? null,
      description: {
        ...(parsed.description || {}),
        is_cbd: parsed.is_cbd ?? false,
      },
      seo_title: parsed.seo_title || {},
      seo_description: parsed.seo_description || {},
      is_ai_generated: parsed.is_ai_generated || false,
    };

    const { error } = await supabase
      .from("popular_areas_v3")
      .insert(insertData)
      .select("id")
      .single();
    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.create",
        entity: "popular_areas_v3",
        metadata: { name: parsed.name || parsed.name_en, province: parsed.province },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");
    return { success: true, message: "สร้างทำเลยอดนิยมสำเร็จ" };
  } catch (error: unknown) {
    console.error("createPopularArea error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Update popular area
 */
export async function updatePopularArea(
  id: string,
  values: z.infer<typeof popularAreaSchema>,
) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const parsed = popularAreaSchema.parse(values);
    const supabase = await createClient();

    const updateData: PopularAreaUpdate = {
      name: {
        th: parsed.name || parsed.name_en || "",
        en: parsed.name_en || parsed.name || "",
        cn: parsed.name_cn || "",
        ru: parsed.name_ru || "",
      },
      province: parsed.province,
      slug: parsed.slug,
      image_url: parsed.image_url,
      featured: parsed.featured,
      is_active: parsed.is_active,
      description: {
        ...(parsed.description || {}),
        is_cbd: parsed.is_cbd ?? false,
      },
      seo_title: parsed.seo_title || {},
      seo_description: parsed.seo_description || {},
      is_ai_generated: parsed.is_ai_generated,
      updated_at: new Date().toISOString(),
    };

    let updateQuery = supabase
      .from("popular_areas_v3")
      .update(updateData)
      .eq("id", id);

    if (ctx.tenantId) {
      updateQuery = updateQuery.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.update",
        entity: "popular_areas_v3",
        entityId: id,
        metadata: { name: parsed.name, province: parsed.province },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");
    return { success: true, message: "อัปเดตข้อมูลสำเร็จ" };
  } catch (error: unknown) {
    console.error("updatePopularArea error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Toggle CBD Status of a popular area
 */
export async function toggleCbdPopularAreaAction(id: string, is_cbd: boolean) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const supabase = await createClient();

    const { data: area } = await supabase
      .from("popular_areas_v3")
      .select("id, description")
      .eq("id", id)
      .single();

    const currentDesc = (area?.description as Record<string, any>) || {};
    const updatedDesc = {
      ...currentDesc,
      is_cbd,
    };

    let query = supabase
      .from("popular_areas_v3")
      .update({
        description: updatedDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await query;
    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.toggle_cbd",
        entity: "popular_areas_v3",
        entityId: id,
        metadata: { is_cbd },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties/prime-cbd");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");

    return {
      success: true,
      message: is_cbd ? "ตั้งเป็นทำเล CBD สำเร็จ" : "ยกเลิกสถานะทำเล CBD สำเร็จ",
    };
  } catch (error: unknown) {
    console.error("toggleCbdPopularAreaAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Delete popular area
 */
export async function deletePopularArea(id: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const supabase = await createClient();

    let query = supabase
      .from("popular_areas_v3")
      .delete()
      .eq("id", id);

    if (ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { error } = await query;
    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.delete",
        entity: "popular_areas_v3",
        entityId: id,
      },
    );

    await resequencePopularAreas();

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");
    return { success: true, message: "ลบทำเลสำเร็จ" };
  } catch (error: unknown) {
    console.error("deletePopularArea error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Resequence sort_order to ensure consistency using atomic upsert
 */
export async function resequencePopularAreas() {
  try {
    const ctx = await requireAuthContext();
    const supabase = await createClient();

    let query = supabase
      .from("popular_areas_v3")
      .select("id, name, sort_order, created_at");

    if (ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { data: areas } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!areas) return;

    const updates: PopularAreaInsert[] = areas.map(
      (area: { id: string; name: Json }, index: number) => ({
        id: area.id,
        name: area.name,
        sort_order: index + 1,
        tenant_id: ctx.tenantId ?? null,
      }),
    );

    const { error } = await supabase
      .from("popular_areas_v3")
      .upsert(updates);

    if (error) throw error;
  } catch (error: unknown) {
    console.error("resequencePopularAreas error:", error);
  }
}

/**
 * Reorder popular areas (DnD Support) with explicit types
 */
export async function reorderPopularAreasAction(
  ids: string[],
  offset: number = 0,
) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const supabase = await createClient();

    let query = supabase
      .from("popular_areas_v3")
      .select("id, name")
      .in("id", ids);

    if (ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId);
    }

    const { data: currentAreas } = await query;

    const updates: PopularAreaInsert[] = ids.map(
      (id: string, index: number) => {
        const area = currentAreas?.find((a: { id: string; name: Json }) => a.id === id);
        return {
          id,
          name: area?.name || { th: "" },
          sort_order: offset + index + 1,
          tenant_id: ctx.tenantId ?? null,
        };
      },
    );

    const { error } = await supabase
      .from("popular_areas_v3")
      .upsert(updates);

    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.reorder",
        entity: "popular_areas_v3",
        metadata: { count: ids.length, offset },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    revalidatePath("/properties");
    revalidatePath("/");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("area-translations", "seconds");
    revalidateTag("public-data", "seconds");
    return { success: true, message: "ปรับลำดับทำเลสำเร็จ" };
  } catch (error: unknown) {
    console.error("reorderPopularAreasAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Upload thumbnail for popular area
 */
export async function uploadPopularAreaImageAction(formData: FormData) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" };

    const { uploadSiteAsset } =
      await import("@/features/site-settings/storage");
    const result = await uploadSiteAsset(
      file,
      file.name,
      file.type,
      "popular-areas",
    );

    if (result.success) {
      await logAudit(
        {
          supabase: ctx.supabase,
          user: ctx.user,
          role: ctx.role,
          tenantId: ctx.tenantId,
        },
        {
          action: "popular_area.upload_image",
          entity: "popular_areas_v3",
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            type: file.type,
          },
        },
      );
    }

    return result;
  } catch (error: unknown) {
    console.error("uploadPopularAreaImageAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Bulk translation action with AI Protection & Robust Guarding
 */
export async function bulkTranslatePopularAreasAction(
  ids?: string[],
  selectAll?: boolean,
  search?: string,
) {
  const { supabase, user, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  try {
    let query = supabase
      .from("popular_areas_v3")
      .select("id, name, province, slug, image_url, sort_order, is_active, featured");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (selectAll) {
      if (search) {
        query = query.or(
          `name->>th.ilike.%${search}%,name->>en.ilike.%${search}%,name->>cn.ilike.%${search}%,name->>ru.ilike.%${search}%`,
        );
      }
    } else if (ids && ids.length > 0) {
      query = query.in("id", ids);
    } else {
      return { success: true, message: "ไม่มีข้อมูลให้แปล" };
    }

    const { data: areas, error } = await query;
    if (error) throw error;
    if (!areas || areas.length === 0)
      return { success: true, message: "ไม่มีข้อมูลให้แปล" };

    // Limit to items that actually need translation or are outdated
    const toTranslate = areas.filter((a: { id: string; name: Json; province: string | null }) => {
      const n = (a.name as Record<string, unknown> | null) || {};
      const th = (n.th as string) || "";
      const en = (n.en as string) || "";
      const cn = (n.cn as string) || "";
      const ru = (n.ru as string) || "";
      return !en || !cn || !ru || en === th || cn === th || ru === th;
    });

    if (toTranslate.length === 0)
      return {
        success: true,
        message: "ข้อมูลทุกรายการมีคำแปลที่มีคุณภาพแล้ว",
      };

    // AI Guard: Limit to 100 items per request to protect context window and costs
    const limitedItems = toTranslate.slice(0, 100);

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    const { logAudit } = await import("@/lib/audit");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.blog_generator_model || "gemini-flash-lite-latest";

    const prompt = `
      Translate location names in Thailand from Thai to English, Chinese, and Russian.
      Names: ${JSON.stringify(limitedItems.map((a: { id: string; name: Json }) => ({ id: a.id, name: ((a.name as Record<string, unknown> | null)?.th as string) || "" })))}
      Return strict JSON Array of objects: [{ "id": "uuid", "name_en": "...", "name_cn": "...", "name_ru": "..." }]
      Do not include any markers or explanation.
    `;

    const result = await generateText(prompt, modelName);

    // Robust JSON Guarding
    let translatedData: Record<string, unknown>[] = [];
    try {
      const jsonStr = result.text.replace(/```json|```/g, "").trim();
      translatedData = JSON.parse(jsonStr);

      if (!Array.isArray(translatedData)) {
        throw new Error("AI returned invalid data format (not an array)");
      }
    } catch (parseErr) {
      console.error(
        "AI Translation Parse Error:",
        parseErr,
        "Raw output:",
        result.text,
      );
      return {
        success: false,
        message: "AI คืนค่าข้อมูลในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่อีกครั้ง",
      };
    }

    // Filter out items that are missing essential fields and include required fields for upsert integrity
    const validUpdates: PopularAreaInsert[] = (
        translatedData as { id: string; name_en?: string; name_cn?: string; name_ru?: string }[]
      )
      .filter(
        (item) => item.id && (item.name_en || item.name_cn || item.name_ru),
      )
      .map((item) => {
        const original = areas.find((a: { id: string; name: Json; province: string | null }) => a.id === item.id);
        const oldName = (original?.name as Record<string, unknown> | null) || {};
        return {
          id: item.id,
          name: {
            th: (oldName.th as string) || "",
            en: (item.name_en || "").trim() || (oldName.en as string) || "",
            cn: (item.name_cn || "").trim() || (oldName.cn as string) || "",
            ru: (item.name_ru || "").trim() || (oldName.ru as string) || "",
          },
          province: original?.province || null,
          tenant_id: tenantId ?? null,
        };
      });

    if (validUpdates.length === 0) {
      return {
        success: false,
        message: "ไม่สามารถแปลงข้อมูลที่ได้จาก AI เข้าสู่รูปแบบที่ถูกต้องได้",
      };
    }

    const { error: upsertErr } = await supabase
      .from("popular_areas_v3")
      .upsert(validUpdates);
    if (upsertErr) throw upsertErr;

    // Log AI Usage & Audit Trail
    await logAiUsage({
      model: modelName,
      feature: "popular_areas_translator",
      status: "success",
    });
    await logAudit(
      { supabase, user, role },
      {
        action: "popular_area.bulk_translate",
        entity: "popular_areas_v3",
        entityId: selectAll ? "all" : ids?.join(",") || "",
        metadata: {
          translatedCount: validUpdates.length,
          model: modelName,
          selectAll,
          search,
        },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    return {
      success: true,
      message: `แปลภาษาสำเร็จ ${validUpdates.length} รายการ`,
    };
  } catch (error: unknown) {
    console.error("Bulk Translate Error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Generate SEO description content for a popular area using Gemini
 */
export async function generateAreaSeoContentAction(
  nameTh: string,
  nameEn: string,
  province: string
) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.blog_generator_model || "gemini-flash-lite-latest";

    const prompt = `
      You are a premium luxury and residential real estate investment analyst in Thailand.
      Generate complete information for a popular geographic area in Thailand.
      Area Name (Thai): ${nameTh || "Not provided"}
      Area Name (English): ${nameEn || "Not provided"}
      Province: ${province || "Bangkok"}
      
      Tasks:
      1. Translate the area name accurately into all 4 languages: Thai (th), English (en), Chinese (cn), and Russian (ru).
      2. Write a short, engaging description/guide for this area in 4 languages: Thai (th), English (en), Chinese (cn), and Russian (ru). Focus on location highlights, premium lifestyle, transportation connectivity (like BTS/MRT), and residential attractiveness. Keep each translation around 80-120 words. Use simple HTML tags (<p>, <strong>, <ul>, <li>).
      3. Write a highly optimized SEO Title and SEO Meta Description for this area page in all 4 languages.
      4. Generate a clean URL slug in English (lowercase, alphanumeric characters and hyphens only, e.g., "sukhumvit" or "bang-na").
      
      Format the response as a strict JSON object matching this schema exactly:
      {
        "slug": "url-slug",
        "name": {
          "th": "Thai area name",
          "en": "English area name",
          "cn": "Chinese area name",
          "ru": "Russian area name"
        },
        "description": {
          "th": "Thai description...",
          "en": "English description...",
          "cn": "Chinese description...",
          "ru": "Russian description..."
        },
        "seoTitle": {
          "th": "SEO Title in Thai (under 60 chars)",
          "en": "SEO Title in English (under 60 chars)",
          "cn": "SEO Title in Chinese (under 60 chars)",
          "ru": "SEO Title in Russian (under 60 chars)"
        },
        "seoDescription": {
          "th": "SEO Description in Thai (under 160 chars)",
          "en": "SEO Description in English (under 160 chars)",
          "cn": "SEO Description in Chinese (under 160 chars)",
          "ru": "SEO Description in Russian (under 160 chars)"
        }
      }
      Do not include markdown code block syntax (like \`\`\`json). Output ONLY the raw JSON string.
    `;

    const result = await generateText(prompt, modelName);
    
    let parsed = null;
    try {
      const jsonStr = result.text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Gemini parse error:", parseErr, "Raw output:", result.text);
      return { success: false, message: "AI คืนค่าข้อมูลในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่อีกครั้ง" };
    }

    await logAiUsage({
      model: modelName,
      feature: "popular_area_generator",
      status: "success",
    });

    return {
      success: true,
      data: parsed,
    };
  } catch (error: unknown) {
    console.error("generateAreaSeoContentAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}



