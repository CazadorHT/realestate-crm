import { InlineKeyboard } from "grammy";
import { siteConfig } from "@/lib/site-config";
import { 
  PROPERTY_TYPE_LABELS, 
  LISTING_TYPE_LABELS 
} from "@/features/properties/labels";

/**
 * 📝 Property Detail Formatter for Telegram (HTML Mode)
 */
export function formatPropertyDetail(prop: any) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const adminUrl = `${baseUrl}/dashboard/properties/${prop.id}`; // Adjusted to match typical CRM dashboard path
  
  const price = prop.price ? `${prop.price.toLocaleString()} THB` : "N/A";
  const rent = prop.rental_price ? `${prop.rental_price.toLocaleString()} THB/mo` : "N/A";
  
  const typeLabel = PROPERTY_TYPE_LABELS[prop.property_type as keyof typeof PROPERTY_TYPE_LABELS] || prop.property_type || "N/A";
  const listingLabel = LISTING_TYPE_LABELS[prop.listing_type as keyof typeof LISTING_TYPE_LABELS] || prop.listing_type || "N/A";

  return `
<b>🏠 [${prop.id}] ${prop.title}</b>

<b>สถานะ:</b> <code>${prop.status || "UNKNOWN"}</code>
<b>ประเภท:</b> ${typeLabel} (${listingLabel})
<b>ทำเล:</b> ${prop.popular_area || prop.district || "N/A"}
<b>ราคาขาย:</b> ${price}
<b>ค่าเช่า:</b> ${rent}

<b>รายละเอียด:</b>
${prop.bedrooms || 0} ห้องนอน | ${prop.bathrooms || 0} ห้องน้ำ | ${prop.size_sqm || 0} ตร.ม.

<a href="${adminUrl}">🔗 จัดการบน CRM Dashboard</a>
  `.trim();
}

/**
 * ⌨️ Inline Keyboard for Property Actions
 */
export function buildPropertyKeyboard(propId: string) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const adminUrl = `${baseUrl}/dashboard/properties/${propId}`;

  return new InlineKeyboard()
    .url("🌐 แก้ไขบน CRM", adminUrl)
    .row()
    .text("✅ ตรวจสอบแล้ว", `confirm_prop:${propId}`)
    .text("❌ ปิดการขาย", `sold_prop:${propId}`);
}

/**
 * 📊 Daily Report Formatter
 */
export function formatDailyReport(data: {
  newLeads: number;
  newBookings: number;
  activeProperties: number;
  totalTeamActions: number;
}) {
  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<b>📊 สรุปรายงานประจำวันที่ ${today}</b>
━━━━━━━━━━━━━━━━━━

<b>🆕 Lead ใหม่วันนี้:</b> <code>${data.newLeads}</code> ราย
<b>📅 การจอง/นัดหมายใหม่:</b> <code>${data.newBookings}</code> เคส
<b>🏘️ ทรัพย์ที่ Active อยู่:</b> <code>${data.activeProperties}</code> รายการ
<b>⚡ กิจกรรมทีมงาน:</b> <code>${data.totalTeamActions}</code> ครั้ง

<i>"ยินดีด้วยกับความสำเร็จในวันนี้นะครับ ทีมงานลุยต่อครับ!"</i>
  `.trim();
}

/**
 * 🔔 Lead Notification Formatter
 */
export function formatLeadNotification(lead: any, profile?: any) {
  return `
<b>🆕 🔔 มีคนสนใจทรัพย์สิน! (Lead ใหม่)</b>

<b>👤 ผู้สนใจ:</b> ${profile?.displayName || lead.full_name || "ลูกค้า LINE"}
<b>📱 ช่องทาง:</b> ${lead.source || "LINE"}
<b>💬 ข้อความล่าสุด:</b> <i>"${lead.last_message || "สนใจทรัพย์"}"</i>

<b>📍 ทรัพย์ที่สนใจ:</b> ${lead.interesting_property || "ไม่ระบุ"}
  `.trim();
}

export function buildLeadActionKeyboard(leadId: string) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const leadUrl = `${baseUrl}/dashboard/leads/${leadId}`;

  return new InlineKeyboard()
    .text("🙋‍♂️ รับงาน (Claim)", `claim_lead:${leadId}`)
    .row()
    .url("🔍 ดูรายละเอียด Lead", leadUrl);
}
