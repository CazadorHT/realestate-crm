"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { Json } from "@/lib/database.types";

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
      .from("audit_logs")
      .select("metadata, tenant_id")
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

    // Security: Check if log belongs to the same tenant (Redundant but safe)
    if (log.tenant_id !== tenantId && role !== "ADMIN") {
      return { 
        success: false, 
        message: "สิทธิ์ไม่เพียงพอ: ไม่สามารถคืนค่าข้อมูลข้ามสาขาได้",
        errorType: "UNAUTHORIZED"
      };
    }

    const metadata = log.metadata as unknown as AuditMetadata;
    const oldState = metadata?.old_state as Record<string, unknown>;

    if (!oldState) {
      return { 
        success: false, 
        message: "ไม่พบข้อมูลสถานะเดิมในบันทึกนี้ ไม่สามารถคืนค่าได้",
        errorType: "VALIDATION_ERROR"
      };
    }

    // -- SENTINEL: Dry Run Validation --
    const { PropertySchema } = await import("@/features/properties/schema");
    const dryRun = PropertySchema.partial().safeParse(oldState);
    if (!dryRun.success) {
      console.error("Restore Validation Failed:", dryRun.error.format());
      return { 
        success: false, 
        message: "ข้อมูลประวัติไม่ถูกต้องตามมาตรฐานปัจจุบัน ไม่สามารถคืนค่าได้",
        errorType: "VALIDATION_ERROR"
      };
    }

    // 2. Fetch current property to check version (Optimistic Locking)
    interface PropertyOwnershipResult {
      version: number;
      title: string;
      slug: string; // Added for revalidation
    }

    const { data: current, error: currentErr } = await supabase
      .from("properties")
      .select("version, title, slug")
      .eq("id", propertyId)
      .eq("tenant_id", tenantId)
      .single();

    const typedCurrent = current as PropertyOwnershipResult | null;

    if (!typedCurrent) {
      return { 
        success: false, 
        message: "ไม่พบข้อมูลทรัพย์สินปัจจุบัน " + (currentErr?.message || ""),
        errorType: "NOT_FOUND"
      };
    }

    // 3. ATOMIC RESTORE (Reuse the Elite RPC)
    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    
    interface EliteRpcResult {
      id: string;
      slug: string;
    }

    const { data: updatedRow, error: rpcError } = await supabase.rpc("update_property_elite", {
      p_id: propertyId,
      p_tenant_id: tenantId,
      p_user_id: user.id,
      p_is_admin: canBypassOwnership,
      p_version: typedCurrent.version,
      p_data: {
        ...oldState,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        tenant_id: undefined,
        created_by: undefined,
        version: undefined,
      } as Json
    });

    const typedUpdatedRow = updatedRow as EliteRpcResult | null;

    if (rpcError) {
      console.error("RPC restore failed:", rpcError);
      
      // Handle Specific RPC Error Codes (User Errors)
      if (rpcError.message?.includes("VC409")) {
        return {
          success: false,
          message: "ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้าจอเพื่อรับข้อมูลล่าสุดก่อนคืนค่า",
          errorType: "CONFLICT"
        };
      }
      if (rpcError.message?.includes("VC403")) {
        return {
          success: false,
          message: "คุณไม่มีสิทธิ์คืนค่าข้อมูลทรัพย์สินชิ้นนี้ (ไม่ใช่เจ้าของ)",
          errorType: "UNAUTHORIZED"
        };
      }

      return { 
        success: false, 
        message: `ไม่สามารถคืนค่าได้: ${mapDbError(rpcError)}`,
        errorType: "SYSTEM_ERROR"
      };
    }

    // 4. Log the Restoration Event
    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: propertyId,
        metadata: {
          is_restore: true,
          restored_from_log_id: logId,
          diff: [`คืนค่าข้อมูลจากประวัติเวอร์ชันเดิม (${typedCurrent.title})`],
        },
      }
    );

    revalidatePath("/protected/properties");
    if (typedUpdatedRow?.slug) {
      revalidatePath(`/properties/${typedUpdatedRow.slug}`);
    }

    return { 
      success: true, 
      message: "คืนค่าข้อมูลสำเร็จ",
      data: { slug: typedUpdatedRow?.slug || "" }
    };

  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error("restorePropertyVersionAction error:", error);
    if (error?.code === "AUTHZ_ERROR") {
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
