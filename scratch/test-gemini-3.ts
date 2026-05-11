
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import * as dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testGemini3() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS?.split(',')[0];
  
  if (!apiKey) {
    console.error("❌ ไม่พบ GEMINI_API_KEY ในไฟล์ .env");
    return;
  }

  console.log("🚀 กำลังเริ่มทดสอบ Gemini 3.1 Flash-Lite...");
  console.log("-----------------------------------------");

  try {
    const startTime = Date.now();
    
    const { text } = await generateText({
      model: google("gemini-3.1-flash-lite"),
      prompt: "ช่วยสรุปสั้นๆ ว่า 'อสังหาริมทรัพย์ในกรุงเทพฯ ปี 2026 มีแนวโน้มอย่างไร' เป็นภาษาไทย",
    });

    const duration = (Date.now() - startTime) / 1000;

    console.log("✅ การทดสอบสำเร็จ!");
    console.log(`⏱️ เวลาที่ใช้: ${duration} วินาที`);
    console.log("📝 คำตอบจาก AI:");
    console.log(text);
    console.log("-----------------------------------------");
  } catch (error: any) {
    console.error("❌ การทดสอบล้มเหลว:");
    console.error(error.message);
    if (error.message.includes("404")) {
      console.log("💡 คำแนะนำ: รุ่นนี้อาจจะยังไม่เปิดให้ใช้ใน Region ของคุณ หรือชื่อรุ่นอาจจะต่างออกไปเล็กน้อย");
    }
  }
}

testGemini3();
