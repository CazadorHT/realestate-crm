"use server";

import { generateText } from "./gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";

export interface TranslationResult {
  en: string;
  cn: string;
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
    return { en: "", cn: "" };
  }

  const prompt = `
    You are a professional translator and real estate marketing expert.
    Translate the following ${contentType === "html" ? "HTML content" : "text"} from Thai to English and Chinese (Simplified).

    RULES:
    1. Maintain a professional, premium, and engaging tone suitable for real estate.
    2. ${
      contentType === "html"
        ? "CRITICAL: Strictly preserve all HTML tags (e.g., <h2>, <p>, <ul>, <li>, <strong>, <a>). Do NOT remove, modify, or translate the tags themselves. Only translate the text content inside the tags."
        : "Return the result as a clean string."
    }
    3. Return the response ONLY in a valid JSON format with keys "en" and "cn". 
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

    // Attempt to parse JSON
    try {
      // Cleanup common AI artifacts just in case
      const cleanedResponse = responseText
        .trim()
        .replace(/^```json/, "")
        .replace(/```$/, "");

      const parsedResult = JSON.parse(cleanedResponse) as TranslationResult;

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
