import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: "vcconnect.asset@gmail.com",
  });
  
  if (error) {
    console.error("Error generating link:", error);
    return;
  }
  console.log("Generate link output:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
