import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  const { data: leads, error: leadsErr } = await supabase
    .from("crm_leads_v3")
    .select("id, identity_id, tenant_id");

  if (leadsErr) {
    console.error("Error crm_leads_v3:", leadsErr);
    return;
  }

  console.log("Leads:");
  for (const lead of leads || []) {
    console.log(`Lead ID: ${lead.id}, Lead tenant_id: ${lead.tenant_id}, Identity ID: ${lead.identity_id}`);
    
    if (lead.identity_id) {
      const { data: identity, error: identityErr } = await supabase
        .from("identities_v3")
        .select("id, display_name, tenant_id")
        .eq("id", lead.identity_id)
        .single();
        
      if (identityErr) {
        console.error(`Error identities_v3 for ID ${lead.identity_id}:`, identityErr);
      } else {
        console.log(`  -> Identity: ID ${identity.id}, Display Name: ${identity.display_name}, tenant_id: ${identity.tenant_id}`);
      }
    }
  }
}

run().catch(console.error);
