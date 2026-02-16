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
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-pro-latest",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-exp-1206",
  ];

  console.log("\nExhaustive Testing...");

  for (const modelName of candidates) {
    process.stdout.write(`Testing ${modelName}... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Just say 'YES'");
        const response = await result.response;
        console.log(`✅ SUCCESS! Body: ${response.text().trim()}`);
    } catch (error) {
        console.log(`❌ FAILED: Status ${error.status || 'N/A'} - ${error.message.substring(0, 100)}...`);
    }
  }
}

main();
