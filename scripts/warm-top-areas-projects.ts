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
  console.log(`\n🚀 [TOP AREAS & PROJECTS WARMER] Starting on ${BASE_URL}...`);

  const topAreas = [
    "/areas/bang-na",
    "/areas/sukhumvit",
    "/areas/thong-lo",
    "/areas/asoke",
    "/areas/krungthep-kreetha",
    "/areas/chidlom-ploenchit",
    "/areas/rama-9",
    "/areas/ekkamai",
    "/areas/lat-phrao",
    "/areas/rangsit",
    "/areas/prachachuen",
    "/areas/on-nut",
    "/areas/ploenchit",
    "/areas/sathon",
    "/areas/sam-yan",
    "/areas/srinakarin",
  ];

  const topProjects = [
    "/projects/the-monument-thong-lo",
    "/projects/98-wireless",
    "/projects/via-34",
    "/projects/chaiyapruek-bangna-km15",
    "/projects/metro-sky-prachachuen",
    "/projects/centro-bangna",
    "/projects/centro-bangna-phase-2",
    "/projects/knightsbridge-prime-sathorn",
    "/projects/mantana-bangna-km15",
    "/projects/28-chidlom",
    "/projects/ashton-asoke",
    "/projects/chuan-chuen-modus-vibhavadi",
    "/projects/culture-chula",
    "/projects/culture-thonglor",
    "/projects/grandio-bangna-km5",
    "/projects/kave-wonderland",
    "/projects/life-asoke-hype",
    "/projects/life-asoke-rama-9",
    "/projects/life-one-wireless",
    "/projects/nia-by-sansiri",
  ];

  const allTargets = [...topAreas, ...topProjects];
  console.log(`Found ${allTargets.length} target URLs:`);
  console.log(`- ${topAreas.length} Top Popular Areas`);
  console.log(`- ${topProjects.length} Top Projects\n`);

  // Pass 1: Prime cache
  console.log(`--- [PASS 1: Populating Origin & Edge CDN] ---`);
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
  console.log(`🎉 [COMPLETED] Top Areas & Projects Cache Warmed: ${hitCount}/${allTargets.length} routes in HIT state.`);
  console.log(`========================================\n`);
}

run();
