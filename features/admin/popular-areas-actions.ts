"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini";
import { popularAreaSchema } from "./popular-areas-validation";
import { mapDbError } from "@/lib/db-error";
import { Database } from "@/lib/database.types";

type PopularAreaInsert = Database["public"]["Tables"]["popular_areas"]["Insert"];
type PopularAreaUpdate = Database["public"]["Tables"]["popular_areas"]["Update"];

/**
 * Get popular areas with optional search and pagination (Server-side)
 */
export async function getPopularAreas({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("popular_areas")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,name_cn.ilike.%${search}%`);
    }

    const { data: areas, count, error } = await query
      .order("sort_order", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Get property counts efficiently for the returned areas using the new RPC
    if (areas && areas.length > 0) {
      const areaNames = areas.map((a) => a.name);
      
      const { data: counts, error: countErr } = await (supabase.rpc as any)(
        "get_property_counts_by_area",
        { area_names: areaNames }
      );

      if (!countErr && Array.isArray(counts)) {
        const countMap = new Map();
        counts.forEach((c: any) => {
          if (c.area_name) {
            countMap.set(c.area_name, Number(c.property_count) || 0);
          }
        });
        
        areas.forEach((area) => {
          (area as any).property_count = countMap.get(area.name) || 0;
        });
      }
    }

    return {
      success: true,
      data: areas || [],
      totalCount: count || 0,
    };
  } catch (error: any) {
    console.error("getPopularAreas error:", error);
    return { success: false, message: mapDbError(error), data: [], totalCount: 0 };
  }
}

/**
 * Create a new popular area
 */
export async function createPopularArea(values: z.infer<typeof popularAreaSchema>) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

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

    const { error } = await supabase.from("popular_areas").insert(insertData);
    if (error) throw error;

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: "สร้างทำเลยอดนิยมสำเร็จ" };
  } catch (error: any) {
    console.error("createPopularArea error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Update popular area
 */
export async function updatePopularArea(id: string, values: z.infer<typeof popularAreaSchema>) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const parsed = popularAreaSchema.parse(values);
    const supabase = await createClient();

    const updateData: PopularAreaUpdate = parsed;

    const { error } = await supabase
      .from("popular_areas")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: "อัปเดตข้อมูลสำเร็จ" };
  } catch (error: any) {
    console.error("updatePopularArea error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Delete popular area
 */
export async function deletePopularArea(id: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("popular_areas").delete().eq("id", id);
    if (error) throw error;

    await resequencePopularAreas();

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: "ลบทำเลสำเร็จ" };
  } catch (error: any) {
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

    const updates: PopularAreaUpdate[] = areas.map((area, index) => ({
      id: area.id,
      sort_order: index + 1,
    }));

    const { error } = await supabase
      .from("popular_areas")
      .upsert(updates as any);

    if (error) throw error;
  } catch (error) {
    console.error("resequencePopularAreas error:", error);
  }
}

/**
 * Reorder popular areas (DnD Support) with explicit types
 */
export async function reorderPopularAreasAction(ids: string[], offset: number = 0) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();

    const updates: PopularAreaUpdate[] = ids.map((id, index) => ({
      id,
      sort_order: offset + index + 1,
    }));

    const { error } = await supabase
      .from("popular_areas")
      .upsert(updates as any);

    if (error) throw error;

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: "ปรับลำดับทำเลสำเร็จ" };
  } catch (error: any) {
    console.error("reorderPopularAreasAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Upload thumbnail for popular area
 */
export async function uploadPopularAreaImageAction(formData: FormData) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" };

    const { uploadSiteAsset } = await import("@/features/site-settings/storage");
    const result = await uploadSiteAsset(file, file.name, file.type, "popular-areas");

    return result;
  } catch (error: any) {
    console.error("uploadPopularAreaImageAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

/**
 * Bulk translation action with AI Protection & Robust Guarding
 */
export async function bulkTranslatePopularAreasAction(selectedIds?: string[]) {
  const { role } = await requireAuthContext();
  assertStaff(role);

  try {
    const supabase = await createClient();
    let query = supabase.from("popular_areas").select("*");
    
    if (selectedIds && selectedIds.length > 0) {
      query = query.in("id", selectedIds);
    }

    const { data: areas, error } = await query;
    if (error) throw error;
    if (!areas || areas.length === 0) return { success: true, message: "ไม่มีข้อมูลให้แปล" };

    const toTranslate = areas.filter(
      (a) => !a.name_en || !a.name_cn || a.name_en === a.name || a.name_cn === a.name,
    );

    if (toTranslate.length === 0) return { success: true, message: "ข้อมูลทุกรายการมีคำแปลแล้ว" };

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.blog_generator_model || "gemini-2.0-flash";

    const prompt = `
      Translate location names in Thailand from Thai to English and Chinese.
      Names: ${JSON.stringify(toTranslate.map((a) => ({ id: a.id, name: a.name })))}
      Return strict JSON Array of objects: [{ "id": "uuid", "name_en": "...", "name_cn": "..." }]
      Do not include any markers or explanation.
    `;

    const result = await generateText(prompt, modelName);
    
    // Robust JSON Guarding
    let translatedData: any[] = [];
    try {
      const jsonStr = result.text.replace(/```json|```/g, "").trim();
      translatedData = JSON.parse(jsonStr);
      
      if (!Array.isArray(translatedData)) {
        throw new Error("AI returned invalid data format (not an array)");
      }
    } catch (parseErr) {
      console.error("AI Translation Parse Error:", parseErr, "Raw output:", result.text);
      return { success: false, message: "AI คืนค่าข้อมูลในรูปแบบที่อ่านไม่ได้ กรุณาลองใหม่อีกครั้ง" };
    }

    // Filter out items that are missing essential fields
    const validUpdates: PopularAreaUpdate[] = translatedData
      .filter(item => item.id && (item.name_en || item.name_cn))
      .map(item => ({
        id: item.id,
        name_en: item.name_en || null,
        name_cn: item.name_cn || null
      }));

    if (validUpdates.length === 0) {
      return { success: false, message: "ไม่สามารถแปลงข้อมูลที่ได้จาก AI เข้าสู่รูปแบบที่ถูกต้องได้" };
    }

    const { error: upsertErr } = await supabase.from("popular_areas").upsert(validUpdates as any);
    if (upsertErr) throw upsertErr;

    await logAiUsage({ model: modelName, feature: "popular_areas_translator", status: "success" });

    revalidatePath("/protected/admin/popular-areas");
    return { success: true, message: `แปลภาษาสำเร็จ ${validUpdates.length} รายการ` };
  } catch (error: any) {
    console.error("Bulk Translate Error:", error);
    return { success: false, message: mapDbError(error) };
  }
}
