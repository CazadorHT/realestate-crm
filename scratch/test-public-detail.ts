import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const propertyId = "1c477f40-d03d-41c4-818c-f276043f3b01";

  // Test 1: Simple query on properties_core
  console.log("=== Test 1: Simple properties_core by ID ===");
  const { data: simple, error: simpleErr } = await supabase
    .from("properties_core")
    .select("id, status, assigned_to, slug")
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("Simple result:", simple);
  console.log("Simple error:", simpleErr);

  // Test 2: With properties_details join
  console.log("\n=== Test 2: + properties_details join ===");
  const { data: withDetails, error: detailsErr } = await supabase
    .from("properties_core")
    .select("id, details:properties_details!property_id (title)")
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("WithDetails result:", JSON.stringify(withDetails, null, 2));
  console.log("WithDetails error:", detailsErr);

  // Test 3: With identities_v3 join
  console.log("\n=== Test 3: + identities_v3 join ===");
  const { data: withAgent, error: agentErr } = await supabase
    .from("properties_core")
    .select("id, assigned_agent:identities_v3!properties_core_assigned_to_fkey (display_name)")
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("WithAgent result:", JSON.stringify(withAgent, null, 2));
  console.log("WithAgent error:", agentErr);

  // Test 4: With property_images join  
  console.log("\n=== Test 4: + property_images join ===");
  const { data: withImages, error: imagesErr } = await supabase
    .from("properties_core")
    .select("id, property_images (image_url, is_cover)")
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("WithImages result:", JSON.stringify(withImages, null, 2));
  console.log("WithImages error:", imagesErr);

  // Test 5: With property_features join
  console.log("\n=== Test 5: + property_features join ===");
  const { data: withFeatures, error: featuresErr } = await supabase
    .from("properties_core")
    .select("id, property_features (features (id, name))")
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("WithFeatures result:", JSON.stringify(withFeatures, null, 2));
  console.log("WithFeatures error:", featuresErr);

  // Test 6: Full query (same as fetch-public-property.ts)
  console.log("\n=== Test 6: Full composite query ===");
  const { data: full, error: fullErr } = await supabase
    .from("properties_core")
    .select(`
      id, listing_type, property_type, sale_price, rent_price,
      bedrooms, bathrooms, floor_area, land_area,
      is_hot_deal, is_exclusive, verified, created_at,
      details:properties_details!property_id (
        title, description, address_info, amenities, transit_info, pricing_details, meta_data
      ),
      property_images (
        image_url, storage_path, is_cover, sort_order
      ),
      assigned_agent:identities_v3!properties_core_assigned_to_fkey (
        display_name, phone, avatar_url, line_id
      ),
      property_features (
        features (
          id, name, name_en, icon_key, category
        )
      )
    `)
    .eq("id", propertyId)
    .eq("status", 1)
    .maybeSingle();
  console.log("Full result ID:", full?.id);
  console.log("Full error:", fullErr);
}

run().catch(console.error);
