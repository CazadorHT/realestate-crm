import { createClient } from "@supabase/supabase-js";
import { decrypt } from "../lib/crypto";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("identities_v3")
    .select("id, display_name, role, category, tenant_id")
    .is("deleted_at", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("=== Identities in identities_v3 ===");
  data.forEach((item) => {
    console.log({
      id: item.id,
      name: decrypt(item.display_name) || "Unnamed",
      role: item.role,
      category: item.category,
      tenant_id: item.tenant_id,
    });
  });
}

run().catch(console.error);
