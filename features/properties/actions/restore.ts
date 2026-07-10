"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { Json } from "@/lib/database.types.generated";

import { PropertyFormValues } from "../schema";
import { AuditActionResult, AuditMetadata } from "@/features/audit/types";

/**
 * Restore property to a previously recorded state from Audit Logs
 */
export async function restorePropertyVersionAction(
  propertyId: string,
  logId: string
): Promise<AuditActionResult<{ slug: string }>> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant context required");

    // 1. Fetch the specific audit log entry
    const { data: log, error: logError } = await supabase
      .from("system_audit_logs_v3")
      .select("new_data, tenant_id")
      .eq("id", logId)
      .eq("entity_id", propertyId)
      .single();

    if (logError || !log) {
      return { 
        success: false, 
        message: "ไม่พบข้อมูลประวัติการแก้ไขที่ระบุ",
        errorType: "NOT_FOUND" 
      };
    }

    // Security: Check if log belongs to the same tenant
    if (log.tenant_id !== tenantId && role !== "ADMIN") {
      return { 
        success: false, 
        message: "สิทธิ์ไม่เพียงพอ: ไม่สามารถคืนค่าข้อมูลข้ามสาขาได้",
        errorType: "UNAUTHORIZED"
      };
    }

    const oldState = log.new_data as Record<string, unknown>;

    if (!oldState) {
      return { 
        success: false, 
        message: "ไม่พบข้อมูลสถานะเดิมในบันทึกนี้ ไม่สามารถคืนค่าได้",
        errorType: "VALIDATION_ERROR" 
      };
    }

    // 2. Reuse update action logic (Refactored)
    const { updatePropertyAction } = await import("./update");
    const result = await updatePropertyAction(propertyId, oldState as unknown as PropertyFormValues, `RESTORE-${logId}`);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "การคืนค่าข้อมูลล้มเหลว",
        errorType: "SYSTEM_ERROR"
      };
    }

    return { 
      success: true, 
      message: "คืนค่าข้อมูลสำเร็จ",
      data: { slug: (oldState.slug as string) || "" }
    };

  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; name?: string };
    console.error("restorePropertyVersionAction error:", error);
    if (error?.name === "AuthzError" || error?.code === "AUTHZ_ERROR") {
      return { 
        success: false, 
        message: "คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้",
        errorType: "UNAUTHORIZED" 
      };
    }
    return { 
      success: false, 
      message: mapDbError(err),
      errorType: "SYSTEM_ERROR"
    };
  }
}
