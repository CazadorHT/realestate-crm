import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient(schema: "public" | string = "public"): SupabaseClient<Database, "public", "public"> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Admin Environment Variables");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    db: { schema: schema as "public" },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
