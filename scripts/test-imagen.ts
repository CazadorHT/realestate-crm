import * as dotenv from "dotenv";

dotenv.config();

async function testImagen() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  // Attempting the most likely Imagen endpoint for standard API
  const modelId = "imagen-3.0-generate-001"; // Or check the list again
  // Actually, let's use what showed up in the list:
  // - models/imagen-4.0-generate-001

  const model = "imagen-4.0-generate-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  const payload = {
    instances: [
      {
        prompt:
          "Modern luxury condo bedroom with large window, realistic style",
      },
    ],
    parameters: {
      sampleCount: 1,
    },
  };

  try {
    console.log(`Testing Imagen with ${model}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    if (data.predictions) {
      console.log("✅ Success! Imagen generated something.");
    } else {
      console.log("❌ Failed. Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testImagen();
