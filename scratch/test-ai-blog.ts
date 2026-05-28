import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function test() {
  console.log("Testing generateText directly with model 'gemini-2.5-flash'...");
  try {
    const { generateText } = await import("../lib/ai/gemini");
    const result = await generateText(
      "ทดสอบพิมพ์คำทักทายภาษาอังกฤษสั้นๆ 1 คำ",
      "gemini-2.5-flash"
    );
    console.log("SUCCESS! Result generated:");
    console.log("Response:", result.text.trim());
  } catch (error: any) {
    console.error("FAILED! AI generation error:", error);
  }
}

test();
