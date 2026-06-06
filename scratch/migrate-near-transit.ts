import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/admin";

async function run() {
  const supabase = createAdminClient();

  console.log("Fetching properties_details...");
  const { data: detailsList, error } = await supabase
    .from("properties_details")
    .select("property_id, transit_info");

  if (error) {
    console.error("Error fetching properties_details:", error);
    return;
  }

  console.log(`Found ${detailsList?.length || 0} rows.`);
  let updatedCount = 0;

  for (const row of detailsList || []) {
    const transitInfo = row.transit_info as any;
    if (!transitInfo) continue;

    // Check if transitInfo contains transits
    const hasTransits = Array.isArray(transitInfo.transits) && transitInfo.transits.length > 0;
    const isNearTransit = !!transitInfo.near_transit;

    if (hasTransits && !isNearTransit) {
      const updatedTransitInfo = {
        ...transitInfo,
        near_transit: true,
      };

      const { error: updateError } = await supabase
        .from("properties_details")
        .update({ transit_info: updatedTransitInfo })
        .eq("property_id", row.property_id);

      if (updateError) {
        console.error(`Failed to update ${row.property_id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated property ${row.property_id} setting near_transit = true`);
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} properties.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
