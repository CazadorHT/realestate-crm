"use server";

import { createClient } from "@/lib/supabase/server";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { revalidateTag } from "next/cache";

export interface CheckAreaResult {
  exists: boolean;
  data?: {
    id: string;
    name: { th: string; en?: string; cn?: string; ru?: string };
    province: string;
  };
}

export async function checkPopularAreaExistsAction(
  province: string,
  areaName: string
): Promise<CheckAreaResult> {
  if (!province || !areaName || !areaName.trim()) {
    return { exists: false };
  }

  try {
    const supabase = await createClient();
    const cleanName = areaName.trim();
    const cleanProvince = province.trim();

    const { data } = await supabase
      .from("popular_areas_v3")
      .select("id, name, province")
      .eq("province", cleanProvince)
      .or(`name->>th.ilike.%${cleanName}%,name->>default.ilike.%${cleanName}%,name->>en.ilike.%${cleanName}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      return { exists: true, data: data as any };
    }

    return { exists: false };
  } catch (err) {
    console.error("checkPopularAreaExistsAction error:", err);
    return { exists: false };
  }
}

export async function translateAreaNameAction(nameTh: string) {
  if (!nameTh || !nameTh.trim()) {
    return { en: "", cn: "", ru: "" };
  }

  try {
    const res = await translateTextAction(nameTh.trim(), "plain");
    return {
      en: res.en || "",
      cn: res.cn || "",
      ru: res.ru || "",
    };
  } catch (err) {
    console.error("translateAreaNameAction error:", err);
    return { en: "", cn: "", ru: "" };
  }
}

export async function savePopularAreaAction(data: {
  province: string;
  nameTh: string;
  nameEn: string;
  nameCn: string;
  nameRu: string;
  imageUrl?: string;
}) {
  try {
    const supabase = await createClient();
    const { province, nameTh, nameEn, nameCn, nameRu, imageUrl } = data;

    if (!nameTh || !nameTh.trim() || !province) {
      return { success: false, error: "กรุณาระบุชื่อทำเลและจังหวัดให้ครบถ้วน" };
    }

    const cleanTh = nameTh.trim();
    const cleanEn = (nameEn || "").trim();
    const cleanCn = (nameCn || "").trim();
    const cleanRu = (nameRu || "").trim();

    // Generate URL slug
    const slugBase = cleanEn || cleanTh;
    const slug = slugBase
      .toLowerCase()
      .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const namePayload = {
      th: cleanTh,
      en: cleanEn || cleanTh,
      cn: cleanCn || cleanTh,
      ru: cleanRu || cleanTh,
      default: cleanTh,
    };

    const { data: inserted, error } = await supabase
      .from("popular_areas_v3")
      .upsert(
        {
          name: namePayload,
          province: province.trim(),
          slug: slug || encodeURIComponent(cleanTh),
          image_url: imageUrl || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (error) throw error;

    // Purge cache tags so UI updates instantly
    try {
      revalidateTag("popular-areas", "seconds");
      revalidateTag("public-data", "seconds");
    } catch (_) {}

    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("savePopularAreaAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการบันทึกย่าน" };
  }
}
