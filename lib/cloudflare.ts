import { siteConfig } from "./site-config";

/**
 * [S-Tier] Cloudflare Cache Purge Utility
 * Automatically clears Cloudflare edge cache when properties, projects, or content are updated.
 */
export async function purgeCloudflareCache(pathsOrUrls?: string[]) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !token || token === "your_cloudflare_api_token_here") {
    console.warn("[Cloudflare] Caching credentials missing or placeholder used. Skipping cache purge.");
    return { success: false, message: "Missing credentials" };
  }

  try {
    let baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || siteConfig.url || "https://vccasset.com").replace(/\/+$/, "");
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      baseUrl = "https://vccasset.com";
    }
    
    if (pathsOrUrls && pathsOrUrls.length > 0) {
      // Normalize relative paths into full absolute URLs (Cloudflare requires full URLs on the registered domain)
      const fullUrls = Array.from(new Set(pathsOrUrls.map((p) => {
        if (p.startsWith("http://localhost") || p.startsWith("https://localhost")) {
          return p.replace(/https?:\/\/localhost(:\d+)?/, "https://vccasset.com");
        }
        if (p.startsWith("http://") || p.startsWith("https://")) return p;
        return `${baseUrl}${p.startsWith("/") ? "" : "/"}${p}`;
      })));
      console.log(`[Cloudflare] Initiating targeted cache purge for ${fullUrls.length} URLs:`, fullUrls);

      // Cloudflare allows up to 30 URLs per batch on all plans for free.
      // Batch into chunks of 30 to guarantee NO URLs are silently truncated.
      const BATCH_SIZE = 30;
      const batches: string[][] = [];
      for (let i = 0; i < fullUrls.length; i += BATCH_SIZE) {
        batches.push(fullUrls.slice(i, i + BATCH_SIZE));
      }

      const results = await Promise.all(
        batches.map(async (batch) => {
          const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ files: batch }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            console.error("[Cloudflare] Batch cache purge failed:", data.errors || data);
            return { success: false, errors: data.errors };
          }
          return { success: true };
        })
      );

      const allSuccess = results.every((r) => r.success);
      if (!allSuccess) {
        return { success: false, message: "Some purge batches failed" };
      }
      console.log(`[Cloudflare] Edge cache purged successfully for all ${fullUrls.length} URLs.`);
      return { success: true };
    } else {
      console.log(`[Cloudflare] Initiating full cache purge for Zone: ${zoneId}`);
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purge_everything: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("[Cloudflare] Cache purge failed:", data.errors || data);
        return { success: false, errors: data.errors };
      }
      console.log("[Cloudflare] Full edge cache purged successfully.");
      return { success: true };
    }
  } catch (error) {
    console.error("[Cloudflare] Error calling cache purge API:", error);
    return { success: false, error };
  }
}
