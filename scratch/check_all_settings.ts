import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: settings, error } = await supabase
    .from("system_settings_v3")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }
  console.log("Settings keys and values:");
  settings.forEach((s) => {
    console.log(`- Tenant: ${s.tenant_id}, Category: ${s.category}, Key: ${s.key}, Value: ${JSON.stringify(s.value)}`);
  });
}

run();
