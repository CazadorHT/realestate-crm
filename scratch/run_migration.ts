import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Reading SQL seed migration file...");
  const sqlPath = path.join(
    process.cwd(),
    "supabase/migrations/20260619000000_seed_transit_stations.sql"
  );
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  // Simple regex to parse values from the INSERT statement
  // Format: ('type', 'code', 'label', is_active, sort_order, 'metadata')
  const regex = /\(\s*'TRANSIT_STATION'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*,\s*(\d+)\s*,\s*'([^']+)'\s*\)/g;

  const records: any[] = [];
  let match;
  while ((match = regex.exec(sqlContent)) !== null) {
    const [_, code, labelStr, isActiveStr, sortOrderStr, metadataStr] = match;
    
    // Parse json
    const label = JSON.parse(labelStr);
    const metadata = JSON.parse(metadataStr);
    const is_active = isActiveStr === "true";
    const sort_order = parseInt(sortOrderStr);

    records.push({
      type: "TRANSIT_STATION",
      code,
      label,
      is_active,
      sort_order,
      metadata,
    });
  }

  console.log(`Parsed ${records.length} station records.`);
  
  if (records.length === 0) {
    console.error("No records matched the parser regex.");
    return;
  }

  console.log("Upserting records into public.ref_master_data...");
  const { error } = await supabase
    .from("ref_master_data")
    .upsert(records, { onConflict: "type,code" });

  if (error) {
    console.error("Database upsert failed:", error);
  } else {
    console.log("Success! Master transit stations seeded successfully. 🎉");
  }
}

run();
