import * as dotenv from "dotenv";

dotenv.config();

async function testImageGen() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  // We'll try the Gemini 2.0 Flash Image Generation experimental model if available
  // Or the Imagen models.
  // Based on the previous list, models/gemini-2.0-flash-exp-image-generation exists.

  const modelId = "gemini-3-pro-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "A professional real estate photography of a luxury modern living room with large windows and city view, high quality, 8k",
          },
        ],
      },
    ],
  };

  try {
    console.log(`Testing Image Gen with ${modelId}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    if (data.candidates && data.candidates[0].content.parts[0].inlineData) {
      console.log("✅ Success! Image data received.");
    } else {
      console.log("❌ Failed. Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testImageGen();
