import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: props, error } = await supabase
    .from("properties")
    .select(`
      id,
      title,
      assigned_to,
      created_by
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Query error:", error);
    return;
  }

  console.log("Last 5 properties assigned_to and created_by:");
  console.log(JSON.stringify(props, null, 2));
}

run();
