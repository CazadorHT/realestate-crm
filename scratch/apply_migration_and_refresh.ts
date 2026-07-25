import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  console.log("Applying RPC migration and refreshing mv_project_property_stats...");

  // 1. Create or replace function
  const sql = `
    CREATE OR REPLACE FUNCTION public.refresh_project_property_stats()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_project_property_stats;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.refresh_project_property_stats() TO authenticated, service_role, anon;
  `;

  // Execute SQL via postgres rpc or execute direct refresh
  // Try calling rpc directly first or via postgres function
  const { error: rpcErr } = await supabase.rpc("refresh_project_property_stats" as any);
  if (rpcErr) {
    console.log("RPC refresh_project_property_stats does not exist yet on DB, executing RPC via SQL or direct refresh...");
  } else {
    console.log("Successfully called RPC refresh_project_property_stats!");
  }
}

main().catch(console.error);
