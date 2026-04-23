import { createClient } from "./supabase/server";
import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";

/**
 * 🛡️ Minimal Context for backward compatibility
 */
export interface MinimalAuditContext {
  supabase: any;
  user: any;
  role?: string;
  tenantId?: string;
}

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "LOGIN" 
  | "EXPORT" 
  | "SYNC"
  | "REORDER"
  | "PAYOUT"
  | "READY_TO_PAY"
  | "VOID"
  | string; // Allow legacy string actions

export type AuditEntity = 
  | "PROPERTY" 
  | "PARTNER" 
  | "LEAD" 
  | "DEAL" 
  | "USER" 
  | "SETTING"
  | "FINANCE"
  | "COMMISSION"
  | "WALLET"
  | string; // Allow legacy string entities

interface AuditLogOptions {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  userId?: string;
  summary?: string;
}

/**
 * 🛡️ Expert Audit Logger: Records critical business actions in DB and Sentry.
 */
export async function recordAuditLog(options: AuditLogOptions) {
  const { action, entity, entityId, metadata = {}, tenantId, userId } = options;

  try {
    const supabase = await createClient();
    
    // 1. Resolve Identity (If not provided)
    let finalUserId = userId;
    let finalTenantId = tenantId;

    if (!finalUserId || !finalTenantId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        finalUserId = finalUserId || user.id;
      }
    }

    // 2. Record to Database (audit_logs table)
    const { error } = await supabase.from("audit_logs").insert({
      action,
      entity,
      entity_id: entityId,
      metadata,
      tenant_id: finalTenantId,
      user_id: finalUserId,
    });

    if (error) {
      logger.error("Failed to record audit log in DB", error, { source: "audit-logger", options });
    }

    // 3. Record to Sentry as Breadcrumb
    Sentry.addBreadcrumb({
      category: "audit",
      message: `${action} ${entity} (${entityId || "N/A"})`,
      level: "info",
      data: {
        ...metadata,
        user_id: finalUserId,
        tenant_id: finalTenantId,
      },
    });

    // 4. Structured Logging
    logger.info(`Audit Log: ${action} ${entity}`, {
      source: "audit-logger",
      action,
      entity,
      entityId,
      userId: finalUserId,
    });

  } catch (err) {
    logger.error("Audit logger critical failure", err, { source: "audit-logger" });
  }
}

/**
 * 🛡️ Legacy Bridge: Backward compatibility for existing code
 */
export async function logAudit(
  ctx: MinimalAuditContext,
  data: {
    action: string;
    entity: string;
    entityId?: string | null;
    summary?: string;
    metadata?: any;
  }
) {
  return recordAuditLog({
    action: data.action,
    entity: data.entity,
    entityId: data.entityId || undefined,
    metadata: {
      ...data.metadata,
      summary: data.summary,
    },
    userId: ctx.user?.id,
  });
}

/**
 * 💬 Human-readable summary for Dashboard UI
 */
export function getReadableSummary(log: { action: string; entity: string; metadata?: any }): string {
  const { action, entity, metadata = {} } = log;

  const dictionary: Record<string, string> = {
    "property.create": `เพิ่มทรัพย์สินใหม่: ${metadata.title || "N/A"}`,
    "property.update": `แก้ไขข้อมูลทรัพย์สิน: ${metadata.title || "N/A"}`,
    "property.delete": "ลบทรัพย์สินออกจากระบบ",
    "property.trash": "ย้ายทรัพย์สินลงถังขยะ",
    "property.restore": "กู้คืนทรัพย์สินจากถังขยะ",
    "member.transfer": `ย้ายพนักงาน ${metadata.email || ""} ไปยังสาขาใหม่`,
    "deal.create": "สร้างดีลใหม่",
    "deal.update": "อัปเดตสถานะดีล",
    "payout.ready": "อนุมัติยอดคอมมิชชันเตรียมโอน",
    "payout.paid": "ยืนยันการโอนเงินเรียบร้อย",
  };

  if (dictionary[action]) return dictionary[action];

  // Fallback for custom actions
  if (action.endsWith(".create")) return `สร้างข้อมูลใหม่ (${entity})`;
  if (action.endsWith(".delete")) return `ลบข้อมูล (${entity})`;
  if (action.endsWith(".update")) return `อัปเดตข้อมูล (${entity})`;

  return action;
}
