"use server";

import { generateText } from "./gemini";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { createClient } from "@/lib/supabase/server";

export interface TranslationResult {
  [x: string]: unknown;
  th?: string;
  en: string;
  cn: string;
  ru: string;
}

/**
 * Generic AI action to translate text between languages (Auto-detecting source).
 * Handles both plain text and HTML content.
 */
async function translateToLanguage(
  text: string,
  targetLang: "th" | "en" | "cn" | "ru",
  contentType: "plain" | "html" = "plain",
  userId?: string,
): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }

  const langMap = {
    th: "Thai",
    en: "English",
    cn: "Chinese (Simplified)",
    ru: "Russian",
  };

  const prompt = `
    You are a professional translator and real estate marketing expert.
    Translate the following ${contentType === "html" ? "HTML content" : "text"} accurately into ${langMap[targetLang]}.
    Detect the source language automatically (whether it is Thai, English, Chinese, etc.).

    RULES:
    1. Maintain a professional, premium, and engaging tone suitable for real estate.
    2. ${
      contentType === "html"
        ? "CRITICAL: Strictly preserve all HTML tags (e.g., <h2>, <p>, <ul>, <li>, <strong>, <a>, <table>, <img>, etc.) and attributes (e.g., class, href, alt). Do NOT remove, modify, or translate the HTML tags or attributes themselves. Only translate the human-readable text content inside/between public tags."
        : "Return the result as a clean text string."
    }
    3. Return ONLY the translated output directly.
    4. Do not include any Markdown formatting blocks (do NOT wrap in \`\`\` or \`\`\`html) and do not provide any introductory/ending explanations or conversational notes. Just start directly with the translated text.

    TEXT TO TRANSLATE:
    ${text}
  `;

  const systemInstruction = `You are a professional real estate and property marketing translator. 
  Your job is to translate text or HTML content and return ONLY the translated results directly. 
  Never include introductory texts (like "Here is the translation:"), never include markdown block wrappers (like \`\`\`html or \`\`\`), and never include explanations. Just start with the actual translation.`;

  let modelName: string | undefined;

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    modelName = aiConfig.translation_model;

    const result = await generateText(prompt, modelName, 0, { systemInstruction });
    const responseText = result.text;

    let translatedText = responseText.trim();

    // Clean up typical markdown code block formatting first, if any
    if (translatedText.startsWith("```")) {
      const match = translatedText.match(/^```(?:html|json|xml|text|plain)?\n([\s\S]*?)\n```$/i);
      if (match && match[1]) {
        translatedText = match[1].trim();
      } else {
        translatedText = translatedText.replace(/^```[a-zA-Z]*\n?/g, "").replace(/\n?```$/g, "").trim();
      }
    }

    // Fallback: If model completely ignored rules and returned a JSON string anyway
    if (translatedText.startsWith("{") && translatedText.endsWith("}")) {
      try {
        const parsed = JSON.parse(translatedText);
        if (parsed && typeof parsed.translation === "string") {
          translatedText = parsed.translation;
        } else if (parsed && typeof parsed.text === "string") {
          translatedText = parsed.text;
        }
      } catch (e) {
        // If it starts/ends with { } but fails JSON.parse (due to raw double quotes inside HTML), 
        // try to extract from inside the key "translation" using regex
        const translationRegex = /"translation"\s*:\s*"([\s\S]*)"\s*}/i;
        const match = translatedText.match(translationRegex);
        if (match && match[1]) {
          // Unescape quotes if they were escaped
          translatedText = match[1].replace(/\\"/g, '"').trim();
        }
      }
    }

    if (!translatedText || translatedText.trim() === "") {
      throw new Error("Translation Result is empty");
    }

    // Log success
    await logAiUsage({
      model: modelName || "unknown",
      feature: `translation_${targetLang}`,
      status: "success",
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      userId,
    });

    return translatedText;
  } catch (error: any) {
    console.error(`[AI Translation] Failed to translate to ${targetLang}:`, error);
    
    // Log error
    await logAiUsage({
      model: modelName || "unknown",
      feature: `translation_${targetLang}`,
      status: "error",
      errorMessage: error.message,
      userId,
    });

    throw error;
  }
}

/**
 * Generic AI action to translate text across Thai, English, Chinese, and Russian in parallel.
 * Handles both plain text and HTML content.
 */
export async function translateTextAction(
  text: string,
  contentType: "plain" | "html" = "plain",
  targets: ("th" | "en" | "cn" | "ru")[] = ["th", "en", "cn", "ru"],
): Promise<TranslationResult> {
  if (!text || text.trim() === "") {
    return { th: "", en: "", cn: "", ru: "" };
  }

  try {
    const { getAiModelConfig } = await import("@/features/ai-settings/actions");
    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.translation_model;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    console.log(`🌐 [AI Translation] Translating ${text.length} chars in parallel to [${targets.join(", ")}] using model: ${modelName || "default"}`);

    const results: Record<string, string> = {
      th: "",
      en: "",
      cn: "",
      ru: "",
    };

    await Promise.all(
      targets.map(async (lang) => {
        results[lang] = await translateToLanguage(text, lang, contentType, userId);
      })
    );

    return {
      th: results.th || "",
      en: results.en || "",
      cn: results.cn || "",
      ru: results.ru || "",
    };
  } catch (error: any) {
    console.error("Translation Action Parallel Error:", error);
    throw new Error(error.message || "ไม่สามารถแปลภาษาได้ในขณะนี้");
  }
}
