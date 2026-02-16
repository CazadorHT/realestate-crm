import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Key Rotation Logic
 * Supports a single GEMINI_API_KEY or multiple GEMINI_API_KEYS (comma-separated)
 */
const getApiKeys = () => {
  const keys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim())
    : [];
  const singleKey = process.env.GEMINI_API_KEY;

  // Combine and deduplicate
  const allKeys = Array.from(new Set([...keys, singleKey].filter(Boolean)));
  return allKeys as string[];
};

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

/**
 * Helper to get a GoogleGenerativeAI instance using the current key
 */
function getClient() {
  const key = API_KEYS[currentKeyIndex];
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// Default model for backwards compatibility
const DEFAULT_MODEL = "gemini-flash-latest";

/**
 * Get a specific generative model by name
 */
export function getModel(modelName: string = DEFAULT_MODEL) {
  const genAI = getClient();
  if (!genAI) return null;

  // Alias common naming mistakes or currently unstable models for this project
  let normalizedModelName = modelName;
  const unstableModels = [
    "gemini-2-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  if (unstableModels.includes(modelName)) {
    normalizedModelName = "gemini-flash-latest";
  }

  return genAI.getGenerativeModel({ model: normalizedModelName });
}

// Keep core model for simple legacy calls
export const geminiModel = getModel(DEFAULT_MODEL);

/**
 * Rotates to the next available API key
 * Returns true if we managed to rotate (there were other keys), false if we exhausted or only have one.
 */
function rotateApiKey(): boolean {
  if (API_KEYS.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Switched to AI API Key index: ${currentKeyIndex}`);
  return true;
}

export async function generateText(
  prompt: string,
  modelName: string = DEFAULT_MODEL,
  retryCount: number = 0,
): Promise<string> {
  const model = getModel(modelName);

  if (!model) {
    throw new Error("No GEMINI_API_KEY configured in environment");
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini generation error detail:", {
      message: error.message,
      status: error.status,
      keyIndex: currentKeyIndex,
    });

    // Handle 429 (Rate Limit) with Key Rotation
    if (error.status === 429) {
      if (rotateApiKey() && retryCount < API_KEYS.length) {
        console.log("🚀 Retrying with rotated key...");
        return generateText(prompt, modelName, retryCount + 1);
      }
      throw new Error(
        "[RATE_LIMIT] โควต้า AI เต็มข้า (All Keys Exhausted) กรุณารอสักครู่แล้วลองใหม่ครับ",
      );
    }

    // Retry for 503 Service Unavailable
    if (
      error.status === 503 ||
      (error.message && error.message.includes("503"))
    ) {
      if (retryCount < 2) {
        console.log(`Retrying due to 503 (Attempt ${retryCount + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return generateText(prompt, modelName, retryCount + 1);
      }
    }

    throw new Error(`AI Error: ${error.message || "Unknown error"}`);
  }
}
