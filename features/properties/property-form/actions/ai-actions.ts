"use server";

import { generateText } from "@/lib/ai/gemini";
import { PropertyFormValues } from "../../schema";
import { createClient } from "@/lib/supabase/server";

export async function generateAIPropertyDescriptionAction(
  values: PropertyFormValues,
  currentDescription?: string,
) {
  // 1. Fetch feature names if needed
  let featureNames: string[] = [];
  if (values.feature_ids && values.feature_ids.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("features")
      .select("name")
      .in("id", values.feature_ids);
    featureNames = data?.map((f) => f.name) || [];
  }

  // 2. Build prompt
  const baseData = `
    ข้อมูลทรัพย์สินมีดังนี้:
    - หัวข้อ: ${values.title}
    - ประเภท: ${values.property_type}
    - ประกาศสำหรับ: ${values.listing_type}
    - ราคาขาย: ${values.original_price || "ไม่ระบุ"}
    - ค่าเช่า: ${values.original_rental_price || "ไม่ระบุ"}
    - ขนาดพื้นที่: ${values.size_sqm} ตร.ม. / เนื้อที่: ${
      values.land_size_sqwah || "ไม่ระบุ"
    } ตร.ว.
    - ห้องนอน: ${values.bedrooms} / ห้องน้ำ: ${values.bathrooms}
    - ชั้น: ${values.floor || "ไม่ระบุ"}
    - ทำเล: ${values.district}, ${values.province} (${values.subdistrict || ""})
    - สถานีรถไฟฟ้าใกล้เคียง: ${values.transit_station_name || "ไม่ระบุ"} (${
      values.transit_distance_meters || ""
    } เมตร)
    - จุดเด่นเพิ่มเติม: 
      - รีโนเวทใหม่: ${values.is_renovated ? "ใช่" : "ไม่ใช่"}
      - เลี้ยงสัตว์ได้: ${values.is_pet_friendly ? "ใช่" : "ไม่ใช่"}
      - โควต้าต่างชาติ: ${values.is_foreigner_quota ? "ใช่" : "ไม่ใช่"}
      - ห้องมุม: ${values.is_corner_unit ? "ใช่" : "ไม่ใช่"}
      - วิว: ${values.has_city_view ? "เมือง, " : ""}${
        values.has_pool_view ? "สระว่ายน้ำ, " : ""
      }${values.has_garden_view ? "สวน" : ""}
    - สิ่งอำนวยความสะดวก: ${featureNames.join(", ")}
  `;

  const prompt = currentDescription
    ? `
    คุณเป็นนักเขียนคำโฆษณาอสังหาริมทรัพย์มืออาชีพ
    ช่วยปรับปรุงคำบรรยายอสังหาริมทรัพย์ด้านล่างนี้ให้ดูพรีเมียม น่าสนใจ และเป็นมืออาชีพยิ่งขึ้น 
    โดยคงเนื้อหาสำคัญเดิมไว้และเสริมจุดเด่นจากข้อมูลที่มีให้

    คำบรรยายเดิม:
    ${currentDescription}

    ${baseData}

    คำแนะนำในการเขียน:
    1. ใช้ภาษาไทยที่เป็นทางการและกึ่งทางการที่ฟังดูพรีเมียม
    2. จัดรูปแบบข้อความโดยใช้ HTML Tags ดังนี้: <h2>, <p>, <ul>, <li>, <strong>
    3. ใส่ Emoji เพื่อเพิ่มความสวยงาม
    4. ไม่ต้องใส่ส่วนข้อมูลติดต่อ
    5. ส่งกลับเฉพาะรหัส HTML เท่านั้น ไม่ต้องมี Markdown code blocks (ไม่ต้องมี \`\`\`html)
    `
    : `
    คุณเป็นนักเขียนคำโฆษณาอสังหาริมทรัพย์มืออาชีพ 
    หน้าที่ของคุณคือเขียน "คำบรรยายอสังหาริมทรัพย์" ให้ดูน่าสนใจ พรีเมียม และเร้าอารมณ์ผู้ซื้อ/ผู้เช่า 

    ${baseData}

    คำแนะนำในการเขียน:
    1. ใช้ภาษาไทยที่เป็นทางการและกึ่งทางการที่ฟังดูพรีเมียม
    2. จัดรูปแบบข้อความโดยใช้ HTML Tags ดังนี้: <h2>, <p>, <ul>, <li>, <strong>
    3. แบ่งเป็นหัวข้อชัดเจน เช่น ✨ จุดเด่นห้ามพลาด, 🏠 รายละเอียดทรัพย์สิน, 📍 ทำเลที่ตั้งและการเดินทาง
    4. ใส่ Emoji เพื่อเพิ่มความสวยงาม
    5. ไม่ต้องใส่ส่วนข้อมูลติดต่อ
    6. ส่งกลับเฉพาะรหัส HTML เท่านั้น ไม่ต้องมี Markdown code blocks (ไม่ต้องมี \`\`\`html)
  `;

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model;

    const response = await generateText(prompt, modelName);

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "description_generator",
      status: "success",
    });

    // Cleanup simple AI artifacts if any
    return response
      .trim()
      .replace(/^```html/, "")
      .replace(/```$/, "");
  } catch (error: any) {
    console.error("AI Generation Error:", error);

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model;

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName || "unknown",
      feature: "description_generator",
      status: "error",
      errorMessage: error.message,
    });
    throw new Error("ไม่สามารถสร้างคำบรรยายด้วย AI ได้ในขณะนี้");
  }
}

export async function translatePlaceNameAction(text: string) {
  if (!text) return { name_en: "", name_cn: "" };
  const results = await translatePlaceNamesAction([text]);
  return results[0] || { name_en: "", name_cn: "" };
}

export async function translatePlaceNamesAction(texts: string[]) {
  const filteredTexts = texts.map((t) => t?.trim()).filter(Boolean);
  if (filteredTexts.length === 0)
    return texts.map(() => ({ name_en: "", name_cn: "" }));

  const prompt = `
    Translate the following list of Thai place/station names to English and Simplified Chinese.
    Inputs:
    ${filteredTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
    
    Return ONLY a valid JSON array of objects with keys "en" and "cn".
    Example: [{"en": "Central World", "cn": "中央世界"}, ...]
    Do not add markdown code blocks.
  `;

  try {
    const response = await generateText(prompt);
    const cleaned = response
      .trim()
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "");
    const json = JSON.parse(cleaned);

    // Map back to guarantee order and length matching input texts
    let jsonIdx = 0;
    return texts.map((t) => {
      if (!t?.trim()) return { name_en: "", name_cn: "" };
      const item = json[jsonIdx++];
      return {
        name_en: item?.en || "",
        name_cn: item?.cn || "",
      };
    });
  } catch (error) {
    console.error("AI Batch Translation Error:", error);
    return texts.map(() => ({ name_en: "", name_cn: "" }));
  }
}
