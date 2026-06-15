import "dotenv/config";

async function getModelDetails() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found in environment");
    return;
  }

  const model = "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;

  try {
    console.log(`Getting details for ${model}...`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Referer": "https://vccasset.com",
      }
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

getModelDetails();
