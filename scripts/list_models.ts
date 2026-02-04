import * as dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (${m.supportedGenerationMethods})`);
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
