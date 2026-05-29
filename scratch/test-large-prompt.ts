import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    { 
      model: "gemini-3.1-flash-lite",
      systemInstruction: "You are a world-class SEO content strategist. Return ONLY a single valid JSON object."
    },
    {
      customHeaders: {
        Referer: "https://vccasset.com",
      },
    }
  );

  const prompt = `
    คุณเป็น "Global SEO Content Master" และ "Real Estate Analyst" 
    เขียนบทความคุณภาพสูง (Diamond Grade Content) เรื่อง: "คอนโดหรู ย่านทองหล่อ"
    ภาษา: ไทย (และเนื้อหาสรุปใน EN, CN, RU)
    กลุ่มเป้าหมาย: นักลงทุนอสังหาฯ
    โทน: ทางการ
    ความยาวขั้นต่ำ: ประมาณ 1,500 - 2,000 คำ

    RESPONSE FORMAT (JSON ONLY):
    {
      "title": "...",
      "title_en": "...",
      "title_cn": "...",
      "title_ru": "...",
      "slug": "url-friendly-english-slug",
      "excerpt": "150-160 chars summary for SEO",
      "excerpt_en": "...",
      "content": "Full HTML Content (TH) including Table, FAQ, Infographic Ideas, and CTAs",
      "category": "...",
      "tags": "tag1, tag2, tag3",
      "seo_score": 95,
      "faqs": [
        { "question": "...", "answer": "..." }
      ],
      "structured_data": []
    }
  `;

  try {
    console.log("Sending large prompt to gemini-3.1-flash-lite...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192
      }
    });
    const response = await result.response;
    console.log("Success! Tokens used:", response.usageMetadata);
  } catch (error: any) {
    console.error("Failed to generate content. Error:", error);
  }
}

test();
