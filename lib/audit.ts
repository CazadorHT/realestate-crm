// lib/audit.ts
import type { Database } from "@/lib/database.types";
import type { AuthContext } from "@/lib/authz";

export type AuditAction =
  | "property.create"
  | "property.update"
  | "property.status.update"
  | "property.delete"
  | "property.bulk_delete"
  | "property.bulk_trash"
  | "property.bulk_restore"
  | "property.bulk_hard_delete"
  | "property.bulk_move"
  | "lead.create"
  | "lead.update"
  | "lead.delete"
  | "lead.bulk_delete"
  | "lead.transfer"
  | "lead_activity.create"
  | "lead_activity.update"
  | "lead_activity.delete"
  | "owner.create"
  | "owner.update"
  | "owner.delete"
  | "owner.bulk_delete"
  | "owner.bulk_move"
  | "profile.update"
  | "profile.avatar.upload"
  | "user.delete"
  | "user.role.update"
  | "deal.create"
  | "deal.update"
  | "deal.delete"
  | "deal.bulk_delete"
  | "rental_contract.create"
  | "rental_contract.update"
  | "rental_contract.delete"
  | "rental_contract.bulk_delete"
  | "feature.bulk_delete"
  | "blog.bulk_delete"
  | "faq.create"
  | "faq.update"
  | "faq.trash"
  | "faq.restore"
  | "faq.permanent_delete"
  | "faq.bulk_delete"
  | "faq.bulk_trash"
  | "faq.empty_trash"
  | "service.create"
  | "service.update"
  | "service.trash"
  | "service.restore"
  | "service.permanent_delete"
  | "service.bulk_trash"
  | "service.empty_trash"
  | "service.bulk_delete"
  | "partner.bulk_delete"
  | "popular_area.bulk_delete"
  | "popular_area.bulk_translate"
  | "lead.pdpa_update"
  | "property.syndication.update"
  | "property.social_post"
  | "document.bulk_delete"
  | "team.create"
  | "team.update"
  | "team.delete"
  | "tenant.create"
  | "tenant.update"
  | "tenant.delete"
  | "member.add"
  | "member.remove"
  | "member.transfer"
  | "property.transfer_branch"
  | "owner.transfer_branch"
  | "commission.export_pdf"
  | "commission.send_line";

type AuditInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export async function logAudit(
  ctx: AuthContext,
  input: {
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const row: AuditInsert = {
    user_id: ctx.user.id,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as any,
    tenant_id: ctx.tenantId && ctx.tenantId !== "ALL" ? ctx.tenantId : null,
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
