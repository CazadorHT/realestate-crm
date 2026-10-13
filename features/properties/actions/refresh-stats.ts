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
    const tagsToRevalidate = [
      "projects",
      "popular-areas",
      "provinces",
    ];

    for (const tag of tagsToRevalidate) {
      try {
        revalidateTag(tag, "max");
      } catch {
        // Fallback if revalidateTag is not available in current scope
      }
    }
  } catch (error) {
    console.error("[Revalidate] Error revalidating stats tags:", error);
  }

  if (projectSlug) {
    try {
      const projectPaths = [
        `/projects/${projectSlug}`,
        `/en/projects/${projectSlug}`,
        `/zh/projects/${projectSlug}`,
        `/ru/projects/${projectSlug}`,
      ];
      for (const p of projectPaths) {
        try {
          revalidatePath(p);
        } catch {}
      }
      await purgeCloudflareCache(projectPaths);
    } catch (e) {
      console.error("[Cloudflare] Project auto-purge failed:", e);
    }
  }
}
