import { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag, revalidatePath } from "next/cache";
import { purgeCloudflareCache } from "@/lib/cloudflare";

/**
 * Triggers refresh of PostgreSQL Materialized View `mv_project_property_stats`,
 * purges Cloudflare edge cache, and revalidates Next.js ISR & Data Cache for public property/project pages.
 */
export async function refreshProjectStatsView(supabase: SupabaseClient) {
  try {
    await supabase.rpc("refresh_project_property_stats");
  } catch (error) {
    console.error("[RPC] Failed to refresh project property stats view:", error);
  }
  
  try {
    revalidatePath("/properties");
    revalidatePath("/projects");
    revalidatePath("/", "layout");
    revalidateTag("projects", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("properties", "seconds");
  } catch (error) {
    console.error("[Revalidate] Error revalidating paths/tags:", error);
  }

  purgeCloudflareCache().catch((e) => console.error("[Cloudflare] Auto-purge failed:", e));
}
