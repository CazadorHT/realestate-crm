import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ใช้ gemini-flash-latest เป็นรุ่นที่เสถียรที่สุดและมีโควต้าพร้อมใช้ในบัญชีนี้
// Use gemini-pro-latest which is the valid Pro model alias in this environment
export const geminiModel = genAI
  ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  : null;

export async function generateText(prompt: string): Promise<string> {
  if (!geminiModel) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  try {
    const result = await geminiModel.generateContent(prompt);
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
        const resultRetry = await geminiModel.generateContent(prompt);
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
