import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSettings() {
  const { data, error } = await supabase.from("site_settings").select("key");
  if (error) {
    console.error(error);
    return;
  }
  console.log("Keys in site_settings:", data.map(d => d.key));

  const { data: branding } = await supabase.from("site_settings").select("value").eq("key", "branding").single();
  if (branding) {
    console.log("Branding value:", JSON.stringify(branding.value, null, 2));
  } else {
    console.log("No branding key found in site_settings.");
  }
}

checkSettings();
