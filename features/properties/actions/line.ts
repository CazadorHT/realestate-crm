"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { broadcastLineMessage } from "@/lib/line";
import { buildSocialPostFlex, LOCATION_MAP, BotLang } from "@/lib/line-flex-builders";
import { revalidatePath } from "next/cache";
import { SocialProperty, getPropertySocialContent, renderPropertySocialTemplate } from "./social";
import { translateTextAction } from "@/lib/ai/translation-actions";
import { getProvinceName } from "@/lib/utils/provinces";

/**
 * แชร์ข้อมูลทรัพย์ไปยัง Line (Broadcast ไปยังทุกคน)
 */
export async function postPropertyToLineAction(
  propertyId: string,
  customMessage?: string,
  lang: "th" | "en" | "cn" = "th",
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. ดึงข้อมูลทรัพย์ พร้อมรูปภาพ
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(`
        *,
        property_images (
          image_url,
          is_cover,
          sort_order
        )
      `)
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    // 2. Preparing localized location if needed (AI Fallback)
    const p = property as unknown as SocialProperty;
    if (lang !== "th") {
      const provinceTr = p.province ? getProvinceName(p.province, lang) : "";
      
      const hasDistrictTr = p.district && (p[`district_${lang}`] || (LOCATION_MAP as any)[p.district]);
      const hasProvinceTr = p.province && (p[`province_${lang}`] || (provinceTr && provinceTr !== p.province));

      if (!hasDistrictTr || !hasProvinceTr) {
        try {
          const districtToTranslate = !hasDistrictTr ? p.district : "";
          const provinceToTranslate = !hasProvinceTr && !provinceTr ? p.province : "";
          
          const toTranslate = [districtToTranslate, provinceToTranslate].filter(Boolean).join(", ");
          if (toTranslate) {
            const tr = await translateTextAction(toTranslate);
            if (lang === "en") {
              if (districtToTranslate) p.district_en = tr.en;
            } else if (lang === "cn") {
              if (districtToTranslate) p.district_cn = tr.cn;
            }
          }
        } catch (e) {
          console.error("AI Location Translation failed:", e);
        }
      }
    }

    // 3. เตรียมรูปภาพและเนื้อหา (ใช้ Line Template เฉพาะ)
    const contentData = await getPropertySocialContent(propertyId, lang, "LINE");
    const images = contentData.images;

    // หากมีการแก้ไขข้อความ (customMessage) ให้ลอง Render Tags ใหม่
    const finalContent = customMessage 
      ? await renderPropertySocialTemplate(customMessage, p, lang)
      : contentData.content;

    // 3. สร้าง Flex Message
    const flexMessage = buildSocialPostFlex(
      property as any, // buildSocialPostFlex still takes any in some places, but we cast here to be explicit
      images,
      finalContent,
      lang as BotLang
    );

    // 4. ส่ง Broadcast ไปยังทุกคน
    const broadcastRes = await broadcastLineMessage(flexMessage);

    if (!broadcastRes.success) {
      return { 
        success: false, 
        message: `Line Error: ${broadcastRes.message || "ไม่สามารถบรอดแคสต์ได้"}` 
      };
    }

    // 5. บันทึก Timestamp
    await supabase
      .from("properties")
      .update({ posted_to_line_at: new Date().toISOString() })
      .eq("id", propertyId);

    revalidatePath("/(protected)/protected/properties", "page");

    return { success: true, message: "บรอดแคสต์ลง Line เรียบร้อย" };
  } catch (err) {
    console.error("postPropertyToLineAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการแชร์ลง Line" };
  }
}
