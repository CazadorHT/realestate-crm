import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: prop, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", "43c11f0b-cdf2-42bb-94d8-33abb152f884")
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Property Raw Columns:", JSON.stringify(prop, null, 2));
}

check();
