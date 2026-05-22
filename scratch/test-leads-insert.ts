import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Starting test insertions...");

  // Test inserting into identities_v3 with tenantId = null
  const tenantId = null;
  
  console.log("Testing identities_v3 insertion with tenant_id = null...");
  const { data: identity, error: identityErr } = await supabase
    .from("identities_v3")
    .insert({
      display_name: "Test Lead User",
      email: "test-lead@domain.com",
      phone: "0812345678",
      role: "LEAD",
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (identityErr) {
    console.error("identities_v3 insert error:", identityErr);
  } else {
    console.log("identities_v3 insert success, ID:", identity?.id);

    console.log("Testing crm_leads_v3 insertion...");
    const payload = {
      identity_id: identity.id,
      tenant_id: tenantId,
      source: "DIRECT",
      stage: "NEW",
      status: "ACTIVE",
      budget_min: null,
      budget_max: null,
      min_bedrooms: null,
      preferred_locations: null,
      updated_at: new Date().toISOString(),
    };

    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .insert(payload)
      .select("id")
      .single();

    if (leadErr) {
      console.error("crm_leads_v3 insert error:", leadErr);
    } else {
      console.log("crm_leads_v3 insert success, ID:", lead?.id);
      
      // Clean up
      console.log("Cleaning up crm_leads_v3...");
      await supabase.from("crm_leads_v3").delete().eq("id", lead.id);
    }

    console.log("Cleaning up identities_v3...");
    await supabase.from("identities_v3").delete().eq("id", identity.id);
  }
}

run().catch(console.error);
