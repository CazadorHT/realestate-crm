import { createClient } from "../lib/supabase/server";

async function checkDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties_details")
    .select("property_id, amenities");

  if (error) {
    console.error("Error fetching details:", error);
    return;
  }

  console.log(`Fetched details for ${data.length} properties.`);
  data?.forEach((row: any, i: number) => {
    console.log(`Property ${i + 1} (${row.property_id}):`, row.amenities);
  });
}

checkDetails();
