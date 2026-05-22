import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Fetching policies for crm_leads_v3 and identities_v3...");
  const { data: policies, error } = await supabase
    .from("pg_policies")
    .select("tablename, policyname, permissive, roles, cmd, qual, with_check")
    .in("tablename", ["crm_leads_v3", "identities_v3", "tenants_v3"]);

  if (error) {
    // pg_policies might need raw sql or rpc if it's not exposed as a table, let's try direct postgres query
    console.error("Direct select from pg_policies failed. Trying RPC or checking table details...");
    
    // We can run a query using pg_catalog if pg_policies is not accessible via supabase client directly
    // Let's run a query via supabase.rpc if any, or just check what error we get.
    console.error(error);
  } else {
    console.log("Policies:", policies);
  }
}

run().catch(console.error);
