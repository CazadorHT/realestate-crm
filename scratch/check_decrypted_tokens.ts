import { createAdminClient } from "../lib/supabase/admin";
import { decryptValue } from "../features/site-settings/actions";

async function main() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("system_settings_v3")
    .select("key, value")
    .in("key", ["meta_page_access_token", "meta_user_access_token", "meta_page_id", "meta_page_name"]);

  console.log("Found settings in DB:");
  for (const row of (data || [])) {
    const val = await decryptValue(row.key, row.value);
    console.log(`- ${row.key}: ${val}`);
  }
}

main().catch(console.error);
