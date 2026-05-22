import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();
  const targetTenantId = "7a22837c-2f21-4475-bc58-ce46476816d8"; // My First Tenant

  console.log("Repairing crm_leads_v3...");
  const { data: leadsUpdated, error: leadsErr } = await supabase
    .from("crm_leads_v3")
    .update({ tenant_id: targetTenantId })
    .is("tenant_id", null)
    .select("id, identity_id");

  if (leadsErr) {
    console.error("Error updating crm_leads_v3:", leadsErr);
  } else {
    console.log(`Successfully updated ${leadsUpdated?.length || 0} leads in crm_leads_v3.`);
    
    for (const lead of leadsUpdated || []) {
      if (lead.identity_id) {
        console.log(`Updating identity ${lead.identity_id} for lead ${lead.id}...`);
        const { error: identityErr } = await supabase
          .from("identities_v3")
          .update({ tenant_id: targetTenantId })
          .eq("id", lead.identity_id);
          
        if (identityErr) {
          console.error(`Error updating identities_v3 for ID ${lead.identity_id}:`, identityErr);
        } else {
          console.log(`Successfully updated identity ${lead.identity_id}.`);
        }
      }
    }
  }
}

run().catch(console.error);
