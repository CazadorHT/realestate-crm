import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching all background tasks from system_task_queue...");
  const { data, error, count } = await supabase
    .from("system_task_queue")
    .select("*", { count: "exact" });

  if (error) {
    console.error("Error fetching tasks:", error);
    return;
  }

  console.log(`Total tasks found: ${count}`);
  console.log("Tasks:", JSON.stringify(data, null, 2));
}

run();
