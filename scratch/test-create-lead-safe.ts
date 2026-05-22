import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { createLeadAction } from "../features/leads/actions";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const email = "vcconnect.asset@gmail.com";

  console.log(`1. Generating OTP for ${email}...`);
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.email_otp) {
    console.error("OTP generation failed:", error);
    return;
  }
  const otp = data.properties.email_otp;

  console.log("2. Authenticating user client...");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );

  const { data: verifyData, error: verifyErr } = await userClient.auth.verifyOtp({
    email,
    token: otp,
    type: "magiclink",
  });

  if (verifyErr || !verifyData.session) {
    console.error("Verification failed:", verifyErr);
    return;
  }
  
  console.log("3. Invoking createLeadAction with injected user client...");
  // Under the "ALL" view, tenantId would be passed as undefined or empty string or null.
  // We'll pass standard lead fields.
  const payload = {
    full_name: "Test Lead Fallback " + new Date().getTime(),
    email: "test.fallback@example.com",
    phone: "0812345678",
    source: "OTHER",
    stage: "NEW",
    budget_min: "1000000",
    budget_max: "2000000",
    min_bedrooms: "2",
    preferred_locations: ["Bangkok"],
  };

  const result = await createLeadAction(payload as any, userClient as any);
  
  console.log("Action execution result:", result);
  
  if (result.success) {
    const leadId = result.data.leadId;
    console.log(`\n4. Verifying lead ${leadId} in the database...`);
    const { data: dbLead, error: dbErr } = await adminClient
      .from("crm_leads_v3")
      .select("id, tenant_id, identity_id")
      .eq("id", leadId)
      .single();
      
    if (dbErr || !dbLead) {
      console.error("Failed to query inserted lead:", dbErr);
    } else {
      console.log(`Inserted Lead - ID: ${dbLead.id}, Tenant ID: ${dbLead.tenant_id}, Identity ID: ${dbLead.identity_id}`);
      
      const { data: dbIdentity, error: idErr } = await adminClient
        .from("identities_v3")
        .select("id, display_name, tenant_id")
        .eq("id", dbLead.identity_id)
        .single();
        
      if (idErr || !dbIdentity) {
        console.error("Failed to query inserted identity:", idErr);
      } else {
        console.log(`Inserted Identity - ID: ${dbIdentity.id}, Display Name: ${dbIdentity.display_name}, Tenant ID: ${dbIdentity.tenant_id}`);
        
        // Clean up testing database records to avoid cluttering
        console.log("\n5. Cleaning up test data...");
        await adminClient.from("crm_leads_v3").delete().eq("id", leadId);
        await adminClient.from("identities_v3").delete().eq("id", dbLead.identity_id);
        console.log("Cleanup complete!");
      }
    }
  } else {
    console.error("Lead creation failed:", result.error);
  }
}

run().catch(console.error);
