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
    .ilike("key", "%line_post_template%");

  console.log("system_settings_v3 line_post_template rows:", JSON.stringify(settings, null, 2));
  if (error) console.error("Error:", error);
}

run();
