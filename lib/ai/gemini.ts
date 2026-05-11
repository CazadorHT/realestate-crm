import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Key Rotation Logic
 * Supports a single GEMINI_API_KEY or multiple GEMINI_API_KEYS (comma-separated)
 */
const getApiKeys = () => {
  const keys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(",").map((k) => k.trim())
    : [];
  const singleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Combine and deduplicate
  const allKeys = Array.from(new Set([...keys, singleKey].filter(Boolean)));
  
  if (allKeys.length === 0) {
    console.error("❌ [Gemini AI] No API keys found! Please set GEMINI_API_KEY or GOOGLE_API_KEY in .env");
  } else {
    console.log(`✅ [Gemini AI] Loaded ${allKeys.length} API keys for rotation`);
  }
  
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
 * Normalizes model names to handle common mistakes or project-specific fallbacks
 */
function normalizeModelName(modelName: string): string {
  const unstableModels: Record<string, string> = {
    "gemini-2-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-exp": "gemini-2.0-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
  };

  return unstableModels[modelName] || modelName;
}

/**
 * Get a specific generative model by name
 */
export function getModel(modelName: string = DEFAULT_MODEL, options?: { 
  useSearch?: boolean;
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  maxOutputTokens?: number;
}) {
  const genAI = getClient();
  if (!genAI) return null;

  const normalizedModelName = normalizeModelName(modelName);
  const modelOptions: any = { model: normalizedModelName };
  
  if (options?.useSearch) {
    modelOptions.tools = [{ googleSearchRetrieval: {} }];
  }

  if (options?.systemInstruction) {
    modelOptions.systemInstruction = options.systemInstruction;
  }

  if (options?.responseMimeType) {
    modelOptions.generationConfig = {
      ...modelOptions.generationConfig,
      responseMimeType: options.responseMimeType,
    };
  }

  if (options?.maxOutputTokens) {
    modelOptions.generationConfig = {
      ...modelOptions.generationConfig,
      maxOutputTokens: options.maxOutputTokens,
    };
  }

  return genAI.getGenerativeModel(modelOptions);
}

// Keep core model for simple legacy calls
export const geminiModel = getModel(DEFAULT_MODEL);

/**
 * Rotates to the next available API key
 */
function rotateApiKey(): boolean {
  if (API_KEYS.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Switched to AI API Key index: ${currentKeyIndex}`);
  return true;
}

export type AiGenerationResult = {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  groundingMetadata?: any;
};

/**
 * Generates an embedding vector (768 dimensions) for a given text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim() === "") return null;
  const genAI = getClient();
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text.replace(/\n/g, " ").trim());
    return result.embedding.values;
  } catch (error: any) {
    console.error("Error generating Gemini embedding:", error);
    if (error.status === 429 && rotateApiKey()) {
      return generateEmbedding(text);
    }
    return null;
  }
}

/**
 * Advanced Text Generation with Rotation and Multi-modal support
 */
export async function generateText(
  prompt: string | any[],
  modelName: string = DEFAULT_MODEL,
  retryCount: number = 0,
  options?: { 
    useSearch?: boolean;
    systemInstruction?: string;
    responseMimeType?: "application/json" | "text/plain";
    maxOutputTokens?: number;
  }
): Promise<AiGenerationResult> {
  const genAI = getClient();
  if (!genAI) {
    throw new Error("No GEMINI_API_KEY configured in environment");
  }

  const model = getModel(modelName, options);
  if (!model) throw new Error("Could not initialize AI model");

  try {
    const contentParts = Array.isArray(prompt) ? prompt : [prompt];
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = response.text();

    const usage = result.response.usageMetadata
      ? {
          promptTokens: result.response.usageMetadata.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata.totalTokenCount || 0,
        }
      : undefined;

    return { 
      text, 
      usage,
      groundingMetadata: (response as any).groundingMetadata 
    };
  } catch (error: any) {
    console.error("Gemini generation error detail:", {
      message: error.message,
      status: error.status,
      keyIndex: currentKeyIndex,
    });

    if (error.status === 429) {
      if (rotateApiKey() && retryCount < API_KEYS.length) {
        console.log("🚀 Retrying with rotated key...");
        return generateText(prompt, modelName, retryCount + 1, options);
      }
      throw new Error("[RATE_LIMIT] โควต้า AI เต็มแล้ว กรุณารอสักครู่แล้วลองใหม่ครับ");
    }

    if (error.status === 503 || (error.message && error.message.includes("503"))) {
      if (retryCount < 2) {
        console.log(`Retrying due to 503 (Attempt ${retryCount + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return generateText(prompt, modelName, retryCount + 1, options);
      }
    }

    throw new Error(`AI Error: ${error.message || "Unknown error"}`);
  }
}

/**
 * Helper to consolidate lead preferences for vectorization.
 */
export function constructLeadRequirementText(lead: {
  full_name?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_property_types?: string[] | null;
  preferred_locations?: string[] | null;
  min_bedrooms?: number | null;
  note?: string | null;
  has_pets?: boolean | null;
}): string {
  const parts: string[] = [];
  if (lead.preferred_property_types?.length) parts.push(`Wants ${lead.preferred_property_types.join(", ")}`);
  if (lead.preferred_locations?.length) parts.push(`Location: ${lead.preferred_locations.join(", ")}`);
  if (lead.budget_max) parts.push(`Budget up to ${lead.budget_max}`);
  if (lead.min_bedrooms) parts.push(`Min ${lead.min_bedrooms} bedrooms`);
  if (lead.has_pets) parts.push("Pet friendly required");
  if (lead.note) parts.push(`Extra details: ${lead.note}`);
  return parts.join(" | ") || "Looking for property";
}