import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("system_settings_v3")
    .select("tenant_id, key, value, updated_at");

  if (error) {
    console.error(error);
    return;
  }

  // Find keys that have both null and non-null tenant_id
  const keyMap: Record<string, any[]> = {};
  for (const row of data) {
    if (!keyMap[row.key]) {
      keyMap[row.key] = [];
    }
    keyMap[row.key].push(row);
  }

  console.log("=== Overridden Settings (Keys with both Global and Tenant rows) ===");
  for (const [key, rows] of Object.entries(keyMap)) {
    if (rows.length > 1) {
      console.log(`\nKey: ${key}`);
      for (const row of rows) {
        console.log(`  - Tenant: ${row.tenant_id ? row.tenant_id : "GLOBAL (null)"} | Value: ${row.value} | Updated: ${row.updated_at}`);
      }
    }
  }
}

check();
