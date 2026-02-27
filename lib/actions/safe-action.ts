import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getSystemConfig } from "./system-config";

export type ActionState<TOutput> =
  | { success: true; data: TOutput }
  | { success: false; error: string; variant?: "error" | "warning" | "info" };

/**
 * Creates a server action with validation, authentication, and tenant isolation.
 */
export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (
    data: TInput,
    context: { supabase: any; userId: string; tenantId: string; role: string },
  ) => Promise<TOutput>,
) {
  return async (input: TInput): Promise<ActionState<TOutput>> => {
    try {
      // 1. Validate Input
      const validation = schema.safeParse(input);
      if (!validation.success) {
        return {
          success: false,
          error: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          variant: "warning",
        };
      }

      // 2. Auth Check
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
      }

      // 3. Tenant Check
      const config = await getSystemConfig();
      let tenantId = (input as any).tenantId;

      if (!config.multi_tenant_enabled) {
        // If multi-tenant is disabled, use the default tenant ID
        tenantId = config.default_tenant_id;
      }

      if (!tenantId) {
        return {
          success: false,
          error:
            "ยังไม่ได้ตั้งค่าสาขาหลักของระบบ (Default Tenant) กรุณาตรวจสอบใน Site Settings",
        };
      }

      // If multi-tenant is enabled, we MUST verify membership
      let role = "USER";
      if (config.multi_tenant_enabled) {
        const { data: member, error: memberError } = await supabase
          .from("tenant_members")
          .select("role")
          .eq("tenant_id", tenantId)
          .eq("profile_id", user.id)
          .single();

        if (memberError || !member) {
          return {
            success: false,
            error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของบริษัทนี้",
          };
        }
        role = member.role;
      } else {
        // In single tenant mode, we might want to get the global role from the profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) role = profile.role;
      }

      // 4. Execute Handler
      const result = await handler(validation.data, {
        supabase,
        userId: user.id,
        tenantId,
        role: role,
      });

      return { success: true, data: result };
    } catch (err: any) {
      console.error("Action Error:", err);
      return {
        success: false,
        error: err.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      };
    }
  };
}
