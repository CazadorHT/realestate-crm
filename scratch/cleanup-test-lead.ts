import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();
  const testLeadId = "6f82600c-2a86-42c9-8865-a3ea162f210b";

  console.log(`Querying test lead ${testLeadId}...`);
  const { data: lead, error: leadErr } = await supabase
    .from("crm_leads_v3")
    .select("identity_id")
    .eq("id", testLeadId)
    .single();

  if (leadErr || !lead) {
    console.error("Test lead not found or error:", leadErr);
    return;
  }

  console.log(`Deleting test lead ${testLeadId}...`);
  await supabase.from("crm_leads_v3").delete().eq("id", testLeadId);

  if (lead.identity_id) {
    console.log(`Deleting associated identity ${lead.identity_id}...`);
    await supabase.from("identities_v3").delete().eq("id", lead.identity_id);
  }

  console.log("Cleanup complete!");
}

run().catch(console.error);
