import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Querying all leads...");
  const { data: leads, error: leadsErr } = await supabase
    .from("crm_leads_v3")
    .select("id, tenant_id, source, stage, created_at")
    .limit(10);

  if (leadsErr) {
    console.error("Error crm_leads_v3:", leadsErr);
  } else {
    console.log(`Found ${leads?.length || 0} leads:`);
    leads?.forEach(lead => {
      console.log(`- ID: ${lead.id}, Tenant ID: ${lead.tenant_id}, Source: ${lead.source}, Stage: ${lead.stage}, Created At: ${lead.created_at}`);
    });
  }
}

run().catch(console.error);
