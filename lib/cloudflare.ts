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
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || siteConfig.url || "https://vccasset.com").replace(/\/+$/, "");
    
    let body: Record<string, unknown>;
    if (pathsOrUrls && pathsOrUrls.length > 0) {
      // Normalize relative paths into full absolute URLs (Cloudflare requires full URLs)
      const fullUrls = pathsOrUrls.map((p) => {
        if (p.startsWith("http://") || p.startsWith("https://")) return p;
        return `${baseUrl}${p.startsWith("/") ? "" : "/"}${p}`;
      });
      console.log(`[Cloudflare] Initiating targeted cache purge for ${fullUrls.length} URLs:`, fullUrls);
      // Cloudflare allows up to 30 URLs per batch on all plans for free
      body = { files: fullUrls.slice(0, 30) };
    } else {
      console.log(`[Cloudflare] Initiating full cache purge for Zone: ${zoneId}`);
      body = { purge_everything: true };
    }

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
