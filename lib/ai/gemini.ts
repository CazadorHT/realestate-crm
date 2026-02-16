import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Default model for backwards compatibility
const DEFAULT_MODEL = "gemini-flash-latest";

/**
 * Get a specific generative model by name
 */
export function getModel(modelName: string = DEFAULT_MODEL) {
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

export async function generateText(
  prompt: string,
  modelName: string = DEFAULT_MODEL,
): Promise<string> {
  const model = getModel(modelName);

  if (!model) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini generation error detail:", {
      message: error.message,
      status: error.status,
    });

    // Retry for 503 Service Unavailable
    if (
      error.status === 503 ||
      (error.message && error.message.includes("503"))
    ) {
      console.log("Retrying due to 503...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const resultRetry = await model.generateContent(prompt);
        const responseRetry = await resultRetry.response;
        return responseRetry.text();
      } catch (retryError: any) {
        console.error("Retry failed:", retryError);
        // Fall through to throw
      }
    }

    // แจ้งเตือนเรื่องโควต้าถ้าเจอ Error 429
    if (error.status === 429) {
      throw new Error(
        "[RATE_LIMIT] โควต้า AI เต็มชั่วคราว (Rate Limit) กรุณารอสักครู่แล้วลองใหม่ครับ",
      );
    }

    throw new Error(`AI Error: ${error.message || "Unknown error"}`);
  }
}
