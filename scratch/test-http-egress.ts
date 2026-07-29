async function testHttpEndpoints() {
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  console.log("=================================================");
  console.log(`🌐 LIVE HTTP ENDPOINT RESPONSE TEST (${baseUrl})`);
  console.log("=================================================\n");

  const endpoints = [
    { name: "Public Properties API", url: `${baseUrl}/api/public/properties` },
    { name: "Public Areas API", url: `${baseUrl}/api/public/areas` },
    { name: "Sitemap XML", url: `${baseUrl}/sitemap.xml` },
    { name: "Public Home Page", url: `${baseUrl}/` },
  ];

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(ep.url);
      const duration = Date.now() - start;
      const bodyText = await res.text();
      const bytes = Buffer.byteLength(bodyText, "utf8");

      console.log(`📌 ${ep.name}`);
      console.log(`   URL           : ${ep.url}`);
      console.log(`   Status        : ${res.status} ${res.statusText}`);
      console.log(`   Response Size : ${(bytes / 1024).toFixed(2)} KB (${bytes} bytes)`);
      console.log(`   Response Time : ${duration} ms\n`);
    } catch (err: any) {
      console.log(`❌ ${ep.name} (${ep.url}): ${err.message}\n`);
    }
  }

  console.log("=================================================");
  console.log("✅ HTTP TEST COMPLETE");
  console.log("=================================================");
}

testHttpEndpoints().catch(console.error);
