import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function debug() {
  const supabase = createAdminClient();

  // 1. Fetch latest 10 created properties in DB
  const { data: latestProps, error } = await supabase
    .from("properties")
    .select("id, title, status, listing_type, property_type, created_at, updated_at, deleted_at, price, rental_price, tenant_id, created_by")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching latest properties:", error);
    return;
  }

  console.log("=== LATEST 10 PROPERTIES IN DB (SORTED BY CREATED_AT DESC) ===");
  latestProps?.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.created_at}] Status: ${p.status} | Deleted: ${p.deleted_at} | Price: ${p.price}/Rent: ${p.rental_price} | ID: ${p.id}`);
    console.log(`   Title: ${p.title}`);
  });

  // 2. Count ACTIVE non-deleted properties
  const { count: activeCount } = await supabase
    .from("properties")
    .select("id", { count: "exact" })
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  console.log("\nTotal ACTIVE non-deleted properties in DB:", activeCount);

  // 3. Check public properties API query (the exact query run by getPublicProperties)
  const PUBLIC_LIST_COLUMNS = `
    id, slug, title, title_en, title_cn, title_ru,
    property_type, price, rental_price, original_price, original_rental_price,
    verified, min_contract_months, bedrooms, meta_keywords, bathrooms,
    size_sqm, land_size_sqwah, parking_slots, floor, created_at, updated_at,
    listing_type, popular_area, popular_area_en, popular_area_cn, popular_area_ru, province, district, subdistrict,
    address_line1, address_line1_en, address_line1_cn, address_line1_ru,
    nearby_transits, is_hot_deal,
    near_transit, transit_type, transit_station_name,
    transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_distance_meters,
    google_maps_link, is_fully_furnished, is_bare_shell,
    is_pet_friendly, is_foreigner_quota, is_tax_registered,
    amenities
  `;

  const { data: publicProps, error: pubErr } = await supabase
    .from("properties")
    .select(PUBLIC_LIST_COLUMNS)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  if (pubErr) {
    console.error("Public query error:", pubErr);
  } else {
    console.log("\n=== TOP 5 PUBLIC PROPERTIES RETURNED BY SERVER QUERY ===");
    publicProps?.slice(0, 5).forEach((p: any, idx: number) => {
      console.log(`${idx + 1}. [${p.created_at}] ${p.title}`);
    });
  }
}

debug().catch(console.error);
