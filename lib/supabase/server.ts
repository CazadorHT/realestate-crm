import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * ✅ Recommended: Official Project-specific Supabase Server Client
 *
 * Always use this wrapper for authenticated user queries, Server Actions, and Route Handlers.
 * Handles cookie headers, session validation, and environment variables automatically.
 */
export async function createClient() {
  // 🛡️ Test Infrastructure Bridge
  if ((globalThis as any).__MOCK_SUPABASE__) {
    return (globalThis as any).__MOCK_SUPABASE__;
  }

  try {
    const cookieStore = await cookies();
    const rememberMe = cookieStore.get("remember_me")?.value !== "false";

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
              cookiesToSet.forEach(({ name, value, options }) => {
                const finalOptions = {
                  ...options,
                  sameSite: "lax" as const,
                  path: "/",
                };

                if (!rememberMe) {
                  delete finalOptions.maxAge;
                  delete (finalOptions as any).expires;
                }

                cookieStore.set(name, value, finalOptions);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have proxy refreshing user sessions.
            }
          },
        },
      },
    );
  } catch (error) {
    // Fallback for non-request environments (e.g. generateStaticParams / build step)
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
        },
      },
    );
  }
}

let publicSupabaseClient: SupabaseClient<Database> | null = null;

/**
 * ⚡ Stateless Public Supabase Client (No cookies access)
 * Safe for use inside Next.js `unstable_cache` and static/ISR functions.
 * Prevents dynamic cookie access from invalidating Next.js Data Cache,
 * reducing Supabase PostgREST Egress by up to 99%.
 */
export function createPublicClient(): SupabaseClient<Database> {
  if ((globalThis as any).__MOCK_SUPABASE__) {
    return (globalThis as any).__MOCK_SUPABASE__;
  }

  if (!publicSupabaseClient) {
    publicSupabaseClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return publicSupabaseClient;
}