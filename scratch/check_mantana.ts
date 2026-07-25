import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function check() {
  const supabase = createAdminClient();
  const projId = "ac32e137-a221-4586-9793-8c4bf40bf17e";
  
  // Count active properties in DB
  const { data: props, count } = await supabase
    .from("properties")
    .select("id, title, status, created_at", { count: "exact" })
    .eq("project_id", projId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  console.log("Actual ACTIVE properties in DB for Mantana:", count);
  console.log(props);

  // View stats in MV
  const { data: mvStat } = await supabase.from("mv_project_property_stats").select("*").eq("project_id", projId).single();
  console.log("MV stats right now:", mvStat);
}

check().catch(console.error);
