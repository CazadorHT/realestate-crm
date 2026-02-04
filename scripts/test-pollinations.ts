async function testPollinations() {
  const prompt = encodeURIComponent(
    "Luxury modern villa with swimming pool at sunset, cinematic lighting, high resolution",
  );
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=720&nologo=true&seed=42`;

  try {
    console.log(`Testing Pollinations.ai: ${url}`);
    const response = await fetch(url);
    console.log("Status:", response.status);
    if (response.ok) {
      console.log(
        "✅ Success! Pollinations.ai is accessible and returned an image.",
      );
    } else {
      console.log("❌ Failed. Status:", response.status);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testPollinations();
