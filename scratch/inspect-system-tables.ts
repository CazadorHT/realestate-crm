import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  console.log("Checking site_settings...");
  const { data: siteSettings, error: siteErr } = await supabase
    .from("site_settings")
    .select("*");
  if (siteErr) {
    console.error("Error site_settings:", siteErr);
  } else {
    console.log("site_settings rows:", JSON.stringify(siteSettings, null, 2));
  }

  console.log("\nChecking system_settings_v3...");
  const { data: systemSettings, error: sysErr } = await supabase
    .from("system_settings_v3")
    .select("*");
  if (sysErr) {
    console.error("Error system_settings_v3:", sysErr);
  } else {
    console.log("system_settings_v3 rows:", JSON.stringify(systemSettings, null, 2));
  }
}

run().catch(console.error);
