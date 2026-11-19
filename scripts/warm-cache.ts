import { PROPERTY_PUBLIC_PATHS } from "../features/properties/actions/revalidate-property-cache";

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
  console.log(`\n🚀 [CACHE WARMER] Starting cache warm-up on ${BASE_URL}...`);
  console.log(`Total URLs to warm: ${PROPERTY_PUBLIC_PATHS.length}\n`);

  // Pass 1: Initial load (populates serverless & CDN)
  console.log(`--- [PASS 1: Populating Origin & Edge CDN] ---`);
  for (const path of PROPERTY_PUBLIC_PATHS) {
    const r = await warmUrl(path, 1);
    console.log(`[PASS 1] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path}`);
  }

  // Brief pause to allow edge nodes to synchronize
  console.log(`\n⏳ Waiting 3 seconds for Edge replication...`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Pass 2: Verify MISS -> HIT transition
  console.log(`\n--- [PASS 2: Verifying MISS -> HIT Transition] ---`);
  let hitCount = 0;
  for (const path of PROPERTY_PUBLIC_PATHS) {
    const r = await warmUrl(path, 2);
    const isHit = r.vercelCache === "HIT" || r.cfCache === "HIT";
    if (isHit) hitCount++;
    console.log(`[PASS 2] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path} ${isHit ? "✅ HIT" : "⚠️ MISS"}`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 [COMPLETED] Cache warmed: ${hitCount}/${PROPERTY_PUBLIC_PATHS.length} routes in HIT state.`);
  console.log(`========================================\n`);
}

run();
