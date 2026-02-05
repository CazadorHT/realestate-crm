const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found in .env");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Note: The Node SDK might not expose listModels directly on genAI instance in older versions, 
  // but let's try via the underlying model manager if accessible or just try to instantiate common ones.
  // Actually, for the google-generative-ai package, listing models is often done via the API directly or specific SDK methods.
  // Let's rely on a direct fetch to the API endpoint which is more reliable for raw checking.
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Available Models:");
    data.models.forEach(m => {
        console.log(`- ${m.name}`);
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

main();
