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
    .select("*")
    .eq("key", "site_description");

  console.log("system_settings_v3 site_description:", settings);
  if (error) console.error("Error:", error);

  const { data: oldSettings, error: oldError } = await supabase
    .from("site_settings")
    .select("*")
    .eq("key", "site_description");

  console.log("site_settings view site_description:", oldSettings);
  if (oldError) console.error("Old Error:", oldError);
}

run();
