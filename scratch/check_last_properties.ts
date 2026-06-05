import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: props, error } = await supabase
    .from("properties_core")
    .select(`
      id, tenant_id, status, created_by, assigned_to, created_at,
      properties_details (
        meta_data
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  console.log("Last 5 properties:");
  console.log(JSON.stringify(props, null, 2));
}

run();
