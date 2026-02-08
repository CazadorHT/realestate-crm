"use server";

import { generateText } from "./gemini";

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

  try {
    const response = await generateText(prompt);

    // Attempt to parse JSON
    try {
      // Cleanup common AI artifacts just in case
      const cleanedResponse = response
        .trim()
        .replace(/^```json/, "")
        .replace(/```$/, "");

      const result = JSON.parse(cleanedResponse) as TranslationResult;
      return {
        en: result.en || "",
        cn: result.cn || "",
      };
    } catch (parseError) {
      console.error("Failed to parse AI translation JSON:", response);
      throw new Error("ระบบแปลภาษาขัดข้อง (JSON Parse Error)");
    }
  } catch (error: any) {
    console.error("Translation Action Error:", error);
    throw new Error(error.message || "ไม่สามารถแปลภาษาได้ในขณะนี้");
  }
}
