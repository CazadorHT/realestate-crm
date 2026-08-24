"use server";

import { createClient, createPublicClient } from "@/lib/supabase/server";
import { type Database, type Json } from "@/lib/database.types.generated";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";

import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";

export interface MasterDataTransitType {
  code: string;
  label: {
    th: string;
    en: string;
    cn: string;
    ru: string;
  };
  metadata?: {
    color?: string;
    bg_color?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Fetch all active transit types from ref_master_data (Cached 1 year)
 */
export async function getTransitTypesAction(): Promise<MasterDataTransitType[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      
      const { data, error } = await supabase
        .from("ref_master_data")
        .select("code, label, metadata")
        .eq("type", "TRANSIT_TYPE")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching transit types:", error);
        return [];
      }

      type MasterDataRow = Database["public"]["Tables"]["ref_master_data"]["Row"];

      return (data as MasterDataRow[] || []).map((item: MasterDataRow) => ({
        code: item.code,
        label: (item.label as MasterDataTransitType["label"]) || { 
          th: item.code, 
          en: item.code, 
          cn: item.code, 
          ru: item.code 
        },
        metadata: item.metadata as MasterDataTransitType["metadata"]
      }));
    },
    ["transit-types-master-data"],
    { revalidate: 31536000, tags: ["master-data", "transit-types"] }
  )();
}

export async function upsertMasterDataAction(input: {
  type: string;
  code: string;
  label: MasterDataTransitType["label"];
  metadata?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
}) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("ref_master_data")
      .upsert({
        type: input.type,
        code: input.code,
        label: input.label as unknown as Json,
        metadata: (input.metadata || {}) as Json,
        sort_order: input.sort_order || 0,
        is_active: input.is_active ?? true,
      });

    if (error) throw error;

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "MASTER_DATA_UPDATE",
      target_entity: "ref_master_data",
      target_id: `${input.type}:${input.code}`,
      tenant_id: ctx.tenantId || "SYSTEM",
      actor_id: ctx.user.id,
      metadata: { type: input.type, code: input.code } as Json,
      description: `อัปเดต Master Data: ${input.type} [${input.code}]`
    });

    revalidateTag("master-data", "seconds");
    revalidateTag("transit-types", "seconds");
    revalidateTag("transit-stations", "seconds");
    revalidateTag("nearby-places", "seconds");

    revalidatePath("/protected/admin/master-data");
    revalidatePath("/protected/admin/transit-stations");
    revalidatePath("/(public)/areas/[slug]", "layout");
    revalidatePath("/(public)/properties", "layout");

    const { purgeCloudflareCache } = await import("@/lib/cloudflare");
    purgeCloudflareCache(["/", "/properties", "/projects"]).catch((e) =>
      console.error("[Cloudflare] Master data purge failed:", e)
    );

    return { success: true, message: "บันทึกข้อมูล Master Data สำเร็จ ✨" };
  } catch (err: any) {
    console.error("upsertMasterData error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Generic CRUD: Delete master data entry
 */
export async function deleteMasterDataAction(type: string, code: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("ref_master_data")
      .delete()
      .eq("type", type)
      .eq("code", code);

    if (error) throw error;

    // V3 Audit Logging
    await ctx.supabase.from("activity_timeline_v3").insert({
      activity_type: "MASTER_DATA_DELETE",
      target_entity: "ref_master_data",
      target_id: `${type}:${code}`,
      tenant_id: ctx.tenantId || "SYSTEM",
      actor_id: ctx.user.id,
      description: `ลบ Master Data: ${type} [${code}]`
    });

    revalidateTag("master-data", "seconds");
    revalidateTag("transit-types", "seconds");
    revalidateTag("transit-stations", "seconds");
    revalidateTag("nearby-places", "seconds");

    revalidatePath("/protected/admin/master-data");
    revalidatePath("/protected/admin/transit-stations");
    revalidatePath("/(public)/areas/[slug]", "layout");
    revalidatePath("/(public)/properties", "layout");

    const { purgeCloudflareCache } = await import("@/lib/cloudflare");
    purgeCloudflareCache(["/", "/properties", "/projects"]).catch((e) =>
      console.error("[Cloudflare] Master data purge failed:", e)
    );

    return { success: true, message: "ลบข้อมูล Master Data สำเร็จ 🗑️" };
  } catch (err: any) {
    console.error("deleteMasterData error:", err);
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Fetch all active nearby place categories from ref_master_data (Cached 1 year)
 */
export async function getNearbyPlaceCategoriesAction(): Promise<MasterDataTransitType[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      
      const { data, error } = await supabase
        .from("ref_master_data")
        .select("code, label, metadata")
        .eq("type", "NEARBY_PLACE_CATEGORY")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching nearby place categories:", error);
        return [];
      }

      type MasterDataRow = Database["public"]["Tables"]["ref_master_data"]["Row"];

      return (data as MasterDataRow[] || []).map((item: MasterDataRow) => ({
        code: item.code,
        label: (item.label as MasterDataTransitType["label"]) || { 
          th: item.code, 
          en: item.code, 
          cn: item.code, 
          ru: item.code 
        },
        metadata: item.metadata as MasterDataTransitType["metadata"]
      }));
    },
    ["nearby-place-categories-master-data"],
    { revalidate: 31536000, tags: ["master-data", "nearby-places"] }
  )();
}

