const https = require('https');
require("dotenv").config({ path: ".env" });

function postRequest(modelName, apiVersion = "v1beta") {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const path = `/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
    
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
            statusCode: res.statusCode,
            body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }]
    }));
    req.end();
  });
}

async function main() {
    const candidates = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002", 
        "gemini-1.5-flash-8b",
        "gemini-pro"
    ];

    console.log("Testing REST API...");
    
    for (const m of candidates) {
        // Try v1beta
        process.stdout.write(`Testing ${m} (v1beta)... `);
        try {
            const res = await postRequest(m, "v1beta");
            if (res.statusCode === 200) {
                console.log("✅ SUCCESS!");
            } else {
                console.log(`❌ FAILED ${res.statusCode}`);
                // console.log(res.body.substring(0, 100)); 
            }
        } catch (e) {
            console.log("ERR: " + e.message);
        }

        // Try v1
        process.stdout.write(`Testing ${m} (v1)... `);
        try {
             const res = await postRequest(m, "v1");
            if (res.statusCode === 200) {
                console.log("✅ SUCCESS!");
            } else {
                console.log(`❌ FAILED ${res.statusCode}`);
            }
        } catch (e) {
             console.log("ERR: " + e.message);
        }
    }
}

main();
