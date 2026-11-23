export {};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vccasset.com";

async function warmUrl(path: string, pass: number): Promise<{ path: string; status: number; vercelCache: string; cfCache: string; timeMs: number }> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const timeMs = Date.now() - start;
    const vercelCache = res.headers.get("x-vercel-cache") || "-";
    const cfCache = res.headers.get("cf-cache-status") || "-";
    return { path, status: res.status, vercelCache, cfCache, timeMs };
  } catch (err: any) {
    return { path, status: 0, vercelCache: "ERR", cfCache: "ERR", timeMs: Date.now() - start };
  }
}

async function run() {
  console.log(`\n🚀 [EXTENDED CACHE WARMER] Fetching dynamic targets from ${BASE_URL}...`);

  const staticHubs = [
    "/deposit",
    "/services",
    "/about",
    "/contact",
    "/blog",
    "/favorites",
    "/compare",
  ];

  const topProjects = [
    "/projects/all-seasons-place",
    "/projects/noble-revolve-ratchada-1",
    "/projects/anasiri-rangsit-khlong-2",
  ];

  const topStations = [
    "/near-station/bts-thong-lo",
    "/near-station/bts-ekkamai",
    "/near-station/bts-asok",
    "/near-station/bts-phrom-phong",
    "/near-station/bts-on-nut",
    "/near-station/mrt-phra-ram-9",
    "/near-station/mrt-sukhumvit",
    "/near-station/mrt-thailand-cultural-centre",
  ];

  let topProperties: string[] = [];
  try {
    const res = await fetch(`${BASE_URL}/api/public/properties?limit=12`, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.properties)) {
        topProperties = data.properties
          .filter((p: any) => Boolean(p.slug))
          .map((p: any) => `/properties/${encodeURIComponent(p.slug)}`);
      }
    }
  } catch (err) {
    console.warn("Could not fetch top properties dynamically, skipping property slugs:", err);
  }

  const allTargets = [
    ...staticHubs,
    ...topProperties,
    ...topProjects,
    ...topStations,
  ];

  console.log(`\nFound ${allTargets.length} target URLs to warm up:`);
  console.log(`- ${staticHubs.length} Static & Lead Hubs`);
  console.log(`- ${topProperties.length} Top Property Detail Pages`);
  console.log(`- ${topProjects.length} Top Project Detail Pages`);
  console.log(`- ${topStations.length} Top Transit Station Pages\n`);

  // Pass 1: Prime cache
  console.log(`--- [PASS 1: Priming Edge CDN & Serverless Caches] ---`);
  for (const path of allTargets) {
    const r = await warmUrl(path, 1);
    console.log(`[PASS 1] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path}`);
  }

  // Edge synchronization pause
  console.log(`\n⏳ Waiting 3 seconds for Cloudflare Edge replication...`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Pass 2: Verify MISS -> HIT transition
  console.log(`\n--- [PASS 2: Verifying MISS -> HIT Transition] ---`);
  let hitCount = 0;
  for (const path of allTargets) {
    const r = await warmUrl(path, 2);
    const isHit = r.vercelCache === "HIT" || r.cfCache === "HIT";
    if (isHit) hitCount++;
    console.log(`[PASS 2] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path} ${isHit ? "✅ HIT" : "⚠️ MISS"}`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 [COMPLETED] Extended cache warmed: ${hitCount}/${allTargets.length} routes in HIT state.`);
  console.log(`========================================\n`);
}

run();