/**
 * Fetch all master data rows (Admin Management)
 */
export async function getAllMasterDataAction(typeFilter?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("ref_master_data")
    .select("type, code, label, is_active, sort_order, metadata")
    .order("sort_order", { ascending: true });
  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching all master data:", error);
    return [];
  }
  return data || [];
}

export interface MasterDataTransitStation {
  code: string;
  label: {
    th: string;
    en: string;
    cn: string;
    ru: string;
  };
  metadata?: {
    transit_type?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: string | number | boolean | undefined;
  };
}


/**
 * Fetch all active transit stations from ref_master_data (Cached cross-request 1 year)
 */
export async function getTransitStationsAction(): Promise<MasterDataTransitStation[]> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      
      const { data, error } = await supabase
        .from("ref_master_data")
        .select("code, label, metadata")
        .eq("type", "TRANSIT_STATION")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching transit stations:", error);
        return [];
      }

      type MasterDataRow = Database["public"]["Tables"]["ref_master_data"]["Row"];

      return (data as MasterDataRow[] || []).map((item: MasterDataRow) => ({
        code: item.code,
        label: (item.label as MasterDataTransitStation["label"]) || { 
          th: item.code, 
          en: item.code, 
        },
        metadata: (item.metadata as MasterDataTransitStation["metadata"]) || {
          transit_type: "OTHER",
          line_name: "",
          line_color: "#6B7280",
        },
      }));
    },
    ["transit-stations-master-data"],
    { revalidate: 31536000, tags: ["master-data", "transit-stations"] }
  )();
}

/**
 * Generate station SEO and description details using Gemini AI
 */
