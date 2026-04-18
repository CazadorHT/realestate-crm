import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { mapDbError } from "@/lib/db-error";

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
    context: { supabase: any; userId: string; tenantId: string; role: string },
  ) => Promise<TOutput>,
) {
  return async (input: TInput, injectedSupabase?: any): Promise<ActionState<TOutput>> => {
    try {
      // 1. Validate Input
      const validation = schema.safeParse(input);
      if (!validation.success) {
        const errorMessage = validation.error.issues
          .map((issue) => issue.message)
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
      const ctx = await requireAuthContext((input as any).tenantId, injectedSupabase);
      
      const { supabase, user, tenantId, role } = ctx;

      // 3. Execute Handler
      const result = await handler(validation.data, {
        supabase,
        userId: user.id,
        tenantId: tenantId ?? "",
        role,
      });

      return { success: true, data: result };
    } catch (err: any) {
      console.error("Action Error:", err);
      // Special handling for AuthzError
      if (err.name === 'AuthzError' || err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
         return { success: false, error: err.message || "คุณไม่มีสิทธิ์ดำเนินการ" };
      }
      return {
        success: false,
        error: mapDbError(err),
      };
    }
  };
}
