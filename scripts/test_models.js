const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const candidates = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash", 
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro"
  ];

  console.log("Testing model generation...");

  for (const modelName of candidates) {
    process.stdout.write(`Testing ${modelName}... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        // Access text to ensure it really worked
        const text = response.text(); 
        console.log(`✅ SUCCESS!`);
        console.log(`   Response: ${text.substring(0, 50)}...`);
    } catch (error) {
        console.log(`❌ FAILED: ${error.message.split('[')[0]}`); // Print concise error
        // console.error(error);
    }
  }
}

main();
