"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ActionState<T> =
  | { success: true; data: T }
  | { success: false; error: string; variant?: "error" | "warning" | "info" };

/**
 * A wrapper for server actions that adds authentication and tenant isolation checks.
 */
export async function safeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  action: (
    data: TInput,
    context: { supabase: any; userId: string; tenantId: string },
  ) => Promise<TOutput>,
  options?: { requiredRole?: string },
): Promise<ActionState<TOutput>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Parse input data
    const parsedInput = schema.safeParse({}); // Placeholder, will be replaced by actual input
    // To make it generic, we need to handle the input correctly.
    // Let's refine the implementation after thinking.

    return { success: false, error: "Not implemented yet" };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred",
    };
  }
}
