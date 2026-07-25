import { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

/**
 * Triggers refresh of PostgreSQL Materialized View `mv_project_property_stats`
 * and revalidates Next.js public projects cache tags.
 */
export async function refreshProjectStatsView(supabase: SupabaseClient) {
  try {
    await supabase.rpc("refresh_project_property_stats");
  } catch (error) {
    console.error("[RPC] Failed to refresh project property stats view:", error);
  }
  revalidateTag("projects", "seconds");
  revalidateTag("public-data", "seconds");
}
