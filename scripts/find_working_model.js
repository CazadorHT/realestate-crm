const https = require('https');
require("dotenv").config({ path: ".env" });

const apiKey = process.env.GEMINI_API_KEY;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Fetching model list...");
  const listRes = await makeRequest('GET', `/v1beta/models?key=${apiKey}`);
  
  if (listRes.statusCode !== 200) {
    console.error("Failed to list models:", listRes.statusCode, listRes.body);
    return;
  }

  const data = JSON.parse(listRes.body);
  const models = data.models
    .filter(m => m.supportedGenerationMethods.includes("generateContent"))
    .map(m => m.name.replace("models/", ""));

  console.log(`Found ${models.length} candidate models. Testing generation...`);

  // Prioritize 1.5 and 2.0 models
  const prioritized = models.sort((a, b) => {
     const scoreA = (a.includes("1.5") ? 2 : 0) + (a.includes("flash") ? 1 : 0);
     const scoreB = (b.includes("1.5") ? 2 : 0) + (b.includes("flash") ? 1 : 0);
     return scoreB - scoreA;
  });

  for (const model of prioritized) {
    process.stdout.write(`Testing ${model}... `);
    const genRes = await makeRequest('POST', `/v1beta/models/${model}:generateContent?key=${apiKey}`, JSON.stringify({
       contents: [{ parts: [{ text: "Hello" }] }]
    }));

    if (genRes.statusCode === 200) {
      console.log("✅ SUCCESS!");
      console.log("WORKING MODEL FOUND:", model);
      return; // Found one!
    } else {
      console.log(`❌ ${genRes.statusCode}`);
    }
  }
  
  console.log("No working models found.");
}

main();
