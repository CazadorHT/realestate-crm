import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "../lib/supabase/admin";
import { PropertyFacets } from "../features/properties/types/search";

async function verifySearch() {
  const supabase = createAdminClient();
  const testQueries = [
    { q: "Condo", lang: "English" },
    { q: "คอนโด", lang: "Thai" },
    { q: "公寓", lang: "Chinese" }, // Condo in Chinese
    { q: "BTS", lang: "Mixed/Brand" }
  ];

  console.log("🚀 Starting Multilingual Search Verification...\n");

  for (const { q, lang } of testQueries) {
    console.log(`🔍 Testing [${lang}] Query: "${q}"...`);
    
    // Call the new RPC
    const { data, error } = await (supabase.rpc as any)('get_public_property_facets', {
      p_q: q
    });

    if (error) {
      if (error.code === 'P0001' || error.message.includes('does not exist')) {
        console.error(`❌ RPC Error: Function 'get_public_property_facets' not found. Have you applied the migrations yet?`);
      } else {
        console.error(`❌ Error calling RPC:`, error.message);
      }
      return;
    }

    const facets = data as PropertyFacets;
    console.log(`✅ Success! Counts for "${q}":`);
    console.log(`   - SALE: ${facets.availableListingTypes.SALE}`);
    console.log(`   - RENT: ${facets.availableListingTypes.RENT}`);
    console.log(`   - Total Provinces: ${Object.keys(facets.availableProvinces || {}).length}`);
    console.log(`   - Total Areas: ${Object.keys(facets.availableAreas || {}).length}`);
    if (Object.keys(facets.availableAreas || {}).length > 0) {
      console.log(`   - Sample Area: ${Object.values(facets.availableAreas)[0].name_en || 'N/A'}`);
    }
    console.log(`----------------------------------------`);
  }

  console.log("\n⚖️ Testing SALE_AND_RENT Logic...");
  // This test expects at least one property with SALE_AND_RENT if it exists
  const { data: facetsResult } = await (supabase.rpc as any)('get_public_property_facets', {});
  const facetsAll = facetsResult as PropertyFacets;
  console.log(`📊 Global Counts: SALE(${facetsAll.availableListingTypes.SALE}), RENT(${facetsAll.availableListingTypes.RENT}), ALL(${facetsAll.availableListingTypes.ALL})`);
  
  if (facetsAll.availableListingTypes.SALE + facetsAll.availableListingTypes.RENT > facetsAll.availableListingTypes.ALL) {
    console.log("✅ Verified: SALE + RENT > ALL, meaning SALE_AND_RENT properties are counted in both categories correctly.");
  } else {
    console.log("ℹ️ Total matches ALL (or no shared listings found).");
  }

  console.log("\n✨ Verification Complete.");
}

verifySearch().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
