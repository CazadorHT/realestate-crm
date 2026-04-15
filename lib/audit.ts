// lib/audit.ts
import type { Database } from "@/lib/database.types";
import type { AuthContext } from "@/lib/authz";

export type AuditAction =
  | "property.create"
  | "property.update"
  | "property.status.update"
  | "property.delete"
  | "property.trash"
  | "property.restore"
  | "property.permanent_delete"
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
  | "popular_area.create"
  | "popular_area.update"
  | "popular_area.delete"
  | "popular_area.bulk_delete"
  | "popular_area.bulk_translate"
  | "popular_area.reorder"
  | "popular_area.upload_image"
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
  | "property.ai_refresh"
  | "property.export"
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

/**
 * Audit Metadata Type for summary generation
 */
export interface AuditLogMetadata {
  email?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  title?: string;
  role?: string;
  count?: number;
}

/**
 * Generates a human-readable summary for an audit log entry.
 * Hardened to provide fallbacks for missing metadata.
 */
export function getReadableSummary(log: {
  action: string;
  entity: string;
  metadata: any;
}): string {
  const meta = (log.metadata || {}) as AuditLogMetadata;
  const action = log.action;

  switch (action) {
    case "member.transfer":
      return `ย้ายพนักงาน ${meta.email || ""} ไปยังสาขาใหม่`;
    case "lead.transfer":
      return `ส่งต่อลูกค้าคุณ ${meta.fullName || "N/A"} ให้สาขาอื่นดูแล`;
    case "member.add":
      return `เพิ่มพนักงาน ${meta.email || ""} เข้าสู่สาขา (Role: ${meta.role || "N/A"})`;
    case "member.remove":
      return `ลบพนักงานออกจากสาขา`;
    case "tenant.create":
      return `สร้างสาขาใหม่: ${meta.name || "N/A"}`;
    case "tenant.update":
      return `แก้ไขข้อมูลสาขา: ${meta.name || "N/A"}`;
    case "tenant.delete":
      return `ลบสาขาออกจากระบบ`;
    case "property.create":
      return `เพิ่มทรัพย์สินใหม่: ${meta.title || "N/A"}`;
    case "property.update":
      return `อัปเดตข้อมูลทรัพย์สิน`;
    case "property.trash":
      return `ย้ายทรัพย์สินลงถังขยะ`;
    case "property.restore":
      return `กู้คืนทรัพย์สินจากถังขยะ`;
    case "property.permanent_delete":
      return `ลบทรัพย์สินอย่างถาวร`;
    case "lead.create":
      return `เพิ่มลีดใหม่: ${meta.full_name || "N/A"}`;
    case "lead.update":
      return `อัปเดตข้อมูลลีด`;
    case "deal.create":
      return `สร้างดีลใหม่`;
    case "auth.login":
      return `เข้าสู่ระบบ`;
    case "property.export":
      return `ส่งออกรายงานทรัพย์สิน (${meta.count || 0} รายการ)`;
    default:
      if (action.includes("delete")) return `ลบข้อมูล (${log.entity})`;
      if (action.includes("create")) return `สร้างข้อมูลใหม่ (${log.entity})`;
      if (action.includes("status.update")) return `อัปเดตสถานะ (${log.entity})`;
      return action;
  }
}
