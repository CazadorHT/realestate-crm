import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const supabase = createAdminClient();
  
  console.log("Querying system_settings_v3 rows...");
  const { data: rows, error: selectErr } = await supabase
    .from("system_settings_v3")
    .select("id, tenant_id, category, key, value")
    .limit(10);
    
  if (selectErr) {
    console.error("Select error:", selectErr);
    return;
  }
  
  console.log("Existing rows in system_settings_v3:", JSON.stringify(rows, null, 2));
}

run().catch(console.error);
