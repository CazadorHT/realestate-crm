"use server";

import { generateText } from "./gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";

export interface TranslationResult {
  [x: string]: unknown;
  en: string;
  cn: string;
  ru: string;
}

/**
 * Generic AI action to translate text from Thai to English and Chinese.
 * Handles both plain text and HTML content.
 */
export async function translateTextAction(
  text: string,
  contentType: "plain" | "html" = "plain",
): Promise<TranslationResult> {
  if (!text || text.trim() === "") {
    return { en: "", cn: "", ru: "" };
  }

  const prompt = `
    You are a professional translator and real estate marketing expert.
    Translate the following ${contentType === "html" ? "HTML content" : "text"} from Thai to English, Chinese (Simplified), and Russian.

    RULES:
    1. Maintain a professional, premium, and engaging tone suitable for real estate.
    2. ${
      contentType === "html"
        ? "CRITICAL: Strictly preserve all HTML tags (e.g., <h2>, <p>, <ul>, <li>, <strong>, <a>). Do NOT remove, modify, or translate the tags themselves. Only translate the text content inside the tags."
        : "Return the result as a clean string."
    }
    3. Return the response ONLY in a valid JSON format with keys "en", "cn", and "ru". 
    4. Do not include any Markdown formatting like \`\`\`json or explanations.

    TEXT TO TRANSLATE:
    ${text}
  `;

  let modelName: string | undefined;

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    modelName = aiConfig.translation_model;
    
    console.log(`🌐 [AI Translation] Translating ${text.length} chars using model: ${modelName || "default"}`);
    
    const result = await generateText(prompt, modelName);
    const responseText = result.text;

    // 🛠️ ROBUST EXTRACTION: Handle AI quirks like markdown blocks or extra text
    const extractJson = (text: string) => {
      try {
        const clean = text.trim();
        if (clean.startsWith('{') && clean.endsWith('}')) return JSON.parse(clean);
      } catch (e) {}

      const markdownMatch = text.match(/```json\s?([\s\S]*?)\s?```/);
      if (markdownMatch && markdownMatch[1]) {
        try {
          return JSON.parse(markdownMatch[1].trim());
        } catch (e) {}
      }

      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        let candidate = text.substring(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch (e) {
          try { return JSON.parse(candidate + '}'); } catch (e2) {}
        }
      }
      return null;
    };

    try {
      const parsedResult = extractJson(responseText) as TranslationResult | null;
      if (!parsedResult) throw new Error("JSON Extraction Failed");

      // Log success
      await logAiUsage({
        model: modelName || "unknown",
        feature: "translation",
        status: "success",
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
      });

      return {
        en: parsedResult.en || "",
        cn: parsedResult.cn || "",
        ru: parsedResult.ru || "",
      };
    } catch (parseError) {
      console.error("Failed to parse AI translation JSON:", responseText);

      // Log parsing error
      await logAiUsage({
        model: modelName || "unknown",
        feature: "translation",
        status: "error",
        errorMessage: "JSON Parse Error",
      });

      throw new Error("ระบบแปลภาษาขัดข้อง (JSON Parse Error)");
    }
  } catch (error: any) {
    console.error("Translation Action Error:", error);

    // Log general error (e.g., Rate Limit)
    await logAiUsage({
      model: modelName || "unknown",
      feature: "translation",
      status: "error",
      errorMessage: error.message,
    });

    throw new Error(error.message || "ไม่สามารถแปลภาษาได้ในขณะนี้");
  }
}
