import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Checking all identities...");
  const { data: identities, error: identErr } = await supabase
    .from("identities_v3")
    .select("*");
  if (identErr) {
    console.error("Error identities:", identErr);
  } else {
    console.log(`Found ${identities?.length || 0} identities:`);
    identities?.forEach(id => {
      console.log(`- ID: ${id.id}, Display Name: ${id.display_name}, Role: ${id.role}, Tenant ID: ${id.tenant_id}`);
    });
  }
}

run().catch(console.error);
