import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("system_settings_v3")
    .select("*")
    .eq("key", "facebook_url");

  console.log("DB data for facebook_url:", data, error);
}

check();
