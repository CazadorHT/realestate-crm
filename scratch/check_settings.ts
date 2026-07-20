import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  
  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "system_config")
    .maybeSingle();

  if (error) {
    console.error("Error fetching settings:", error);
    return;
  }

  console.log("System Config Value:");
  console.log(JSON.stringify(settings?.value, null, 2));
}

main().catch(console.error);
