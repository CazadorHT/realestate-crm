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
    { name: "gemini-2.5-pro", versions: ["v1", "v1beta"] },
    { name: "gemini-3-flash-preview", versions: ["v1", "v1beta"] },
    { name: "gemini-3-pro-preview", versions: ["v1", "v1beta"] },
    { name: "gemini-2.5-flash-lite", versions: ["v1", "v1beta"] },
    { name: "gemini-2.0-flash-001", versions: ["v1", "v1beta"] }, // just in case
  ];

  console.log("\nTesting 1.5K RPD & Preview candidates...");

  for (const item of candidates) {
    for (const apiVersion of item.versions) {
      process.stdout.write(`Testing ${item.name} (${apiVersion})... `);
      try {
          const model = genAI.getGenerativeModel({ model: item.name }, { apiVersion });
          const result = await model.generateContent("OK?");
          const response = await result.response;
          console.log(`✅ SUCCESS! Body: ${response.text().trim()}`);
      } catch (error) {
          console.log(`❌ FAILED: Status ${error.status || 'N/A'} - ${error.message.substring(0, 100)}...`);
      }
    }
  }
}

main();
