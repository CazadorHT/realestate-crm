import { createAdminClient } from "../lib/supabase/admin";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const supabase = createAdminClient();
  const { data: template, error } = await supabase
    .from("contract_templates")
    .select("content")
    .eq("id", "355bf8c0-328f-47d6-9213-648dcf425448")
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log(template.content);
}

main().catch(console.error);
