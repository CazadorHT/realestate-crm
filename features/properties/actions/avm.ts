"use server";

import { createClient } from "@/lib/supabase/server";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { generateText } from "@/lib/ai/gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { requireAuthContext } from "@/lib/authz";

// Types
export interface AVMInputParams {
  propertyType: string;
  listingType: string;
  sizeSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  popularArea?: string | null;
  buildingName?: string | null; // e.g. project name
}

export interface AVMResult {
  maxProfitPrice: number;
  marketPrice: number;
  quickSalePrice: number;
  estimatedYieldPercent: number;
  confidenceScore: "HIGH" | "MEDIUM" | "LOW";
  analysisSummary: string;
}

/**
 * ดึงข้อมูลทรัพย์สินที่กำลังประกาศขาย/เช่า (Active Comparables)
 */
export async function getComparableProperties(params: AVMInputParams) {
  const { supabase, tenantId } = await requireAuthContext();
  if (!tenantId) throw new Error("Tenant ID is missing");

  let query = supabase
    .from("properties")
    .select(
      "id, title, price, rental_price, size_sqm, bedrooms, bathrooms, original_price, original_rental_price",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "ACTIVE")
    .eq("property_type", params.propertyType as any)
    .eq("listing_type", params.listingType as any)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  // Filter location (strict to loose)
  if (params.popularArea) {
    query = query.eq("popular_area", params.popularArea);
  } else if (params.subdistrict) {
    query = query.eq("subdistrict", params.subdistrict);
  } else if (params.district) {
    query = query.eq("district", params.district);
  }

  // Filter size range +/- 20%
  if (params.sizeSqm) {
    const minSize = params.sizeSqm * 0.8;
    const maxSize = params.sizeSqm * 1.2;
    query = query.gte("size_sqm", minSize).lte("size_sqm", maxSize);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching comparable properties:", error);
    return [];
  }
  return data || [];
}

/**
 * ดึงข้อมูลดีลที่ปิดสำเร็จ (Closed Deals Comparables)
 */
export async function getComparableDeals(params: AVMInputParams) {
  const { supabase, tenantId } = await requireAuthContext();
  if (!tenantId) throw new Error("Tenant ID is missing");

  // Since deals only have property_id, we need to join properties
  let query = supabase
    .from("deals")
    .select(
      `
      id,
      closed_at,
      status,
      properties!inner (
        id, title, price, rental_price, size_sqm, bedrooms, property_type, listing_type,
        popular_area, subdistrict, district
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("status", "CLOSED_WIN")
    .eq("properties.property_type", params.propertyType as any)
    .order("closed_at", { ascending: false })
    .limit(10);

  if (params.popularArea) {
    query = query.eq("properties.popular_area", params.popularArea);
  } else if (params.subdistrict) {
    query = query.eq("properties.subdistrict", params.subdistrict);
  }

  if (params.sizeSqm) {
    const minSize = params.sizeSqm * 0.8;
    const maxSize = params.sizeSqm * 1.2;
    query = query
      .gte("properties.size_sqm", minSize)
      .lte("properties.size_sqm", maxSize);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching comparable deals:", error);
    return [];
  }
  return data || [];
}

/**
 * Note: External market data fetching is now handled directly by Gemini via Grounding (Google Search tool).
 * This function is kept as a placeholder or can be removed if not needed.
 */
export async function fetchExternalMarketData(params: AVMInputParams) {
  return "Grounding enabled. Gemini will search the web for latest competitor pricing.";
}

/**
 * Generate Valuation using AI (Gemini/OpenAI)
 */
export async function generatePropertyValuation(
  params: AVMInputParams,
): Promise<AVMResult> {
  const activeComps = await getComparableProperties(params);
  const closedDeals = await getComparableDeals(params);


  const aiConfig = await getAiModelConfig();
  const modelName = aiConfig.blog_generator_model || "gemini-1.5-flash"; // default fallback

  const prompt = `
    You are an expert, highly analytical real estate appraiser in Thailand.
    Your task is to accurately value a property based on internal CRM comparables and external market data.

    Subject Property Context:
    - Type: ${params.propertyType}
    - Listing Type: ${params.listingType}
    - Size: ${params.sizeSqm} sq.m
    - Location: ${params.popularArea || params.subdistrict || params.district || "Unknown"}
    - Bedrooms: ${params.bedrooms}

    Internal CRM Data (Extremely Reliable):
    - Active Properties (Competitors): ${JSON.stringify(activeComps)}
    - Closed Deals (Actual Market Value): ${JSON.stringify(closedDeals)}

    CRITICAL INSTRUCTION:
    If internal CRM data is insufficient (especially if there are few or no closed deals), you MUST use Google Search to find real-time market data for ${params.propertyType} in ${params.subdistrict || params.district || params.province}. 
    Focus on finding:
    - Current "Asking Price" from major portals like DDProperty, Livinginsider, or DotProperty.
    - Calculate the average price per sq.m. from at least 3 recent web listings you found.
    
    In your "analysisSummary", you MUST explicitly mention if the data comes from internal CRM records or specific external web sources found via search (e.g., "จากการค้นหาข้อมูลบน DDProperty...").

    Output Language: The "analysisSummary" must be in THAI (ภาษาไทย).

    Task:
    Provide an estimated valuation for this subject property across 3 strategies.
    If you lack data, you MUST STILL provide a reasonable estimate based on general Thailand real estate market averages for this type of property.
    Return ONLY a valid JSON object matching this exact structure, with NO markdown formatting around it (no \`\`\`json):
    {
      "maxProfitPrice": number, // Optimistic asking price (above market average)
      "marketPrice": number,    // Fair market value (highly likely to transact)
      "quickSalePrice": number, // Discounted for fast liquidity
      "estimatedYieldPercent": number, // e.g. 5.5 (if missing rental data, estimate based on Thailand averages 4-6%)
      "confidenceScore": "HIGH" | "MEDIUM" | "LOW", // HIGH if >5 closed deals, MEDIUM if 1-4, LOW if 0
      "analysisSummary": "Short 2-3 sentences explaining the reasoning in Thai (ภาษาไทย) and citing sources."
    }

    Note: All prices MUST be in Thai Baht (THB). The prices should correspond to the 'Listing Type' (${params.listingType}). So if it is 'RENT', output rental prices.
  `;

  try {
    const response = await generateText(prompt, modelName, 0, {
      useSearch: closedDeals.length < 5,
    });

    // Extract JSON securely and handle control characters
    const cleanText = response.text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON object.");
    }

    const jsonStr = jsonMatch[0].trim();
    const resultData = JSON.parse(jsonStr) as AVMResult;

    await logAiUsage({
      model: modelName,
      feature: "avm_valuation",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });

    return resultData;
  } catch (error: any) {
    console.error("AI Valuation Generation Error:", error);
    await logAiUsage({
      model: modelName || "unknown",
      feature: "avm_valuation",
      status: "error",
      errorMessage: error.message,
    });
    throw new Error("Unable to generate valuation at this time.");
  }
}
