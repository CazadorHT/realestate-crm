import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();
  const id = "95a9681b-0f77-4abb-bbcd-555afdcdf5d6";

  console.log(`Running getLeadWithActivitiesQuery equivalent as admin client for ID ${id}...`);

  const { data, error } = await supabase
    .from("crm_leads_v3")
    .select("id, stage, source, budget_min, budget_max, preferred_locations, ai_summary, created_at, updated_at, tenant_id, assigned_to, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone, line_id, social_links)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Query failed with error:", error);
  } else {
    console.log("Query succeeded! Result:", JSON.stringify(data, null, 2));
  }
}

run().catch(console.error);
