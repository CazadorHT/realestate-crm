import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY found");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("Listing models via raw fetch...");
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log("Found models:");
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName})`);
        console.log(`  Methods: ${m.supportedGenerationMethods.join(", ")}`);
      });
    } else {
      console.log("No models found or error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Fetch failed:", error.message);
  }
}

main();
