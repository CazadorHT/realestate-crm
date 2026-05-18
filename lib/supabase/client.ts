import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
/**
 * ✅ Recommended: Official Project-specific Supabase Client (Browser)
 * 
 * Always use this wrapper instead of importing `createClient` from `@supabase/supabase-js`.
 * It is pre-configured with the correct project URL and Anonymous Key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
