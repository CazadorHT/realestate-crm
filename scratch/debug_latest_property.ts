import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function debugLatest() {
  const supabase = createAdminClient();

  // 1. Fetch latest created properties
  const { data: latestProps } = await supabase
    .from("properties")
    .select("id, title, status, project_id, created_at, deleted_at, main_image, price, rental_price")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("=== Latest 5 Properties in DB ===");
  console.dir(latestProps, { depth: null });

  if (latestProps && latestProps.length > 0) {
    const latest = latestProps[0];
    if (latest.project_id) {
      // Check project status
      const { data: proj } = await supabase.from("projects").select("id, name, is_active").eq("id", latest.project_id).single();
      console.log("\n=== Project info for latest property ===");
      console.log(proj);

      // Check stats in mv_project_property_stats for this project
      const { data: stat } = await supabase.from("mv_project_property_stats").select("*").eq("project_id", latest.project_id).maybeSingle();
      console.log("\n=== Stats in mv_project_property_stats ===");
      console.log(stat);
    } else {
      console.log("\n⚠️ Latest property has NO project_id assigned!");
    }
  }
}

debugLatest().catch(console.error);
