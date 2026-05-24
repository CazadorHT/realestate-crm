import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("ref_master_data")
    .select("*")
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error querying ref_master_data:", error);
    return;
  }

  console.log("ref_master_data count:", data?.length);
  console.log("ref_master_data records:", JSON.stringify(data, null, 2));
}

run();
