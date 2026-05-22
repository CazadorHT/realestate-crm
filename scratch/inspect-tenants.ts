import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Querying all tenants...");
  const { data: tenants, error: tenantsErr } = await supabase
    .from("tenants_v3")
    .select("id, name, slug");

  if (tenantsErr) {
    console.error("Error tenants_v3:", tenantsErr);
  } else {
    console.log(`Found ${tenants?.length || 0} tenants:`);
    tenants?.forEach(tenant => {
      console.log(`- ID: ${tenant.id}, Name: ${tenant.name}, Slug: ${tenant.slug}`);
    });
  }
}

run().catch(console.error);
