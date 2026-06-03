import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", "d30bd3b8-f1b9-4186-b4f5-2cba5b6aa283")
    .single();
  console.log("Profile:", profile);

  const { data: identity } = await supabase
    .from("identities_v3")
    .select("*")
    .eq("id", "d30bd3b8-f1b9-4186-b4f5-2cba5b6aa283");
  console.log("Identity:", identity);

  const { data: tenantMembers } = await supabase
    .from("tenant_members_v3")
    .select("*")
    .eq("identity_id", "d30bd3b8-f1b9-4186-b4f5-2cba5b6aa283");
  console.log("Tenant Members V3:", tenantMembers);
}

run();
