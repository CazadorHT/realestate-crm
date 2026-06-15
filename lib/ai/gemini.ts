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
const DEFAULT_MODEL = "gemini-flash-lite-latest";

/**
 * Normalizes model names to handle common mistakes or project-specific fallbacks
 */
function normalizeModelName(modelName: string): string {
  const unstableModels: Record<string, string> = {
    "gemini-3.1-pro": "gemini-3.1-pro-preview",
    "gemini-3-flash": "gemini-3-flash-preview",
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
    "gemini-pro-latest": "gemini-3.1-pro-preview",
    "gemini-flash-latest": "gemini-3-flash-preview",
    "gemini-flash-lite-latest": "gemini-3.1-flash-lite",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.0-flash": "gemini-2.0-flash",
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
  temperature?: number;
}) {
  const genAI = getClient();
  if (!genAI) return null;

  const normalizedModelName = normalizeModelName(modelName);
  const modelOptions: any = { model: normalizedModelName };
  
  if (options?.useSearch) {
    modelOptions.tools = [{ googleSearch: {} }];
  }

  if (options?.systemInstruction) {
    modelOptions.systemInstruction = options.systemInstruction;
  }

  if (options?.responseMimeType || options?.maxOutputTokens || options?.temperature !== undefined) {
    modelOptions.generationConfig = {
      ...modelOptions.generationConfig,
    };
    
    if (options?.responseMimeType) {
      modelOptions.generationConfig.responseMimeType = options.responseMimeType;
    }
    if (options?.maxOutputTokens) {
      modelOptions.generationConfig.maxOutputTokens = options.maxOutputTokens;
    }
    if (options?.temperature !== undefined) {
      modelOptions.generationConfig.temperature = options.temperature;
    }
  }

  return genAI.getGenerativeModel(modelOptions, {
    customHeaders: {
      Referer: "https://vccasset.com",
    },
  });
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
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" }, {
      customHeaders: {
        Referer: "https://vccasset.com",
      },
    });
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
    temperature?: number;
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

/**
 * Generates an image using Google's Gemini Image Models REST API
 * Primary: gemini-2.5-flash-image (Nano Banana)
 * Fallback: gemini-3.1-flash-image (Nano Banana 2)
 */
export async function generateImagenImage(
  prompt: string,
  retryCount: number = 0,
  useFallbackModel: boolean = false,
): Promise<Buffer | null> {
  const apiKey = API_KEYS[currentKeyIndex];
  if (!apiKey) {
    console.error("No API keys loaded for image generation");
    return null;
  }

  const model = useFallbackModel ? "gemini-3.1-flash-image" : "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://vccasset.com",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      if (rotateApiKey() && retryCount < API_KEYS.length) {
        console.log("🔄 Rotated API key and retrying image generation...");
        return generateImagenImage(prompt, retryCount + 1, useFallbackModel);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Model ${model} returned status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    let base64Image = null;
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No inlineData found in response parts");
    }

    return Buffer.from(base64Image, "base64");
  } catch (error: any) {
    console.error(`Error generating image via model ${model}:`, error);
    
    // If we haven't tried the fallback model yet, try it now!
    if (!useFallbackModel) {
      console.log("🔄 Falling back to model: gemini-3.1-flash-image (Nano Banana 2)...");
      return generateImagenImage(prompt, retryCount, true);
    }
    
    return null;
  }
}