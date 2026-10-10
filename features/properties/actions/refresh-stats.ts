import { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag, revalidatePath } from "next/cache";
import { purgeCloudflareCache } from "@/lib/cloudflare";

/**
 * Triggers refresh of PostgreSQL Materialized View `mv_project_property_stats`,
 * purges Cloudflare edge cache, and revalidates Next.js ISR & Data Cache for public property/project pages.
 */
export async function refreshProjectStatsView(supabase: SupabaseClient, projectSlug?: string) {
  try {
    if (typeof supabase.rpc === "function") {
      await supabase.rpc("refresh_project_property_stats");
    }
  } catch (error) {
    console.error("[RPC] Failed to refresh project property stats view:", error);
  }
  
  try {
    const pathsToRevalidate = [
      "/",
      "/en",
      "/zh",
      "/ru",
      "/projects",
      "/en/projects",
      "/zh/projects",
      "/ru/projects",
      "/properties",
      "/en/properties",
      "/zh/properties",
      "/ru/properties",
      "/api/public/popular-areas",
      "/api/public/properties",
    ];

    if (projectSlug) {
      pathsToRevalidate.push(
        `/projects/${projectSlug}`,
        `/en/projects/${projectSlug}`,
        `/zh/projects/${projectSlug}`,
        `/ru/projects/${projectSlug}`
      );
    }

    for (const p of pathsToRevalidate) {
      revalidatePath(p);
    }
    revalidatePath("/", "layout");
    
    const tagsToRevalidate = [
      "projects",
      "public-data",
      "properties",
      "popular-areas",
      "provinces",
      "public-properties",
      "property-facets",
    ];

    for (const tag of tagsToRevalidate) {
      try {
        revalidateTag(tag, "max");
      } catch {
        // Fallback if revalidateTag is not available in current scope
      }
    }
  } catch (error) {
    console.error("[Revalidate] Error revalidating paths/tags:", error);
  }

  try {
    const cfPaths = [
      "/",
      "/en",
      "/zh",
      "/ru",
      "/projects",
      "/en/projects",
      "/zh/projects",
      "/ru/projects",
      "/properties",
      "/api/public/popular-areas",
      "/api/public/properties",
    ];
    if (projectSlug) {
      cfPaths.push(
        `/projects/${projectSlug}`,
        `/en/projects/${projectSlug}`,
        `/zh/projects/${projectSlug}`,
        `/ru/projects/${projectSlug}`
      );
    }
    await purgeCloudflareCache(cfPaths);
  } catch (e) {
    console.error("[Cloudflare] Auto-purge failed:", e);
  }
}
