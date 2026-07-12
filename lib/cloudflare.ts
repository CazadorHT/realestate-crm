import { siteConfig } from "./site-config";

/**
 * [S-Tier] Cloudflare Cache Purge Utility
 * Automatically clears Cloudflare edge cache when properties, projects, or content are updated.
 */
export async function purgeCloudflareCache() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !token || token === "your_cloudflare_api_token_here") {
    console.warn("[Cloudflare] Caching credentials missing or placeholder used. Skipping cache purge.");
    return { success: false, message: "Missing credentials" };
  }

  try {
    console.log(`[Cloudflare] Initiating cache purge for Zone: ${zoneId}`);
    
    // For Cloudflare Free/Pro plans, purging everything is the most reliable way 
    // to clear sitemaps, API endpoints with query parameters, and dynamic listing pages at once.
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purge_everything: true,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("[Cloudflare] Cache purge failed:", data.errors || data);
      return { success: false, errors: data.errors };
    }

    console.log("[Cloudflare] Edge cache purged successfully.");
    return { success: true };
  } catch (error) {
    console.error("[Cloudflare] Error calling cache purge API:", error);
    return { success: false, error };
  }
}