export async function generateAIStationDataAction(stationNameTh: string, stationNameEn: string, transitType: string) {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { generateText } = await import("@/lib/ai/gemini");

    const prompt = `
You are an expert real estate data analyst and copywriter specializing in Thailand transit-oriented development.
Your task is to generate high-quality SEO meta tags and descriptive local content for a transit station named: "${stationNameTh}" (English: "${stationNameEn}") of transit line type: "${transitType}" (e.g. BTS, MRT, ARL, SRT).

Provide all details in a strictly valid JSON format. Follow this JSON schema exactly:
{
  "seoTitle": "SEO title for this station page (in Thai, under 60 chars, e.g., คอนโดใกล้ BTS อโศก ทำเลทองใจกลางเมือง)",
  "seoDescription": "SEO meta description (in Thai, under 160 chars, e.g., ค้นหาคอนโด บ้านเดี่ยว ขายและให้เช่า ใกล้สถานี BTS อโศก แหล่งธุรกิจศูนย์กลางความเจริญใจกลางสุขุมวิท...",
  "descriptionTh": "คำอธิบายรายละเอียดทำเลรอบสถานีภาษาไทย (HTML support, e.g., <p>, <ul>, <li>, <strong>). Describe the vibe, amenities, shopping mall, nearby offices, lifestyle of this station area.",
  "descriptionEn": "Description of the station area in English (HTML support).",
  "descriptionCn": "Description of the station area in Chinese (HTML support).",
  "descriptionRu": "Description of the station area in Russian (HTML support)."
}

Return ONLY the raw JSON string. Do not include markdown code block syntax (like \`\`\`json).
`;

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig?.description_model || "gemini-1.5-flash";

    const response = await generateText(prompt, modelName);
    
    // Log AI Usage
    try {
      const { logAiUsage } = await import("@/features/ai-monitor/actions");
      await logAiUsage({
        model: modelName,
        feature: "station_seo_generator",
        status: "success",
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      });
    } catch (e) {
      console.error("Failed to log AI usage:", e);
    }

    const cleanJson = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return { success: true, data: parsed };
  } catch (err: any) {
    console.error("generateAIStationDataAction error:", err);
    return { success: false, message: err.message || "ล้มเหลวในการสร้างข้อมูลสถานีด้วย AI" };
  }
}

/**
 * Fetch all transit stations with the count of active properties near them
 */
export async function getTransitStationsWithCountsAction() {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    return await unstable_cache(
      async () => {
        const publicClient = createPublicClient();

        // 1. Fetch all transit stations
        const { data: stations, error: stationsError } = await publicClient
          .from("ref_master_data")
          .select("type, code, label, is_active, sort_order, metadata")
          .eq("type", "TRANSIT_STATION")
          .order("sort_order", { ascending: true });

        if (stationsError) throw stationsError;

        // 2. Fetch count of properties grouped by transit_station_name and nearby_transits from properties view
        const { data: counts, error: countsError } = await publicClient
          .from("properties")
          .select("transit_station_name, nearby_transits")
          .is("deleted_at", null)
          .eq("status", "ACTIVE"); // only active properties

        if (countsError) throw countsError;

        // 3. Map counts by matching station credentials (code, label.th, label.en) against property attributes
        return (stations || []).map((station: any) => {
          const code = (station.code || "").toLowerCase();
          const thName = (station.label?.th || "").toLowerCase();
      const enName = (station.label?.en || "").toLowerCase();
      
      let count = 0;
      
      for (const p of (counts || [])) {
        let isMatched = false;
        
        // Check primary station code
        if (p.transit_station_name) {
          const primary = p.transit_station_name.toLowerCase();
          if (primary === code || primary === thName || primary === enName) {
            isMatched = true;
          }
        }
        
        // Check nearby transits if not already matched
        if (!isMatched && p.nearby_transits && Array.isArray(p.nearby_transits)) {
          for (const item of p.nearby_transits) {
            if (item && typeof item === "object") {
              const anyItem = item as any;
              const itemTh = (anyItem.station_name || "").toString().toLowerCase();
              const itemEn = (anyItem.station_name_en || "").toString().toLowerCase();
              const itemCode = (anyItem.code || "").toString().toLowerCase();
              
              if (
                (itemCode && itemCode === code) ||
                (itemTh && (itemTh === thName || itemTh === code)) ||
                (itemEn && (itemEn === enName || itemEn === code))
              ) {
                isMatched = true;
                break;
              }
            }
          }
        }
        
        if (isMatched) {
          count++;
        }
      }
      
      return {
        ...station,
        property_count: count,
      };
    });
      },
      ["transit-stations-with-counts-v1"],
      { revalidate: 31536000, tags: ["master-data", "transit-stations", "properties"] }
    )();
  } catch (err) {
    console.error("Error in getTransitStationsWithCountsAction:", err);
    return [];
  }
}




