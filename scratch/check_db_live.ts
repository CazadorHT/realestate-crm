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
    .ilike("key", "%facebook_post_template%");

  if (error) {
    console.error(error);
    return;
  }

  console.log("Current facebook_post_template rows in DB:");
  console.log(JSON.stringify(settings, null, 2));
}

run();
