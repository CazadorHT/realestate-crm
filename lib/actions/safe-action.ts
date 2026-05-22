import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { mapDbError } from "@/lib/db-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type ActionState<TOutput> =
  | { success: true; data: TOutput }
  | { success: false; error: string; variant?: "error" | "warning" | "info" };

/**
 * Creates a server action with validation, authentication, and tenant isolation.
 * Supports optional dependency injection for testing.
 */
export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (
    data: TInput,
    context: { supabase: SupabaseClient<Database>; userId: string; tenantId: string | null; role: string },
  ) => Promise<TOutput>,
) {
  return async (input: TInput, injectedSupabase?: SupabaseClient<Database>): Promise<ActionState<TOutput>> => {
    try {
      // 1. Validate Input
      const validation = schema.safeParse(input);
      if (!validation.success) {
        const errorMessage = validation.error.issues
          .map((issue: any) => issue.message)
          .join(", ");

        return {
          success: false,
          error: errorMessage || "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          variant: "warning",
        };
      }

      // 2. Auth & Context Check (Hardened & Unified)
      // Use injected client if provided (Testing Bridge)
      const { requireAuthContext } = await import("@/lib/authz");
      const ctx = await requireAuthContext((input as Record<string, unknown>).tenantId as string | undefined, injectedSupabase);
      
      const { supabase, user, tenantId, role } = ctx;

      // 3. Execute Handler
      const result = await handler(validation.data, {
        supabase,
        userId: user.id,
        tenantId: (tenantId && tenantId !== "ALL" && tenantId !== "" && tenantId !== "undefined") ? tenantId : null,
        role,
      });

      return { success: true, data: result };
    } catch (err: unknown) {
      console.error("Action Error:", err);
      // Special handling for AuthzError
      const error = err as Error & { code?: string };
      if (error.name === 'AuthzError' || error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
         return { success: false, error: error.message || "คุณไม่มีสิทธิ์ดำเนินการ" };
      }
      return {
        success: false,
        error: mapDbError(error),
      };
    }
  };
}
