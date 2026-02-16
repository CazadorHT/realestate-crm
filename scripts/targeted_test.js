import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const candidates = [
    "gemini-3-flash-preview",
    "gemini-exp-1206",
    "gemini-2.0-flash-exp",
  ];

  for (const modelName of candidates) {
    process.stdout.write(`Testing ${modelName}... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("OK");
        const response = await result.response;
        console.log(`✅ SUCCESS! Body: ${response.text().trim()}`);
    } catch (error) {
        console.log(`❌ FAILED: Status ${error.status || 'N/A'} - ${error.message.substring(0, 100)}...`);
    }
  }
}

main();
