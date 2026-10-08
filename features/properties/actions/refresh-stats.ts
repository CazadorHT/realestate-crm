import { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag, revalidatePath } from "next/cache";
import { purgeCloudflareCache } from "@/lib/cloudflare";

/**
 * Triggers refresh of PostgreSQL Materialized View `mv_project_property_stats`,
 * purges Cloudflare edge cache, and revalidates Next.js ISR & Data Cache for public property/project pages.
 */
export async function refreshProjectStatsView(supabase: SupabaseClient) {
  try {
    if (typeof supabase.rpc === "function") {
      await supabase.rpc("refresh_project_property_stats");
    }
  } catch (error) {
    console.error("[RPC] Failed to refresh project property stats view:", error);
  }
  
  try {
    revalidatePath("/properties");
    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath("/", "layout");
    revalidatePath("/api/public/popular-areas");
    revalidatePath("/api/public/properties");
    
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
        revalidateTag(tag, "seconds");
      } catch {
        (revalidateTag as any)(tag);
      }
    }
  } catch (error) {
    console.error("[Revalidate] Error revalidating paths/tags:", error);
  }

  purgeCloudflareCache([
    "/",
    "/projects",
    "/properties",
    "/api/public/popular-areas",
    "/api/public/properties",
  ]).catch((e) => console.error("[Cloudflare] Auto-purge failed:", e));
}
