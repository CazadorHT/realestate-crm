import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", "social_automation_keywords")
    .maybeSingle();

  if (error) {
    console.error("Error fetching social keywords:", error);
    return;
  }

  if (!data) {
    console.log("No social automation keywords setting found in database.");
    return;
  }

  console.log("Raw value type:", typeof data.value);
  console.log("Raw value:", data.value);
}

main().catch(console.error);
