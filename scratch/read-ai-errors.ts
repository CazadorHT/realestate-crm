import { createAdminClient } from "../lib/supabase/admin";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_token_ledgers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Recent AI Token Ledgers:", JSON.stringify(data, null, 2));
  }
}

test();
