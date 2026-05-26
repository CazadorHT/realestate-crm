import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  // Query by title content containing "Wellington"
  const { data: details, error: detailErr } = await supabase
    .from("properties_details")
    .select("property_id, title, address_info")
    .limit(100);

  if (detailErr) {
    console.error("Detail error:", detailErr);
    return;
  }

  // Find the one matching "Wellington"
  const match = details.find(d => {
    const titleStr = JSON.stringify(d.title);
    return titleStr.includes("Wellington") || titleStr.includes("กรุงเทพกรีฑา");
  });

  if (!match) {
    console.log("No property title matching Wellington. Available properties count:", details.length);
    if (details.length > 0) {
      console.log("Sample title:", details[0].title);
    }
    return;
  }

  console.log("Found property:", match);
  const propertyId = match.property_id;

  // 2. Query core property specs
  const { data: core, error: coreErr } = await supabase
    .from("properties_core")
    .select("id, status, assigned_to, created_by")
    .eq("id", propertyId)
    .single();

  if (coreErr) {
    console.error("Core error:", coreErr);
    return;
  }

  console.log("Core specs:", core);

  // 3. Query assigned agent identity and profile
  if (core.assigned_to) {
    const { data: identity, error: idErr } = await supabase
      .from("identities_v3")
      .select("*")
      .eq("id", core.assigned_to)
      .maybeSingle();

    console.log("Identity in DB:", identity);
    if (idErr) console.error("Identity error:", idErr);

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", core.assigned_to)
      .maybeSingle();

    console.log("Profile in DB:", profile);
    if (profErr) console.error("Profile error:", profErr);
  } else {
    console.log("assigned_to is NULL for this property!");
  }
}

check();
