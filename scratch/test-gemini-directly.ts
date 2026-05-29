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
  
  try {
    console.log("Initializing gemini-3.1-flash-lite with Referer header...");
    const model = genAI.getGenerativeModel(
      { model: "gemini-3.1-flash-lite" },
      {
        customHeaders: {
          Referer: "https://vccasset.com",
        },
      }
    );
    
    console.log("Sending a test request...");
    const result = await model.generateContent("Hello, write a short sentence.");
    const response = await result.response;
    console.log("Response text:", response.text());
  } catch (error: any) {
    console.error("Failed to generate content. Full error object:", error);
    console.log("Error status:", error.status);
    console.log("Error message:", error.message);
  }
}

test();
