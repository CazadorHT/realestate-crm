import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("crm_deals_v3")
    .select("id, status, commission_total, deal_type, created_at, commissions:crm_deal_commissions_v3(recipient_role, amount)");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Raw Output:", JSON.stringify(data, null, 2));
}

check();
