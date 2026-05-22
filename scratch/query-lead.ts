import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();
  const leadId = "95a9681b-0f77-4abb-bbcd-555afdcdf5d6";

  console.log(`Querying lead ${leadId}...`);
  const { data: lead, error: leadErr } = await supabase
    .from("crm_leads_v3")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr) {
    console.error("Error querying crm_leads_v3:", leadErr);
    return;
  }

  if (!lead) {
    console.log("Lead not found in crm_leads_v3");
    return;
  }

  console.log("Lead data:", JSON.stringify(lead, null, 2));

  if (lead.identity_id) {
    const { data: identity, error: identityErr } = await supabase
      .from("identities_v3")
      .select("*")
      .eq("id", lead.identity_id)
      .maybeSingle();

    if (identityErr) {
      console.error("Error querying identities_v3:", identityErr);
    } else {
      console.log("Identity data:", JSON.stringify(identity, null, 2));
    }
  }
}

run().catch(console.error);
