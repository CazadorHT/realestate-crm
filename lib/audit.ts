"use server";

import { createClient } from "./supabase/server";
import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";
import type { AuditAction, AuditEntity, MinimalAuditContext } from "./audit-utils";

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

    // 2. Record to Database (system_audit_logs_v3 table)
    const { error } = await supabase.from("system_audit_logs_v3").insert({
      action,
      entity_table: entity,
      entity_id: entityId,
      new_data: metadata,
      tenant_id: finalTenantId,
      actor_id: finalUserId,
    });

    if (error) {
      logger.error("Failed to record audit log in DB", error, { source: "audit-logger", action, entity });
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
