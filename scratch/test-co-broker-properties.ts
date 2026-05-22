import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("properties_core")
    .select(`
      id,
      co_broker_id,
      properties_details(title)
    `)
    .not("co_broker_id", "is", null)
    .limit(5);
  
  if (error) {
    console.error("Error fetching properties:", error);
    return;
  }
  console.log("Properties with co-brokers:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
