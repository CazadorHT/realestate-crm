"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { logAiUsage } from "@/features/ai-monitor/actions";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  name_en: z.string().optional(),
  name_cn: z.string().optional(),
});

export async function getPopularAreasAction() {
  const supabase = await createClient();

  // 1. Fetch popular areas
  const { data: areas, error: areasErr } = await supabase
    .from("popular_areas")
    .select("*")
    .order("name", { ascending: true });

  if (areasErr) throw areasErr;

  // 2. Fetch property counts
  // We match by area name string
  const { data: props, error: propsErr } = await supabase
    .from("properties")
    .select("popular_area")
    .is("deleted_at", null);

  if (propsErr) throw propsErr;

  // Aggregate counts
  const countMap = new Map<string, number>();
  props?.forEach((p) => {
    if (p.popular_area) {
      countMap.set(p.popular_area, (countMap.get(p.popular_area) || 0) + 1);
    }
  });

  return (areas || []).map((area) => ({
    ...area,
    property_count: countMap.get(area.name) || 0,
  }));
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

export async function bulkTranslatePopularAreasAction() {
  const { role } = await requireAuthContext();
  assertStaff(role);

  try {
    const supabase = await createClient();
    const { data: areas, error } = await supabase
      .from("popular_areas")
      .select("*");

    if (error) throw error;
    if (!areas || areas.length === 0)
      return { success: true, message: "No areas to translate" };

    // Filter areas that need translation
    // Need translation if name_en or name_cn is missing OR if they match Thai name (often a placeholder)
    const toTranslate = areas.filter(
      (a) =>
        !a.name_en ||
        !a.name_cn ||
        a.name_en === a.name ||
        a.name_cn === a.name,
    );

    if (toTranslate.length === 0) {
      return { success: true, message: "ข้อมูลทุกรายการมีคำแปลแล้ว" };
    }

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.blog_generator_model || "gemini-2.0-flash";

    const prompt = `
      คุณเป็นผู้เชี่ยวชาญด้านภาษาไทย ภาษาอังกฤษ และภาษาจีน และเป็นผู้เชี่ยวชาญด้านอสังหาริมทรัพย์
      หน้าที่ของคุณคือแปล "ชื่อทำเล/ย่าน" ในกรุงเทพฯ และประเทศไทยจากภาษาไทยเป็นภาษาอังกฤษและภาษาจีน
      
      กติกา:
      1. แปลให้เป็นธรรมชาติและเป็นที่นิยมเรียก (Commonly used names)
      2. คืนผลลัพธ์เป็น JSON Array ของ Object เท่านั้น
      3. ห้ามแปลผิดเพี้ยน หรือแปลตรงตัวเกินไปหากมีชื่อเฉพาะ
      
      ข้อมูลที่ต้องแปล:
      ${JSON.stringify(toTranslate.map((a) => ({ id: a.id, name: a.name })))}
      
      รูปแบบที่ต้องการ:
      [
        { "id": "uuid", "name_en": "English Name", "name_cn": "Chinese Name" },
        ...
      ]
    `;

    const result = await generateText(prompt, modelName);
    const jsonStr = result.text.replace(/```json|```/g, "").trim();
    const translatedData = JSON.parse(jsonStr);

    if (!Array.isArray(translatedData))
      throw new Error("Invalid AI response format");

    // Bulk update (Supabase update doesn't support bulk with different values easily without upsert)
    // We will do it in parallel or a loop since it's admin side and usually small scale
    const updates = translatedData.map(async (item: any) => {
      return supabase
        .from("popular_areas")
        .update({
          name_en: item.name_en,
          name_cn: item.name_cn,
        })
        .eq("id", item.id);
    });

    await Promise.all(updates);

    await logAiUsage({
      model: modelName,
      feature: "popular_areas_translator",
      status: "success",
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
    });

    revalidatePath("/protected/admin/popular-areas");
    return {
      success: true,
      message: `แปลข้อมูลสำเร็จ ${translatedData.length} รายการ`,
    };
  } catch (error: any) {
    console.error("Bulk Translate Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการแปล",
    };
  }
}
