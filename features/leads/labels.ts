import type { Database } from "@/lib/database.types";
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type LeadActivityType =
  Database["public"]["Enums"]["lead_activity_type"];
/** ===== Activity Types (enum ของคุณ) =====
 * ถ้าคุณมี enum จริงใน DB (recommended):
 * Database["public"]["Enums"]["lead_activity_type"]
 */
export const LEAD_SOURCE_LABELS = {
  PORTAL: "ติดต่อเข้ามาเอง",
  FACEBOOK: "มาจากช่องทางเฟซบุ๊ก",
  LINE: "มาจากช่องทางไลน์",
  WEBSITE: "มาจากช่องทางเว็บไซต์",
  REFERRAL: "ถูกแนะนำมา",
  OTHER: "อื่น ๆ",
} satisfies Record<LeadSource, string>;

export const LEAD_STAGE_LABELS = {
  NEW: "ลูกค้าใหม่",
  CONTACTED: "ติดต่อกับลูกค้าแล้ว",
  VIEWED: "ลูกค้านัดดูแล้ว",
  NEGOTIATING: "กำลังต่อรอง",
  CLOSED: "ปิดดีลแล้ว",
} satisfies Record<LeadStage, string>;

export const LEAD_ACTIVITY_TYPE_LABELS = {
  CALL: "โทร",
  LINE_CHAT: "แชท LINE",
  EMAIL: "อีเมล",
  VIEWING: "นัดดูทรัพย์",
  FOLLOW_UP: "ติดตาม",
  NOTE: "บันทึกโน้ต",
  SYSTEM: "ระบบ",
} satisfies Record<LeadActivityType, string>;
/** === ORDER (ใช้ sort_order ที่คุณกำหนด) ===
 * TS จะบังคับว่ารายการใน array ต้องเป็น enum ของจริง
 */
export const LEAD_STAGE_ORDER = [
  "NEW",
  "CONTACTED",
  "VIEWED",
  "NEGOTIATING",
  "CLOSED",
] as const satisfies readonly [LeadStage, ...LeadStage[]];

export const LEAD_SOURCE_ORDER = [
  "PORTAL",
  "FACEBOOK",
  "LINE",
  "WEBSITE",
  "REFERRAL",
  "OTHER",
] as const satisfies readonly [LeadSource, ...LeadSource[]];

export const LEAD_ACTIVITY_TYPE_ORDER = [
  "CALL",
  "LINE_CHAT",
  "EMAIL",
  "VIEWING",
  "FOLLOW_UP",
  "NOTE",
  "SYSTEM",
] as const satisfies readonly [LeadActivityType, ...LeadActivityType[]];
/** helpers */

export function leadStageLabelNullable(v: LeadStage | null | undefined) {
  if (!v) return "-";
  return LEAD_STAGE_LABELS[v];
}
export function leadSourceLabelNullable(v: LeadSource | null | undefined) {
  if (!v) return "-";
  return LEAD_SOURCE_LABELS[v];
}
export function leadActivityTypeLabelNullable(
  v: LeadActivityType | null | undefined
) {
  if (!v) return "-";
  return LEAD_ACTIVITY_TYPE_LABELS[v];
}
/** fallback เผื่อเจอ string แปลก ๆ (ข้อมูลเก่าหรือ null) */
export function safeEnumLabel(map: Record<string, string>, v: any) {
  if (!v) return "-";
  return map[v] ?? String(v);
}

export const NATIONALITY_OPTIONS = [
  "ไทย",
  "จีน",
  "ญี่ปุ่น",
  "เกาหลี",
  "อเมริกัน",
  "อังกฤษ",
  "ฝรั่งเศส",
  "เยอรมัน",
  "รัสเซีย",
  "อินเดีย",
  "สิงคโปร์",
  "มาเลเซีย",
  "พม่า",
  "กัมพูชา",
  "ลาว",
  "เวียดนาม",
  "ไต้หวัน",
  "ฮ่องกง",
  "ออสเตรเลีย",
  "อื่นๆ",
] as const;
