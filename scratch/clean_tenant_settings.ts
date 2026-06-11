import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const TENANT_ID = "7a22837c-2f21-4475-bc58-ce46476816d8";

async function clean() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("system_settings_v3")
    .delete()
    .eq("tenant_id", TENANT_ID);

  console.log("Cleanup result:", data, error);
}

clean();
