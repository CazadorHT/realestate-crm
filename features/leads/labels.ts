export type LeadStage = "NEW" | "CONTACTED" | "VIEWED" | "NEGOTIATING" | "CLOSED";
export type LeadSource = "PORTAL" | "FACEBOOK" | "INSTAGRAM" | "LINE" | "WEBSITE" | "REFERRAL" | "OTHER" | "WHATSAPP" | "WECHAT";
export type LeadActivityType = "CALL" | "LINE_CHAT" | "EMAIL" | "VIEWING" | "FOLLOW_UP" | "NOTE" | "SYSTEM";
export type MultiLangLabel = {
  th: string;
  en: string;
};

export const LEAD_SOURCE_I18N: Record<LeadSource, MultiLangLabel> = {
  PORTAL: { th: "ติดต่อเข้ามาเอง", en: "Inbound / Portal" },
  FACEBOOK: { th: "มาจาก Facebook", en: "Facebook" },
  INSTAGRAM: { th: "มาจาก Instagram", en: "Instagram" },
  LINE: { th: "มาจาก LINE", en: "LINE" },
  WEBSITE: { th: "มาจาก Website", en: "Website" },
  REFERRAL: { th: "ถูกแนะนำมา", en: "Referral" },
  OTHER: { th: "อื่น ๆ", en: "Other" },
  WHATSAPP: { th: "มาจาก Whatsapp", en: "WhatsApp" },
  WECHAT: { th: "มาจาก WeChat", en: "WeChat" },
};

export const LEAD_STAGE_I18N: Record<LeadStage, MultiLangLabel> = {
  NEW: { th: "ลูกค้าใหม่", en: "New Lead" },
  CONTACTED: { th: "ติดต่อกับลูกค้าแล้ว", en: "Contacted" },
  VIEWED: { th: "ลูกค้านัดดูแล้ว", en: "Viewing" },
  NEGOTIATING: { th: "กำลังต่อรอง", en: "Negotiating" },
  CLOSED: { th: "ปิดดีลแล้ว", en: "Closed" },
};

export const LEAD_ACTIVITY_TYPE_I18N: Record<LeadActivityType, MultiLangLabel> = {
  CALL: { th: "โทรศัพท์", en: "Phone Call" },
  LINE_CHAT: { th: "แชท LINE", en: "LINE Chat" },
  EMAIL: { th: "อีเมล", en: "Email" },
  VIEWING: { th: "พาชมทรัพย์", en: "Viewing" },
  FOLLOW_UP: { th: "ติดตามผล", en: "Follow-up" },
  NOTE: { th: "บันทึก", en: "Note" },
  SYSTEM: { th: "ระบบ", en: "System" },
};

export const LEAD_SOURCE_LABELS = {
  PORTAL: "ติดต่อเข้ามาเอง",
  FACEBOOK: "มาจากช่องทาง Facebook",
  INSTAGRAM: "มาจากช่องทาง Instagram",
  LINE: "มาจากช่องทาง LINE",
  WEBSITE: "มาจากช่องทาง Website",
  REFERRAL: "ถูกแนะนำมา",
  OTHER: "อื่น ๆ",
  WHATSAPP: "มาจากช่องทาง Whatsapp",
  WECHAT: "มาจากช่องทาง WeChat",
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
  "INSTAGRAM",
  "LINE",
  "WEBSITE",
  "REFERRAL",
  "OTHER",
  "WHATSAPP",
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

export function leadStageLabelNullable(v: LeadStage | string | null | undefined, lang?: string) {
  if (!v) return "-";
  const entry = LEAD_STAGE_I18N[v as LeadStage];
  if (entry) return lang === "en" ? entry.en : entry.th;
  return LEAD_STAGE_LABELS[v as LeadStage] ?? v;
}

export function leadSourceLabelNullable(v: LeadSource | string | null | undefined, lang?: string) {
  if (!v) return "-";
  const entry = LEAD_SOURCE_I18N[v as LeadSource];
  if (entry) return lang === "en" ? entry.en : entry.th;
  return LEAD_SOURCE_LABELS[v as LeadSource] ?? v;
}

export function leadActivityTypeLabelNullable(
  v: LeadActivityType | string | null | undefined,
  lang?: string,
) {
  if (!v) return "-";
  const entry = LEAD_ACTIVITY_TYPE_I18N[v as LeadActivityType];
  if (entry) return lang === "en" ? entry.en : entry.th;
  return LEAD_ACTIVITY_TYPE_LABELS[v as LeadActivityType] ?? v;
}

/** fallback เผื่อเจอ string แปลก ๆ (ข้อมูลเก่าหรือ null) */
export function safeEnumLabel(map: Record<string, any>, v: any, lang?: string) {
  if (!v) return "-";
  const val = map[v];
  if (val && typeof val === "object" && "th" in val && "en" in val) {
    return lang === "en" ? val.en : val.th;
  }
  return val ?? String(v);
}

export const NATIONALITY_OPTIONS = [
  { value: "ไทย", label: "ไทย / Thai" },
  { value: "จีน", label: "จีน / Chinese" },
  { value: "ญี่ปุ่น", label: "ญี่ปุ่น / Japanese" },
  { value: "เกาหลี", label: "เกาหลี / Korean" },
  { value: "อเมริกัน", label: "อเมริกัน / American" },
  { value: "อังกฤษ", label: "อังกฤษ / British" },
  { value: "ฝรั่งเศส", label: "ฝรั่งเศส / French" },
  { value: "เยอรมัน", label: "เยอรมัน / German" },
  { value: "รัสเซีย", label: "รัสเซีย / Russian" },
  { value: "อินเดีย", label: "อินเดีย / Indian" },
  { value: "สิงคโปร์", label: "สิงคโปร์ / Singaporean" },
  { value: "มาเลเซีย", label: "มาเลเซีย / Malaysian" },
  { value: "พม่า", label: "พม่า / Burmese" },
  { value: "กัมพูชา", label: "กัมพูชา / Cambodian" },
  { value: "ลาว", label: "ลาว / Laotian" },
  { value: "เวียดนาม", label: "เวียดนาม / Vietnamese" },
  { value: "ฟิลิปปินส์", label: "ฟิลิปปินส์ / Philippines" },
  { value: "อินโดนีเซีย", label: "อินโดนีเซีย / Indonesian" },
  { value: "สเปน", label: "สเปน / Spanish" },
  { value: "ไต้หวัน", label: "ไต้หวัน / Taiwanese" },
  { value: "ฮ่องกง", label: "ฮ่องกง / Hong Konger" },
  { value: "ออสเตรเลีย", label: "ออสเตรเลีย / Australian" },
  { value: "อื่นๆ", label: "อื่นๆ / Others" },
] as const;

