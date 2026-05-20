import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("traffic_views_v3").select("*").limit(1);
  if (error) {
    console.error("Error querying traffic_views_v3:", error.message);
  } else {
    console.log("Successfully queried traffic_views_v3! Data:", data);
  }
}

run().catch(console.error);
