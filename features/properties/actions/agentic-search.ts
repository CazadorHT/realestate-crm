"use server";

import { generateText } from "@/lib/ai/gemini";

/**
 * [S-Tier] Agentic Search Intent Engine
 * Parses natural language into structured search filters and refined semantic queries.
 */
export async function getAgenticSearchIntentAction(query: string, lang: string = "th") {
  if (!query || query.trim().length < 2) {
    return { success: false, message: "Query too short" };
  }

  const systemPrompt = `
You are an expert Real Estate AI Scout. Your task is to extract search intent from a user's natural language query.
Return a valid JSON object ONLY.

User Locale: ${lang} (AI Insight MUST be in this language)

JSON Schema:
{
  "filters": {
    "keyword": string,
    "listingType": "SALE" | "RENT" | "ALL",
    "propertyType": "CONDO" | "HOUSE" | "VILLA" | "LAND" | "OFFICE_BUILDING" | "WAREHOUSE" | "ALL",
    "minPrice": number | null,
    "maxPrice": number | null,
    "province": string | "ALL",
    "area": string | "ALL", 
    "bedrooms": "1" | "2" | "3" | "4+" | "ALL",
    "petFriendly": boolean,
    "nearTrain": boolean,
    "fullyFurnished": boolean,
    "isHotDeal": boolean
  },
  "semanticQuery": string, // A refined English query for better vector embedding search
  "aiInsight": string // A 1-sentence explanation of what the AI is focusing on, in the specified User Locale (${lang}).
}

Rules:
1. "semanticQuery" should be a clear, expressive English translation of the user's core intent (e.g., "modern pet-friendly condo high floor").
2. "aiInsight" MUST be in ${lang}.
3. If price is mentioned like "20k", it means 20000. If "5M", it means 5000000.
4. If location is mentioned, try to normalize it to a Thai or English name.
5. If intent is not clear, default filters to "ALL" or null.
`;

  try {
    const result = await generateText([
      { text: systemPrompt },
      { text: `User Query: "${query}"` }
    ], "gemini-1.5-flash");

    // Clean JSON from markdown if present
    const cleanJson = result.text.replace(/```json|```/g, "").trim();
    const intent = JSON.parse(cleanJson);

    return { 
      success: true, 
      intent 
    };
  } catch (error: any) {
    console.error("getAgenticSearchIntentAction error:", error);
    return { success: false, message: "AI Parsing failed" };
  }
}
