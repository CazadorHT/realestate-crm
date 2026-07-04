import { createClient } from "@supabase/supabase-js";
import { decrypt } from "../lib/crypto";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dealId = "79396d6a-e29b-4615-ad3d-1c24bd919af8";

async function runTest() {
  console.log("=== Testing Supabase query for deal:", dealId, "===");
  
  const { data, error } = await supabase
    .from("crm_deals_v3")
    .select(
      `
      *,
      property:properties (
        id,
        title,
        price,
        original_price,
        rental_price,
        original_rental_price,
        property_images:property_media_v3 (
          id,
          property_id,
          url,
          is_cover,
          sort_order
        )
      ),
      lead:crm_leads_v3 (
        id,
        stage,
        identity:identities_v3!crm_leads_v3_identity_id_fkey (
          display_name,
          email,
          phone
        )
      )
    `
    )
    .eq("id", dealId)
    .single();

  if (error) {
    console.error("Query Error:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
    return;
  }

  console.log("Query success! Data fetched successfully.");
  console.log("Raw Deal:", JSON.stringify(data, null, 2));

  const rawDeal = data as any;
  const lead = rawDeal.lead ? {
    id: rawDeal.lead.id,
    full_name: decrypt(rawDeal.lead.identity?.display_name) || "Unknown Lead",
    email: decrypt(rawDeal.lead.identity?.email) || null,
    phone: decrypt(rawDeal.lead.identity?.phone) || null,
    stage: rawDeal.lead.stage,
  } : null;

  console.log("Decrypted Lead:", lead);
}

runTest().catch(console.error);
