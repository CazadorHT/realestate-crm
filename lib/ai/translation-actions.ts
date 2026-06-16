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
async function translateToLanguage(
  text: string,
  targetLang: "en" | "cn" | "ru",
  contentType: "plain" | "html" = "plain",
): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }

  const langMap = {
    en: "English",
    cn: "Chinese (Simplified)",
    ru: "Russian",
  };

  const prompt = `
    You are a professional translator and real estate marketing expert.
    Translate the following ${contentType === "html" ? "HTML content" : "text"} from Thai to ${langMap[targetLang]}.

    RULES:
    1. Maintain a professional, premium, and engaging tone suitable for real estate.
    2. ${
      contentType === "html"
        ? "CRITICAL: Strictly preserve all HTML tags (e.g., <h2>, <p>, <ul>, <li>, <strong>, <a>). Do NOT remove, modify, or translate the tags themselves. Only translate the text content inside the tags."
        : "Return the result as a clean string."
    }
    3. Return the response ONLY in a valid JSON format with a single key "translation".
    4. Do not include any Markdown formatting like \`\`\`json or explanations.

    TEXT TO TRANSLATE:
    ${text}
  `;

  let modelName: string | undefined;

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    modelName = aiConfig.translation_model;

    const result = await generateText(prompt, modelName);
    const responseText = result.text;

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

    const parsedResult = extractJson(responseText);
    if (!parsedResult || typeof parsedResult.translation !== "string") {
      throw new Error("JSON Extraction Failed");
    }

    // Log success
    await logAiUsage({
      model: modelName || "unknown",
      feature: `translation_${targetLang}`,
      status: "success",
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
    });

    return parsedResult.translation;
  } catch (error: any) {
    console.error(`[AI Translation] Failed to translate to ${targetLang}:`, error);
    
    // Log error
    await logAiUsage({
      model: modelName || "unknown",
      feature: `translation_${targetLang}`,
      status: "error",
      errorMessage: error.message,
    });

    throw error;
  }
}

/**
 * Generic AI action to translate text from Thai to English, Chinese, and Russian in parallel.
 * Handles both plain text and HTML content.
 */
export async function translateTextAction(
  text: string,
  contentType: "plain" | "html" = "plain",
): Promise<TranslationResult> {
  if (!text || text.trim() === "") {
    return { en: "", cn: "", ru: "" };
  }

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.translation_model;
    
    console.log(`🌐 [AI Translation] Translating ${text.length} chars in parallel using model: ${modelName || "default"}`);

    const [en, cn, ru] = await Promise.all([
      translateToLanguage(text, "en", contentType),
      translateToLanguage(text, "cn", contentType),
      translateToLanguage(text, "ru", contentType),
    ]);

    return { en, cn, ru };
  } catch (error: any) {
    console.error("Translation Action Parallel Error:", error);
    throw new Error(error.message || "ไม่สามารถแปลภาษาได้ในขณะนี้");
  }
}
