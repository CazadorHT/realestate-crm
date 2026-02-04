import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ใช้ gemini-flash-latest เป็นรุ่นที่เสถียรที่สุดและมีโควต้าพร้อมใช้ในบัญชีนี้
export const geminiModel = genAI
  ? genAI.getGenerativeModel({ model: "gemini-flash-latest" })
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

    // แจ้งเตือนเรื่องโควต้าถ้าเจอ Error 429
    if (error.status === 429) {
      throw new Error(
        "โควต้า AI เต็มชั่วคราว (Rate Limit) กรุณารอสักครู่แล้วลองใหม่ครับ",
      );
    }

    throw new Error(`AI Error: ${error.message || "Unknown error"}`);
  }
}
