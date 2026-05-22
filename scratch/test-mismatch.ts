import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Starting empty tenantId test...");

  // Test inserting into identities_v3 with tenantId = ""
  const tenantId = "";
  
  console.log(`Testing identities_v3 insertion with tenant_id = "${tenantId}"...`);
  const { data: identity, error: identityErr } = await supabase
    .from("identities_v3")
    .insert({
      display_name: "Test Lead User Empty Tenant",
      email: "test-empty-tenant@domain.com",
      phone: "0812345678",
      role: "LEAD",
      tenant_id: tenantId as any,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (identityErr) {
    console.error("identities_v3 insert error:", identityErr);
  } else {
    console.log("identities_v3 insert success, ID:", identity?.id);
    await supabase.from("identities_v3").delete().eq("id", identity.id);
  }
}

run().catch(console.error);
