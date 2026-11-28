import { PROPERTY_PUBLIC_PATHS } from "../features/properties/actions/revalidate-property-cache";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vccasset.com";
const PASS1_DELAY_MS = 250;
const ERROR_BACKOFF_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function warmUrl(path: string, pass: number): Promise<{ path: string; status: number; vercelCache: string; cfCache: string; timeMs: number }> {
  const url = `${BASE_URL}${path}`;
  const attempt = async () => {
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      await res.text();
      const timeMs = Date.now() - start;
      const vercelCache = res.headers.get("x-vercel-cache") || "-";
      const cfCache = res.headers.get("cf-cache-status") || "-";
      return { path, status: res.status, vercelCache, cfCache, timeMs };
    } catch {
      return { path, status: 0, vercelCache: "ERR", cfCache: "ERR", timeMs: Date.now() - start };
    }
  };

  let res = await attempt();
  if ((res.status === 0 || res.status >= 500) && pass === 1) {
    await sleep(ERROR_BACKOFF_MS);
    res = await attempt();
  }
  return res;
}

const EXTRA_API_PATHS = [
  "/api/public/properties?listing_type=SALE&limit=12",
  "/api/public/properties?listing_type=RENT&limit=12",
];

async function run() {
  const targetPaths = [...PROPERTY_PUBLIC_PATHS, ...EXTRA_API_PATHS];
  console.log(`\n🚀 [CACHE WARMER] Starting cache warm-up on ${BASE_URL}...`);
  console.log(`Total URLs to warm: ${targetPaths.length}\n`);

  // Pass 1: Initial load (populates serverless & CDN)
  console.log(`--- [PASS 1: Populating Origin & Edge CDN] ---`);
  for (const path of targetPaths) {
    const r = await warmUrl(path, 1);
    console.log(`[PASS 1] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path}`);
    if (r.vercelCache !== "HIT" && r.cfCache !== "HIT") {
      await sleep(PASS1_DELAY_MS);
    }
  }

  // Brief pause to allow edge nodes to synchronize
  console.log(`\n⏳ Waiting 3 seconds for Edge replication...`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Pass 2: Verify MISS -> HIT transition
  console.log(`\n--- [PASS 2: Verifying MISS -> HIT Transition] ---`);
  let hitCount = 0;
  for (const path of targetPaths) {
    const r = await warmUrl(path, 2);
    const isHit = r.vercelCache === "HIT" || r.cfCache === "HIT";
    if (isHit) hitCount++;
    console.log(`[PASS 2] ${r.status} | Vercel: ${r.vercelCache.padEnd(8)} | CF: ${r.cfCache.padEnd(8)} | ${r.timeMs}ms | ${path} ${isHit ? "✅ HIT" : "⚠️ MISS"}`);
  }

  console.log(`\n========================================`);
  console.log(`🎉 [COMPLETED] Cache warmed: ${hitCount}/${targetPaths.length} routes in HIT state.`);
  console.log(`========================================\n`);
  process.exit(0);
}

run();
