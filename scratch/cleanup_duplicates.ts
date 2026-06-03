import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log("Cleaning up duplicate settings...");
  
  // Fetch all settings
  const { data: rows, error } = await supabase
    .from("system_settings_v3")
    .select("id, key, tenant_id, category, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching rows:", error);
    return;
  }

  const seenKeys = new Set<string>();
  const idsToDelete: string[] = [];

  for (const row of (rows || [])) {
    const compositeKey = `${row.tenant_id || "null"}-${row.category}-${row.key}`;
    if (seenKeys.has(compositeKey)) {
      // Duplicate, delete this older one
      idsToDelete.push(row.id);
    } else {
      seenKeys.add(compositeKey);
    }
  }

  console.log(`Found ${idsToDelete.length} duplicate rows to delete.`);

  if (idsToDelete.length > 0) {
    const { error: delError } = await supabase
      .from("system_settings_v3")
      .delete()
      .in("id", idsToDelete);

    if (delError) {
      console.error("Error deleting duplicates:", delError);
    } else {
      console.log("Successfully cleaned up duplicates!");
    }
  }
}

run();
