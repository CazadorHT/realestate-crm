"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini";
import { popularAreaSchema } from "./popular-areas-validation";
import { mapDbError } from "@/lib/db-error";
import { Database } from "@/lib/database.types";
import { logAudit } from "@/lib/audit";

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
  province: string | null;
  property_count: number | null;
  created_at: string | null;
}

type PopularAreaInsert =
  Database["public"]["Tables"]["popular_areas"]["Insert"];
type PopularAreaUpdate =
  Database["public"]["Tables"]["popular_areas"]["Update"];

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
    let query = supabase
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
      actualSortBy as keyof Database["public"]["Tables"]["popular_areas"]["Row"],
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

    // Cast to our explicit type since the RPC returns name_ru but generated types don't know
    const areas = (rawAreas ?? []) as unknown as PopularAreaRpcRow[];

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
    const { data: lastItem } = await supabase
      .from("popular_areas")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (Number(lastItem?.[0]?.sort_order) || 0) + 1;

    const insertData: PopularAreaInsert = {
      ...parsed,
      sort_order: nextOrder,
    };

    const { error } = await supabase
      .from("popular_areas")
      .insert(insertData)
      .select("id")
      .single();
    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.create",
        entity: "popular_areas",
        metadata: { name: parsed.name, province: parsed.province },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
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

    const updateData: PopularAreaUpdate = parsed;

    const { error } = await supabase
      .from("popular_areas")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.update",
        entity: "popular_areas",
        entityId: id,
        metadata: { name: parsed.name, province: parsed.province },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: "อัปเดตข้อมูลสำเร็จ" };
  } catch (error: unknown) {
    console.error("updatePopularArea error:", error);
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
    const { error } = await supabase
      .from("popular_areas")
      .delete()
      .eq("id", id);
    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.delete",
        entity: "popular_areas",
        entityId: id,
      },
    );

    await resequencePopularAreas();

    revalidatePath("/protected/admin/popular-areas");
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
    const supabase = await createClient();
    const { data: areas } = await supabase
      .from("popular_areas")
      .select("id")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!areas) return;

    const updates: PopularAreaUpdate[] = (areas || []).map(
      (area: { id: string }, index: number) => ({
        id: area.id,
        sort_order: index + 1,
      }),
    );

    const { error } = await supabase
      .from("popular_areas")
      .upsert(updates as any);

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

    const updates: PopularAreaUpdate[] = ids.map(
      (id: string, index: number) => ({
        id,
        sort_order: offset + index + 1,
      }),
    );

    const { error } = await supabase
      .from("popular_areas")
      .upsert(updates as any);

    if (error) throw error;

    await logAudit(
      { supabase, user: ctx.user, role: ctx.role, tenantId: ctx.tenantId },
      {
        action: "popular_area.reorder",
        entity: "popular_areas",
        metadata: { count: ids.length, offset },
      },
    );

    revalidatePath("/protected/admin/popular-areas");
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
          entity: "popular_areas",
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
  const { supabase, user, role } = await requireAuthContext();
  assertStaff(role);

  try {
    let query = supabase
      .from("popular_areas")
      .select("id, name, name_en, name_cn, name_ru, slug, image_url, sort_order, is_active, featured, province");

    if (selectAll) {
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,name_en.ilike.%${search}%,name_cn.ilike.%${search}%,name_ru.ilike.%${search}%`,
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
    const toTranslate = areas.filter(
      (a) =>
        !a.name_en ||
        !a.name_cn ||
        !a.name_ru ||
        a.name_en === a.name ||
        a.name_cn === a.name ||
        a.name_ru === a.name,
    );

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
    const modelName = aiConfig.blog_generator_model || "gemini-2.0-flash";

    const prompt = `
      Translate location names in Thailand from Thai to English, Chinese, and Russian.
      Names: ${JSON.stringify(limitedItems.map((a) => ({ id: a.id, name: a.name })))}
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

    // Filter out items that are missing essential fields
    const validUpdates: PopularAreaUpdate[] = (
        translatedData as { id: string; name_en?: string; name_cn?: string; name_ru?: string }[]
      )
      .filter(
        (item: { id: string; name_en?: string; name_cn?: string; name_ru?: string }) =>
          item.id && (item.name_en || item.name_cn || item.name_ru),
      )
      .map((item: { id: string; name_en?: string; name_cn?: string; name_ru?: string }) => ({
        id: item.id,
        name_en: (item.name_en || "").trim() || null,
        name_cn: (item.name_cn || "").trim() || null,
        name_ru: (item.name_ru || "").trim() || null,
      }));

    if (validUpdates.length === 0) {
      return {
        success: false,
        message: "ไม่สามารถแปลงข้อมูลที่ได้จาก AI เข้าสู่รูปแบบที่ถูกต้องได้",
      };
    }

    const { error: upsertErr } = await supabase
      .from("popular_areas")
      .upsert(validUpdates as any);
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
        entity: "popular_areas",
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
