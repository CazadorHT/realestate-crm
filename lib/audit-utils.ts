/**
 * 🛡️ Shared Audit Types & Utilities (Client + Server Safe)
 * This file should NOT import anything that uses 'next/headers' or server-only APIs.
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
  | string;

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
  | string;

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
