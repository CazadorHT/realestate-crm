"use server";

import { generateText } from "@/lib/ai/gemini";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { PropertyType, ListingType } from "../../schema";

export interface ExtractedDepositData {
  title?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  price?: number;
  rental_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  floor?: number;
  features?: string[];
  description?: string;
}

export interface ExtractDepositResult {
  success: boolean;
  message?: string;
  data?: ExtractedDepositData;
}

export async function extractPropertyFromDepositAction(rawText: string): Promise<ExtractDepositResult> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    if (!rawText || !rawText.trim()) {
      return {
        success: false,
        message: "No content provided for extraction",
      };
    }

    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.description_model || "gemini-2.5-flash";

    const prompt = `
You are an expert real estate data parser. Extract structured property details from this real estate listing / deposit text into valid JSON.

Text to extract:
"""
${rawText}
"""

Instructions:
1. Extract the following fields strictly into JSON:
   - "title": Clean project or listing title (e.g., "The Niche ID พระราม 2" or "The Niche ID Rama 2")
   - "property_type": Exactly one of ["CONDO", "HOUSE", "TOWNHOME", "LAND", "COMMERCIAL_BUILDING", "WAREHOUSE", "OFFICE_BUILDING", "VILLA", "POOL_VILLA", "HOME_OFFICE", "OTHER"] (Default to "CONDO" if unclear)
   - "listing_type": Exactly one of ["SALE", "RENT", "SALE_AND_RENT"] (Default to "SALE" if sale, "RENT" if rent)
   - "price": Sale price as number only, or null
   - "rental_price": Rental price as number only, or null
   - "bedrooms": Integer bedroom count, or null
   - "bathrooms": Integer bathroom count, or null
   - "size_sqm": Area size in square meters as number, or null
   - "floor": Integer floor number, or null
   - "features": Array of amenities mentioned (e.g. ["สระว่ายน้ำ", "ฟิตเนส", "สวนหย่อม", "สนามเด็กเล่น", "แอร์", "เฟอร์นิเจอร์ครบ"])
   - "description": Clean and formatted text description without contact metadata

2. Return ONLY the JSON object. Do not wrap in markdown \`\`\`json blocks.
`;

    const response = await generateText(prompt, modelName);
    let rawOutput = response.text?.trim() || "";

    // Clean up code blocks if present
    if (rawOutput.startsWith("```json")) {
      rawOutput = rawOutput.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (rawOutput.startsWith("```")) {
      rawOutput = rawOutput.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (parseErr) {
      console.error("AI JSON Parse error:", parseErr, rawOutput);
      return {
        success: false,
        message: "AI output could not be parsed",
      };
    }

    const { logAiUsage } = await import("@/features/ai-monitor/actions");
    await logAiUsage({
      model: modelName,
      feature: "deposit_extractor",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });

    return {
      success: true,
      data: {
        title: parsed.title || undefined,
        property_type: parsed.property_type || undefined,
        listing_type: parsed.listing_type || undefined,
        price: typeof parsed.price === "number" ? parsed.price : undefined,
        rental_price: typeof parsed.rental_price === "number" ? parsed.rental_price : undefined,
        bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : undefined,
        bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : undefined,
        size_sqm: typeof parsed.size_sqm === "number" ? parsed.size_sqm : undefined,
        floor: typeof parsed.floor === "number" ? parsed.floor : undefined,
        features: Array.isArray(parsed.features) ? parsed.features : [],
        description: parsed.description || undefined,
      },
    };
  } catch (error: any) {
    console.error("extractPropertyFromDepositAction error:", error);
    return {
      success: false,
      message: error?.message || "Failed to extract property details with AI",
    };
  }
}
