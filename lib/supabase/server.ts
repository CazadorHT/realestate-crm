import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types"; // 👈 import type
/**
 * ✅ Recommended: Official Project-specific Supabase Server Client
 * 
 * Always use this wrapper instead of importing `createClient` from `@supabase/ssr` or `@supabase/supabase-js`.
 * It handles cookie headers, session validation, and environment variables automatically.
 */
export async function createClient() {
  // 🛡️ Test Infrastructure Bridge
  if ((globalThis as any).__MOCK_SUPABASE__) {
    return (globalThis as any).__MOCK_SUPABASE__;
  }

  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  sameSite: "lax",
                  path: "/",
                }),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have proxy refreshing
              // user sessions.
            }
          },
        },
      },
    );
  } catch (error) {
    // Fallback for non-request environments (e.g. generateStaticParams)
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      },
    );
  }
}
