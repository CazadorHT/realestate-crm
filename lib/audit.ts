// lib/audit.ts
import type { Database } from "@/lib/database.types";
import type { AuthContext } from "@/lib/authz";

export type AuditAction =
  | "property.create"
  | "property.update"
  | "property.status.update"
  | "property.delete"
  | "lead.create"
  | "lead.update"
  | "lead.delete"
  | "lead_activity.create"
  | "owner.create"
  | "owner.update"
  | "owner.delete"
  | "profile.update"
  | "profile.avatar.upload"
  | "user.delete"
  | "user.role.update"
  | "deal.create"
  | "deal.update"
  | "deal.delete"
  | "rental_contract.create"
  | "rental_contract.update"
  | "rental_contract.delete";

type AuditInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export async function logAudit(
  ctx: AuthContext,
  input: {
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const row: AuditInsert = {
    user_id: ctx.user.id,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as any,
  };

  // สำคัญ: audit log “ต้องไม่ทำให้ flow หลักพัง”
  const { error } = await ctx.supabase.from("audit_logs").insert(row);
  if (error) {
    console.error("[audit_logs] insert failed:", error.message, {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
    });
  }
}
