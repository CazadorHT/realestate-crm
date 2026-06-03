import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // Query site_settings view as admin/service role first to see what is there
  const { data: viewSettings, error: viewError } = await supabase
    .from("site_settings")
    .select("tenant_id, key, value")
    .order("updated_at", { ascending: true });

  if (viewError) {
    console.error(viewError);
    return;
  }

  console.log("All rows in site_settings view:");
  viewSettings.forEach((row) => {
    if (row.key.includes("template")) {
      console.log(`- Tenant: ${row.tenant_id}, Key: ${row.key}, Value: ${JSON.stringify(row.value)}`);
    }
  });
}

run();
