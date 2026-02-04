import fs from "fs";

async function testPollinations() {
  const prompt = "modern house";
  const seed = Math.floor(Math.random() * 1000);

  // Try Flux model
  const url = `https://image.pollinations.ai/prompt/${prompt}?nologo=true&seed=${seed}&model=flux`;

  console.log(`Testing: ${url}`);
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      console.log(`Size: ${buffer.byteLength} bytes`);
      console.log("✅ Flux model works!");
    } else {
      console.log("❌ Flux model failed");
    }
  } catch (error) {
    console.error(`Error:`, error);
  }
}

testPollinations();
