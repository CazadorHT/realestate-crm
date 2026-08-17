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
    featureNames = data?.map((f: { name: string }) => f.name) || [];
  }

  // 2. Build prompt
  const baseData = `
    ข้อมูลทรัพย์สินมีดังนี้:
    - หัวข้อ: ${values.title}
    - ประเภท: ${values.property_type}
    - ประกาศสำหรับ: ${values.listing_type}
    - ราคาขายจริง (สุทธิ/ลดแล้ว): ${values.price || "ไม่ระบุ"}
    - ราคาขายตั้งต้น (ก่อนลด): ${values.original_price || "ไม่ระบุ"}
    - ค่าเช่าจริง (สุทธิ/ลดแล้ว): ${values.rental_price || "ไม่ระบุ"}
    - ค่าเช่าตั้งต้น (ก่อนลด): ${values.original_rental_price || "ไม่ระบุ"}
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
    6. เรื่องราคา: หากมีราคาขายจริง/ค่าเช่าจริงที่ลดแล้ว (สุทธิ) ให้แสดงราคาลดนั้นเป็นราคาหลัก และหากราคาตั้งต้นเดิมสูงกว่า ให้เขียนแสดงโปรโมชั่นลดราคาพิเศษเพื่อดึงดูดความสนใจ (ห้ามนำราคาเดิมมาเป็นราคาหลักเด็ดขาด)
    `
    : `
    คุณเป็นนักเขียนคำโฆษณาอสังหาริมทรัพย์มืออาชีพ 
    หน้าที่ของคุณคือเขียน "คำบรรยายอสังหาริมทรัพย์" ให้ดูน่าสนใจ พรีเมียม และเร้าอารมณ์ผู้ซื้อ/ผู้เช่า 

    ${baseData}

    คำแนะนำในการเขียน:
    1. ใช้ภาษาไทยที่เป็นทางการและกึ่งทางการที่ฟังดูพรีเมียม
    2. จัดรูปแบบข้อความโดยใช้ HTML Tags เท่านั้น ดังนี้: <h2>, <p>, <ul>, <li>, <strong> (ห้ามใช้ Markdown Syntax เช่น ** หรือ * เด็ดขาด ให้ใช้ HTML Tags ให้ถูกต้อง)
    3. แบ่งเป็นหัวข้อชัดเจน เช่น ✨ จุดเด่นห้ามพลาด, 🏠 รายละเอียดทรัพย์สิน, 📍 ทำเลที่ตั้งและการเดินทาง
    4. ใส่ Emoji เพื่อเพิ่มความสวยงาม
    5. ไม่ต้องใส่ส่วนข้อมูลติดต่อ
    6. ส่งกลับเฉพาะรหัส HTML เท่านั้น ไม่ต้องมี Markdown code blocks (ไม่ต้องมี \`\`\`html)
    7. เรื่องราคา: หากมีราคาขายจริง/ค่าเช่าจริงที่ลดแล้ว (สุทธิ) ให้แสดงราคาลดนั้นเป็นราคาหลัก และหากราคาตั้งต้นเดิมสูงกว่า ให้เขียนแสดงโปรโมชั่นลดราคาพิเศษเพื่อดึงดูดความสนใจ (ห้ามนำราคาเดิมมาเป็นราคาหลักเด็ดขาด)
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
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });

    // Cleanup simple AI artifacts if any
    return response.text
      .trim()
      .replace(/^```html/, "")
      .replace(/```$/, "");
  } catch (error: unknown) {
    console.error("AI Generation Error:", error);

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model;

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName || "unknown",
      feature: "description_generator",
      status: "error",
      errorMessage: (error as Error).message,
    });
    throw new Error("ไม่สามารถสร้างคำบรรยายด้วย AI ได้ในขณะนี้");
  }
}

export async function translatePlaceNameAction(text: string) {
  if (!text) return { name_en: "", name_cn: "", name_ru: "" };
  const results = await translatePlaceNamesAction([text]);
  return results[0] || { name_en: "", name_cn: "", name_ru: "" };
}

export async function translatePlaceNamesAction(texts: string[]) {
  const filteredTexts = texts.map((t) => t?.trim()).filter(Boolean);
  if (filteredTexts.length === 0)
    return texts.map(() => ({ name_en: "", name_cn: "", name_ru: "" }));

  const prompt = `
    Translate the following list of Thai place/station names to English, Simplified Chinese, and Russian.
    Inputs:
    ${filteredTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
    
    Return ONLY a valid JSON array of objects with keys "en", "cn", and "ru".
    Example: [{"en": "Central World", "cn": "中央世界", "ru": "Центральный мир"}, ...]
    Do not add markdown code blocks.
  `;

  try {
    const response = await generateText(prompt);
    const cleaned = response.text
      .trim()
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "");
    const parsedJson = JSON.parse(cleaned);
    const json = Array.isArray(parsedJson) ? parsedJson : [];

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: "gemini-flash-lite-latest",
      feature: "property_translator",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });

    // Map back to guarantee order and length matching input texts
    let jsonIdx = 0;
    return texts.map((t) => {
      if (!t?.trim()) return { name_en: "", name_cn: "", name_ru: "" };
      const item = json[jsonIdx++];
      return {
        name_en: item?.en || "",
        name_cn: item?.cn || "",
        name_ru: item?.ru || "",
      };
    });
  } catch (error: unknown) {
    console.error("AI Batch Translation Error:", error);
    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: "gemini-flash-lite-latest",
      feature: "property_translator",
      status: "error",
      errorMessage: (error as Error).message,
    });
    return texts.map(() => ({ name_en: "", name_cn: "", name_ru: "" }));
  }
}

function normalizeTransitType(type: string): string {
  const t = String(type || "").toUpperCase().replace(/\s+/g, "_");
  if (t.includes("BTS")) return "BTS";
  if (t.includes("MRT_PURPLE") || t.includes("PURPLE")) return "MRT_PURPLE";
  if (t.includes("MRT_YELLOW") || t.includes("YELLOW")) return "MRT_YELLOW";
  if (t.includes("MRT_PINK") || t.includes("PINK")) return "MRT_PINK";
  if (t.includes("MRT")) return "MRT";
  if (t.includes("ARL") || t.includes("AIRPORT")) return "ARL";
  if (t.includes("SRT") || t.includes("RED")) return "SRT_RED";
  if (t.includes("GOLD")) return "GOLD";
  if (t.includes("BRT")) return "BRT";
  if (t.includes("EXPRESSWAY")) return "EXPRESSWAY";
  if (t.includes("MAIN_ROAD") || t.includes("ROAD")) return "MAIN_ROAD";
  return "OTHER";
}

function normalizePlaceCategory(category: string): string {
  const c = String(category || "").trim().toLowerCase();
  if (c.includes("airport") || c.includes("flight") || c.includes("สนามบิน")) return "Airport";
  if (c.includes("school") || c.includes("university") || c.includes("education")) return "School";
  if (c.includes("mall") || c.includes("shopping") || c.includes("market") || c.includes("supermarket")) return "Mall";
  if (c.includes("hospital") || c.includes("clinic") || c.includes("medical")) return "Hospital";
  if (c.includes("transport") || c.includes("expressway") || c.includes("highway")) return "Transport";
  if (c.includes("park") || c.includes("garden")) return "Park";
  if (c.includes("office") || c.includes("workplace") || c.includes("building")) return "Office";
  return "Other";
}

export async function getExistingProjectLocationAction(params: {
  projectId?: string;
  addressLine1?: string;
}) {
  const { projectId, addressLine1 } = params;

  if (!projectId && (!addressLine1 || !addressLine1.trim())) {
    return { success: false, data: null };
  }

  try {
    const supabase = await createClient();

    // 1. Check by projectId first
    if (projectId) {
      const { data: props, error: fetchError } = await supabase
        .from("properties_core")
        .select(`
          id,
          updated_at,
          properties_details (
            transit_info
          )
        `)
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!fetchError && props && props.length > 0) {
        for (const prop of props) {
          const transitInfo: any = (prop as any).properties_details?.transit_info;
          if (transitInfo) {
            const transits = transitInfo.transits || [];
            const places = transitInfo.places || [];
            if (transits.length > 0 || places.length > 0) {
              return {
                success: true,
                data: { transits, places },
                source: "project_id",
              };
            }
          }
        }
      }
    }

    // 2. Check by matching project name or addressLine1
    const cleanAddress = (addressLine1 || "").trim();
    if (cleanAddress) {
      const { data: matchedProjects } = await supabase
        .from("projects")
        .select("id")
        .or(`name->>th.ilike.%${cleanAddress}%,name->>en.ilike.%${cleanAddress}%,slug.ilike.%${cleanAddress}%`)
        .limit(5);

      const projectIds = (matchedProjects || []).map((p: any) => p.id);

      if (projectIds.length > 0) {
        const { data: propsByProj } = await supabase
          .from("properties_core")
          .select(`
            id,
            updated_at,
            properties_details (
              transit_info
            )
          `)
          .in("project_id", projectIds)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(10);

        if (propsByProj && propsByProj.length > 0) {
          for (const prop of propsByProj) {
            const transitInfo: any = (prop as any).properties_details?.transit_info;
            if (transitInfo) {
              const transits = transitInfo.transits || [];
              const places = transitInfo.places || [];
              if (transits.length > 0 || places.length > 0) {
                return {
                  success: true,
                  data: { transits, places },
                  source: "project_name",
                };
              }
            }
          }
        }
      }
    }

    return { success: false, data: null };
  } catch (e) {
    console.error("Failed to check existing project transit cache:", e);
    return { success: false, data: null };
  }
}

async function resolveShortGoogleMapsUrl(url: string): Promise<string> {
  if (!url || !url.startsWith("http")) return url;
  if (
    url.includes("goo.gl") ||
    url.includes("maps.app.goo.gl") ||
    url.includes("share.google")
  ) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
      });
      return res.url || url;
    } catch {
      return url;
    }
  }
  return url;
}

export async function suggestNearbyPlacesAndTransitAction(params: {
  title?: string;
  addressLine1?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  googleMapsLink?: string;
  projectId?: string;
}) {
  const { title = "", addressLine1 = "", subdistrict = "", district = "", province = "", googleMapsLink = "", projectId } = params;

  if (!province && !district && !addressLine1 && !googleMapsLink) {
    throw new Error("กรุณากรอกข้อมูลที่ตั้ง จังหวัด หรือลิงก์แผนที่ก่อนดำเนินการ");
  }

  // 1. If Google Maps link is provided, resolve any shortened URL to reveal real coordinates/place names
  let resolvedMapUrl = googleMapsLink ? googleMapsLink.trim() : "";
  let extractedMapQuery = "";
  if (resolvedMapUrl) {
    try {
      resolvedMapUrl = await resolveShortGoogleMapsUrl(resolvedMapUrl);
      const placeMatch = resolvedMapUrl.match(/\/place\/([^\/@]+)/);
      const coordMatch = resolvedMapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      
      const parts: string[] = [];
      if (placeMatch && placeMatch[1]) {
        parts.push(`Place Name: "${decodeURIComponent(placeMatch[1]).replace(/\+/g, " ")}"`);
      }
      if (coordMatch) {
        parts.push(`Coordinates: [Latitude: ${coordMatch[1]}, Longitude: ${coordMatch[2]}]`);
      }
      if (parts.length > 0) {
        extractedMapQuery = parts.join(" | ");
      }
    } catch (e) {
      console.warn("Error parsing google maps url:", e);
    }
  }

  // 2. Check if we can reuse transit/nearby places from a project ID
  if (projectId) {
    const existingLoc = await getExistingProjectLocationAction({ projectId });
    if (existingLoc.success && existingLoc.data) {
      const { transits = [], places = [] } = existingLoc.data;
      if (transits.length > 0 || places.length > 0) {
        return {
          success: true,
          data: {
            transits,
            places,
          },
          cached: true,
        };
      }
    }
  }

  const prompt = `
You are an expert real estate location assistant with live web search. Find the exact nearest transit stations and key nearby places for the property in Thailand.

SEARCH STRATEGY (DUAL CROSS-REFERENCE):
1. Combine BOTH the Google Maps pinpoint/link AND the Project Name / Address:
   - Google Maps Info: ${resolvedMapUrl || "Not provided"} ${extractedMapQuery ? `[${extractedMapQuery}]` : ""}
   - Project Name / Address: ${addressLine1 || "Not provided"}
   - Sub-district (แขวง/ตำบล): ${subdistrict || "Not provided"}
   - District (เขต/อำเภอ): ${district || "Not provided"}
   - Province (จังหวัด): ${province || "Not provided"}
   - Property Title: ${title || "Not provided"}

2. Cross-reference the Google Maps coordinates/place with the Project Name to confirm the exact residential condominium/housing project location in Bangkok/Thailand. If there is a slight discrepancy, use the Google Maps pin as the ground truth coordinate while honoring the project's real context.

Instructions:
1. Accurately pinpoint the project entrance/location by combining Google Maps and Project Name.
2. Find the nearest transit stations (BTS, MRT, ARL, BRT, SRT Red Line, Gold Line, etc.). Limit to at most 3 stations closest to this pinpoint. For each station:
   - type: must be one of ["BTS", "MRT", "MRT_PURPLE", "MRT_YELLOW", "MRT_PINK", "ARL", "SRT_RED", "GOLD", "BRT", "OTHER"]
   - station_name: in Thai (e.g. "อโศก", "ห้วยขวาง", "เตาปูน")
   - distance_meters: real distance in meters (e.g. 350)
   - time: estimated walking/travel time in minutes (e.g. "4")
   - station_name_en: English name (e.g. "Asok")
   - station_name_cn: Chinese name
   - station_name_ru: Russian name

3. Find nearby landmark places (Shopping Malls, Hospitals, International Schools, Supermarkets, Parks, Airports). Limit to at most 5 places closest to this pinpoint. For each place:
   - category: must be one of ["School", "Mall", "Hospital", "Airport", "Transport", "Park", "Office", "Other"]
   - name: in Thai (e.g. "เอ็มควอเทียร์", "โรงพยาบาลสมิติเวช สุขุมวิท")
   - distance_meters: real distance in meters (e.g. 1200)
   - time: estimated time in minutes (e.g. "5")
   - name_en: English name
   - name_cn: Chinese name
   - name_ru: Russian name

Return ONLY a valid JSON object with the following structure (no markdown, no backticks):
{
  "transits": [
    {
      "type": "BTS",
      "station_name": "...",
      "distance_meters": 400,
      "time": "5",
      "station_name_en": "...",
      "station_name_cn": "...",
      "station_name_ru": "..."
    }
  ],
  "places": [
    {
      "category": "Mall",
      "name": "...",
      "distance_meters": 1200,
      "time": "5",
      "name_en": "...",
      "name_cn": "...",
      "name_ru": "..."
    }
  ]
}
`;

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-1.5-flash";

    const response = await generateText(prompt, modelName, 0, {
      useSearch: true,
      responseMimeType: "application/json",
    });

    const cleaned = response.text
      .trim()
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "");
    const result = JSON.parse(cleaned);

    const transits = (result.transits || []).map((t: any) => ({
      type: normalizeTransitType(t.type || "BTS"),
      station_name: String(t.station_name || "").trim(),
      distance_meters: t.distance_meters ? parseInt(String(t.distance_meters).replace(/[^0-9]/g, ""), 10) : undefined,
      time: t.time ? String(t.time).replace(/[^0-9]/g, "") : "",
      station_name_en: String(t.station_name_en || "").trim(),
      station_name_cn: String(t.station_name_cn || "").trim(),
      station_name_ru: String(t.station_name_ru || "").trim(),
    }));

    const places = (result.places || []).map((p: any) => ({
      category: normalizePlaceCategory(p.category || "Other"),
      name: String(p.name || "").trim(),
      distance_meters: p.distance_meters ? parseInt(String(p.distance_meters).replace(/[^0-9]/g, ""), 10) : undefined,
      time: p.time ? String(p.time).replace(/[^0-9]/g, "") : "",
      name_en: String(p.name_en || "").trim(),
      name_cn: String(p.name_cn || "").trim(),
      name_ru: String(p.name_ru || "").trim(),
    }));

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "nearby_search",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });

    return { success: true, data: { transits, places } };
  } catch (error: unknown) {
    console.error("AI Search Nearby/Transit Error:", error);
    
    let modelName = "unknown";
    try {
      const { getAiModelConfig } = await import("@/features/ai-settings/actions");
      const aiConfig = await getAiModelConfig();
      modelName = aiConfig.description_model || "gemini-1.5-flash";
    } catch (_) {}

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "nearby_search",
      status: "error",
      errorMessage: (error as Error).message,
    });
    return { success: false, error: (error as Error).message || "ไม่สามารถดึงข้อมูลทำเลด้วย AI ได้" };
  }
}

export async function sortPropertyImagesAction(storagePaths: string[]): Promise<{
  success: boolean;
  sortedPaths?: string[];
  message?: string;
}> {
  try {
    if (storagePaths.length < 2) {
      return { success: true, sortedPaths: storagePaths };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { PROPERTY_IMAGES_BUCKET } = await import("@/features/properties/logic/images");
    
    const adminSupabase = createAdminClient();
    const contentParts: any[] = [];

    const promptText = `You are a professional real estate agent assistant.
Your task is to sort the provided real estate images in a professional presentation order:
1. Cover/Hero Image: A beautiful main shot (stunning living room, main view, or building exterior).
2. Living room / Lounge.
3. Dining area & Kitchen.
4. Bedrooms (from master bedroom to smaller bedrooms).
5. Bathrooms.
6. Facilities / Balcony / Building common areas (swimming pool, gym, lobby).
7. Floor plans (should always be at the very end).

I will provide you with several images, labeled sequentially.
Please analyze the images and return a JSON array containing the sorted 0-based indices in the professional order.
For example, if you receive 3 images and the best order is: Image 2 first, then Image 0, then Image 1, you must return: [2, 0, 1].

Return ONLY the sorted index array of numbers. The output format MUST be a valid JSON array of numbers of the same length as the input, containing each index exactly once. Example: [2, 0, 1]`;

    contentParts.push(promptText);

    // Download each image and append it as multimodal base64 content
    for (let i = 0; i < storagePaths.length; i++) {
      const path = storagePaths[i];
      const { data: fileData, error } = await adminSupabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .download(path);

      if (error || !fileData) {
        throw new Error(`Failed to download image from storage: ${path}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      contentParts.push(`Image ${i}:`);
      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: fileData.type || "image/jpeg"
        }
      });
    }

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-1.5-flash";

    const response = await generateText(contentParts, modelName, 0, {
      responseMimeType: "application/json"
    });

    // Helper to extract sorting indices from various possible AI output formats
    const parseSortingIndices = (text: string, length: number): number[] | null => {
      const cleaned = text
        .trim()
        .replace(/^```json/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // Fallback: extract anything that looks like an array of numbers
        const arrayMatch = cleaned.match(/\[\s*(\d+\s*,\s*)*\d+\s*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch (_) {
            return null;
          }
        } else {
          return null;
        }
      }

      // Handle double-encoded string
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (_) {}
      }

      let candidates: any[] = [];
      if (Array.isArray(parsed)) {
        candidates = parsed;
      } else if (parsed && typeof parsed === "object") {
        // Look for common keys containing arrays
        const possibleKeys = ["sorted_indices", "sortedIndices", "indices", "order", "sortedPaths", "paths", "result", "array"];
        for (const key of possibleKeys) {
          if (Array.isArray(parsed[key])) {
            candidates = parsed[key];
            break;
          }
        }
        // Fallback: search for first array of correct length
        if (candidates.length === 0) {
          for (const key in parsed) {
            if (Array.isArray(parsed[key]) && parsed[key].length === length) {
              candidates = parsed[key];
              break;
            }
          }
        }
      }

      if (candidates.length === length) {
        const indices = candidates.map(item => typeof item === "string" ? parseInt(item, 10) : item);
        const isValid = indices.every(idx => typeof idx === "number" && !isNaN(idx) && idx >= 0 && idx < length)
                        && new Set(indices).size === length;
        if (isValid) {
          return indices;
        }
      }

      return null;
    };

    const parsedIndices = parseSortingIndices(response.text, storagePaths.length);

    if (parsedIndices) {
      const sortedPaths = parsedIndices.map(idx => storagePaths[idx]);

      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: modelName,
        feature: "image_sorting",
        status: "success",
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      });

      return { success: true, sortedPaths };
    }

    throw new Error("Invalid sorting index structure returned by AI");
  } catch (error: any) {
    console.error("AI Image Sorting Error:", error);
    
    let modelName = "unknown";
    try {
      const { getAiModelConfig } = await import("@/features/ai-settings/actions");
      const aiConfig = await getAiModelConfig();
      modelName = aiConfig.description_model || "gemini-1.5-flash";
    } catch (_) {}

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "image_sorting",
      status: "error",
      errorMessage: error.message,
    });

    return { success: false, message: error.message || "ไม่สามารถจัดเรียงรูปภาพด้วย AI ได้" };
  }
}

export async function detectPropertyFeaturesAction(
  title: string,
  description: string
): Promise<{
  success: boolean;
  matchedFeatureIds?: string[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: features, error } = await supabase
      .from("features")
      .select("id, name");

    if (error) throw error;
    if (!features || features.length === 0) {
      return { success: true, matchedFeatureIds: [] };
    }

    const featureListStr = features.map((f: { id: string; name: string }) => `- ${f.name} (ID: ${f.id})`).join("\n");

    const prompt = `You are a real estate agent helper.
I have a property with the following title and description:
Title: ${title}
Description: ${description}

Here is a list of features available in our database:
${featureListStr}

Please analyze the title and description and match the features that are explicitly mentioned or strongly implied to be present at this property.
Return a JSON array of strings containing the IDs of the matched features.
Example return: ["id-1", "id-2"]

Return ONLY the JSON array of strings. Do not include markdown code block formatting (no \`\`\`json).`;

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-1.5-flash";

    const response = await generateText(prompt, modelName, 0, {
      responseMimeType: "application/json"
    });

    const parsed = JSON.parse(response.text.trim());
    if (Array.isArray(parsed)) {
      const allIds = new Set(features.map((f: { id: string; name: string }) => f.id));
      const validatedIds = parsed.filter(id => allIds.has(id));

      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: modelName,
        feature: "features_detection",
        status: "success",
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      });

      return { success: true, matchedFeatureIds: validatedIds };
    }

    throw new Error("Invalid feature IDs array returned by AI");
  } catch (error: any) {
    console.error("AI Feature Detection Error:", error);

    let modelName = "unknown";
    try {
      const { getAiModelConfig } = await import("@/features/ai-settings/actions");
      const aiConfig = await getAiModelConfig();
      modelName = aiConfig.description_model || "gemini-1.5-flash";
    } catch (_) {}

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "features_detection",
      status: "error",
      errorMessage: error.message,
    });

    return { success: false, message: error.message || "ไม่สามารถวิเคราะห์สิ่งอำนวยความสะดวกด้วย AI ได้" };
  }
}


