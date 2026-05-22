import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();
  const userId = "d30bd3b8-f1b9-4186-b4f5-2cba5b6aa283";

  console.log(`Checking profile for user ${userId}...`);
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    console.error("Error profiles:", profErr);
  } else {
    console.log("Profile data:", profile);
  }
}

run().catch(console.error);
