import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("--- 1. POPULAR_AREAS_V3 ---");
  const { data: popularV3, error: v3Err } = await supabase
    .from("popular_areas_v3")
    .select("id, name, slug, province, is_active");
  
  if (v3Err) {
    console.error("popular_areas_v3 error:", v3Err);
  } else {
    console.log(`Found ${popularV3?.length} rows in popular_areas_v3:`);
    (popularV3 || []).forEach(row => {
      console.log(JSON.stringify(row));
    });
  }

  console.log("\n--- 2. ACTIVE PROPERTIES DISTINCT POPULAR_AREA & DISTRICT ---");
  const { data: props, error: propErr } = await supabase
    .from("properties")
    .select("id, popular_area, popular_area_en, district, province, title")
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .limit(50);

  if (propErr) {
    console.error("properties error:", propErr);
  } else {
    console.log(`Sample of active properties:`);
    const distinctAreas = new Set();
    props?.forEach(p => {
      distinctAreas.add(`popular_area: "${p.popular_area}" | en: "${p.popular_area_en}" | district: "${p.district}"`);
    });
    console.log(Array.from(distinctAreas));
  }
}

main().catch(console.error);
