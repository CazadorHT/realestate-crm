import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase URL or Key in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBenchmark() {
  console.log("=================================================");
  console.log("📊 POSTGREST EGRESS BENCHMARK TEST");
  console.log("=================================================\n");

  // ---------------------------------------------------------
  // TEST 1: Layout Sidebar Badge Query
  // ---------------------------------------------------------
  console.log("--- 1. LAYOUT SIDEBAR BADGE TEST ---");

  // Old Heavy Query (Stats Calculation)
  const startTimeOld = Date.now();
  const [
    { data: total },
    { data: active },
    { data: soldOrRented },
    { data: aiReviewCountOld },
    { data: statusStatsRaw },
    { data: typeStatsRaw },
    { data: financialDataRaw }
  ] = await Promise.all([
    supabase.from("properties").select("id").is("deleted_at", null),
    supabase.from("properties").select("id").is("deleted_at", null).eq("status", "ACTIVE"),
    supabase.from("properties").select("id").is("deleted_at", null).in("status", ["SOLD", "RENTED"]),
    supabase.from("properties").select("id").is("deleted_at", null).eq("requires_ai_review", true),
    supabase.from("properties").select("status").is("deleted_at", null),
    supabase.from("properties").select("property_type").is("deleted_at", null),
    supabase.from("properties").select("status, price, rental_price, original_price, original_rental_price, listing_type, commission_sale_percentage, commission_rent_months, co_agent_sale_commission_percent").is("deleted_at", null).in("status", ["ACTIVE", "SOLD", "RENTED"])
  ]);
  const timeOld = Date.now() - startTimeOld;

  const heavyPayloadSize = 
    JSON.stringify(total || []).length +
    JSON.stringify(active || []).length +
    JSON.stringify(soldOrRented || []).length +
    JSON.stringify(aiReviewCountOld || []).length +
    JSON.stringify(statusStatsRaw || []).length +
    JSON.stringify(typeStatsRaw || []).length +
    JSON.stringify(financialDataRaw || []).length;

  // New Fast HEAD Query
  const startTimeNew = Date.now();
  const { count: fastAiCount, error } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("requires_ai_review", true);
  const timeNew = Date.now() - startTimeNew;

  const fastPayloadSize = 0; // HEAD request returns 0 bytes body

  console.log(`🔴 Old Layout Query Payload Egress : ${(heavyPayloadSize / 1024).toFixed(2)} KB (${heavyPayloadSize} bytes) | Time: ${timeOld}ms`);
  console.log(`🟢 New Layout Query Payload Egress : ${(fastPayloadSize / 1024).toFixed(2)} KB (0 bytes - HEAD)          | Time: ${timeNew}ms`);
  const layoutSavedPercent = heavyPayloadSize > 0 ? ((heavyPayloadSize - fastPayloadSize) / heavyPayloadSize * 100).toFixed(1) : 100;
  console.log(`⚡ Layout Egress Reduction: -${layoutSavedPercent}%\n`);

  // ---------------------------------------------------------
  // TEST 2: Property Table Query (10 items)
  // ---------------------------------------------------------
  console.log("--- 2. PROPERTY TABLE DATA TEST (10 Items Page) ---");

  // Old Table Query (With description and images)
  const { data: oldTableData } = await supabase
    .from("properties")
    .select(`
      id, slug, title, description, status, property_type, listing_type, 
      price, rental_price, original_price, original_rental_price, 
      updated_at, created_at, bedrooms, bathrooms, office_capacity, province, district, subdistrict, 
      popular_area, view_count, address_line1, images, total_units, 
      sold_units, posted_to_facebook_at, posted_to_instagram_at, 
      posted_to_line_at, posted_to_tiktok_at, assigned_to, created_by,
      tenant_id, requires_ai_review
    `)
    .is("deleted_at", null)
    .range(0, 9);

  const oldTableBytes = JSON.stringify(oldTableData || []).length;

  // New Table Query (Without description and images)
  const { data: newTableData } = await supabase
    .from("properties")
    .select(`
      id, slug, title, status, property_type, listing_type, 
      price, rental_price, original_price, original_rental_price, 
      updated_at, created_at, bedrooms, bathrooms, office_capacity, province, district, subdistrict, 
      popular_area, view_count, address_line1, total_units, 
      sold_units, posted_to_facebook_at, posted_to_instagram_at, 
      posted_to_line_at, posted_to_tiktok_at, assigned_to, created_by,
      tenant_id, requires_ai_review
    `)
    .is("deleted_at", null)
    .range(0, 9);

  const newTableBytes = JSON.stringify(newTableData || []).length;
  const tableSavedPercent = oldTableBytes > 0 ? ((oldTableBytes - newTableBytes) / oldTableBytes * 100).toFixed(1) : 0;

  console.log(`🔴 Old Table Page Payload Egress   : ${(oldTableBytes / 1024).toFixed(2)} KB (${oldTableBytes} bytes)`);
  console.log(`🟢 New Table Page Payload Egress   : ${(newTableBytes / 1024).toFixed(2)} KB (${newTableBytes} bytes)`);
  console.log(`⚡ Table Egress Reduction: -${tableSavedPercent}%\n`);

  console.log("=================================================");
  console.log("✅ SUMMARY OF BENCHMARK");
  console.log("=================================================");
  console.log(`- Layout Navigation Egress Reduced by : ${layoutSavedPercent}% per click`);
  console.log(`- Table View Egress Reduced by       : ${tableSavedPercent}% per page load`);
  console.log("=================================================");
}

runBenchmark().catch(console.error);
