import { InlineKeyboard } from "grammy";
import { siteConfig } from "@/lib/site-config";
import type { Tables } from "./database.types";
import { 
  PROPERTY_TYPE_LABELS, 
  LISTING_TYPE_LABELS 
} from "@/features/properties/labels";

/**
 * 🏁 Nationality Emoji Mapping
 */
const FLAGS: Record<string, string> = {
  "ไทย": "🇹🇭",
  "จีน": "🇨🇳",
  "ญี่ปุ่น": "🇯🇵",
  "เกาหลี": "🇰🇷",
  "อเมริกัน": "🇺🇸",
  "อังกฤษ": "🇬🇧",
  "ฝรั่งเศส": "🇫🇷",
  "เยอรมัน": "🇩🇪",
  "รัสเซีย": "🇷🇺",
  "อินเดีย": "🇮🇳",
  "สิงคโปร์": "🇸🇬",
  "มาเลเซีย": "🇲🇾",
  "พม่า": "🇲🇲",
  "กัมพูชา": "🇰🇭",
  "ลาว": "🇱🇦",
  "เวียดนาม": "🇻🇳",
  "ไต้หวัน": "🇹🇼",
  "ฮ่องกง": "🇭🇰",
  "ออสเตรเลีย": "🇦🇺",
};

/**
 * 💰 Elite Budget Formatter (e.g., 5.5M)
 */
function formatMoneyM(val: number | null | undefined): string {
  if (val === null || val === undefined) return "N/A";
  if (val >= 1000000) {
    const million = val / 1000000;
    return `฿${million.toFixed(1)}M`;
  }
  return `฿${val.toLocaleString()}`;
}

function formatBudgetRange(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "ตามตกลง (N/A)";
  if (min === max) return formatMoneyM(min);
  return `${formatMoneyM(min)} - ${formatMoneyM(max)}`;
}

/**
 * 🏠 Property Detail Formatter
 */
export function formatPropertyDetail(prop: Tables<"properties">) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const adminUrl = `${baseUrl}/dashboard/properties/${prop.id}`;
  
  const statusBadges: Record<string, string> = {
    ACTIVE: "🟢 ACTIVE",
    SOLD: "🔴 SOLD",
    RENTED: "🔵 RENTED",
    RESERVED: "🟡 RESERVED",
    UNDER_OFFER: "🟠 UNDER OFFER",
    ARCHIVED: "⚪ ARCHIVED",
    DRAFT: "📝 DRAFT",
  };

  const badge = statusBadges[prop.status || "DRAFT"] || `⚪ ${prop.status}`;
  
  const typeLabel = PROPERTY_TYPE_LABELS[prop.property_type as keyof typeof PROPERTY_TYPE_LABELS] || prop.property_type || "N/A";
  const listingLabel = LISTING_TYPE_LABELS[prop.listing_type as keyof typeof LISTING_TYPE_LABELS] || prop.listing_type || "N/A";

  // 💰 Pricing Intelligence
  let priceLines = "";
  
  // Sale Section
  if (prop.listing_type === "SALE" || prop.listing_type === "SALE_AND_RENT") {
    const isHotDeal = prop.original_price && prop.price && prop.price < prop.original_price;
    const discountPercent = isHotDeal ? Math.round(((prop.original_price! - prop.price!) / prop.original_price!) * 100) : 0;
    
    priceLines += `<b>💰 ราคาขาย:</b> ${prop.price ? formatMoneyM(prop.price) : "N/A"}`;
    if (isHotDeal) priceLines += ` (🔥 <i>ลด ${discountPercent}% จาก ${formatMoneyM(prop.original_price)}</i>)`;
    if (prop.price_per_sqm) priceLines += `\n└ 📐 ฿${prop.price_per_sqm.toLocaleString()}/ตร.ม.`;
    priceLines += "\n";
  }

  // Rent Section
  if (prop.listing_type === "RENT" || prop.listing_type === "SALE_AND_RENT") {
    const isHotRent = prop.original_rental_price && prop.rental_price && prop.rental_price < prop.original_rental_price;
    const discountRentPercent = isHotRent ? Math.round(((prop.original_rental_price! - prop.rental_price!) / prop.original_rental_price!) * 100) : 0;

    priceLines += `<b>💎 ค่าเช่า:</b> ${prop.rental_price ? `${formatMoneyM(prop.rental_price)}/ด.` : "N/A"}`;
    if (isHotRent) priceLines += ` (🔥 <i>ลด ${discountRentPercent}% จาก ${formatMoneyM(prop.original_rental_price)}</i>)`;
    if (prop.rent_price_per_sqm) priceLines += `\n└ 📐 ฿${prop.rent_price_per_sqm.toLocaleString()}/ตร.ม.`;
    priceLines += "\n";
  }

  // Additional Fees
  let feeLines = "";
  if (prop.maintenance_fee) feeLines += `• 🛠️ ส่วนกลาง: ฿${prop.maintenance_fee.toLocaleString()}/ด.\n`;
  if (prop.parking_fee_additional) feeLines += `• 🚗 จอดรถเสริม: ฿${prop.parking_fee_additional.toLocaleString()}/ด.\n`;
  if (prop.water_charge) feeLines += `• 💧 ค่าน้ำ: ${prop.water_charge}\n`;
  if (prop.electricity_charge) feeLines += `• ⚡ ค่าไฟ: ${prop.electricity_charge}\n`;

  return `
<b>🏢 [${prop.id}] ${prop.title}</b>
━━━━━━━━━━━━━━━━━━

<b>สถานะ:</b> <code>${badge}</code>
<b>ประเภท:</b> ${typeLabel} (${listingLabel})
<b>ทำเล:</b> ${prop.popular_area || prop.district || "N/A"}

${priceLines.trim()}

<b>รายละเอียด:</b>
• 🛏️ ${prop.bedrooms || 0} นอน | 🚿 ${prop.bathrooms || 0} น้ำ
• 📐 ${prop.size_sqm || 0} ตร.ม. | ชั้น ${prop.floor || "-"}
${feeLines.trim()}

<a href="${adminUrl}">🔍 จัดการบน CRM Dashboard</a>
  `.trim();
}

/**
 * ⌨️ Inline Keyboard for Property Actions
 */
export function buildPropertyKeyboard(propId: string) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const adminUrl = `${baseUrl}/dashboard/properties/${propId}`;

  return new InlineKeyboard()
    .url("🌐 แก้ไขข้อมูล", adminUrl)
    .row()
    .text("✅ Verified", `confirm_prop:${propId}`)
    .text("🎉 Sold/ปิดการขาย", `sold_prop:${propId}`);
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
<b>🏘️ ทรัพย์ที่ Active:</b> <code>${data.activeProperties}</code> รายการ
<b>⚡ กิจกรรมทีมงาน:</b> <code>${data.totalTeamActions}</code> ครั้ง

<i>"ทีมงาน VCC Asset ลุยต่อครับ!"</i>
  `.trim();
}

/**
 * 🔔 Lead Notification Formatter
 */
export function formatLeadNotification(
  lead: Partial<Tables<"leads">>, 
  options?: { 
    property?: Tables<"properties">; 
    lastMessage?: string; 
    customPropertyTitle?: string;
  }
) {
  const flag = FLAGS[lead.nationality || ""] || "🏳️";
  const budget = formatBudgetRange(lead.budget_min, lead.budget_max);
  const leadType = lead.lead_type === "COMPANY" ? "🏢 นิติบุคคล" : "👤 บุคคลธรรมดา";
  
  const propertyInfo = options?.property 
    ? `${options.property.title} [${options.property.id}]`
    : (options?.customPropertyTitle || lead.property_id || "ไม่ระบุ");

  return `
<b>🆕 🔔 มี Lead สนใจอสังหาฯ!</b>
━━━━━━━━━━━━━━━━━━

<b>👤 ชื่อ:</b> ${lead.full_name || "ลูกค้า"} (${flag})
<b>💰 งบประมาณ:</b> <code>${budget}</code>
<b>🎭 ประเภท:</b> ${leadType}
<b>📍 สนใจทรัพย์:</b> ${propertyInfo}

<b>📱 ข้อมูลติดต่อ:</b>
• โทร: <code>${lead.phone || "-"}</code>
• LINE: <code>${lead.line_id || "-"}</code>

<b>💬 ข้อความ:</b> <i>"${options?.lastMessage || lead.note || "สนใจทรัพย์"}"</i>
  `.trim();
}

/**
 * 🔥 Price Drop Notification Formatter
 */
export function formatPriceDropNotification(
  prop: Tables<"properties">, 
  oldPrice: number, 
  newPrice: number,
  type: "SALE" | "RENT"
) {
  const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  const fireCount = discountPercent >= 30 ? "🔥🔥🔥" : discountPercent >= 15 ? "🔥🔥" : "🔥";
  
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const adminUrl = `${baseUrl}/dashboard/properties/${prop.id}`;

  return `
${fireCount} <b>PRICE DROP ALERT!</b> ${fireCount}
━━━━━━━━━━━━━━━━━━

<b>🏢 ทรัพย์:</b> ${prop.title} [${prop.id}]
<b>📍 ทำเล:</b> ${prop.popular_area || prop.district || "ไม่ระบุ"}

<b>📉 ราคาลดลง:</b> <code>${discountPercent}%</code>
<b>💰 เดิม:</b> ${formatMoneyM(oldPrice)}
<b>✅ ใหม่:</b> <b>${formatMoneyM(newPrice)}</b>${type === "RENT" ? "/ด." : ""}

<i>"โอกาสทอง! รีบเสนอขายลูกค้าด่วนครับทีมงาน"</i>

<a href="${adminUrl}">🔍 ดูรายละเอียดและจัดการ</a>
  `.trim();
}

/**
 * 📅 Contract Expiry Notification Formatter
 */
export function formatContractExpiryNotification(
  data: {
    contractId: string;
    propertyName: string;
    customerName: string;
    endDate: string;
    daysRemaining: number;
    agentId?: string;
  }
) {
  const urgencyBadge = data.daysRemaining <= 7 ? "🔴 ด่วนที่สุด" : data.daysRemaining <= 14 ? "🟡 เร่งด่วน" : "🟢 แจ้งเตือน";
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const contractUrl = `${baseUrl}/dashboard/contracts/${data.contractId}`;

  return `
⏰ <b>${urgencyBadge} (Expiry Alert)</b>
━━━━━━━━━━━━━━━━━━

<b>📋 สัญญาเลขที่:</b> <code>${data.contractId}</code>
<b>👤 ลูกค้า:</b> ${data.customerName}
<b>🏠 ทรัพย์:</b> ${data.propertyName}

<b>🗓️ วันหมดอายุ:</b> <code>${new Date(data.endDate).toLocaleDateString("th-TH")}</code>
<b>⏳ เหลือเวลา:</b> <b>${data.daysRemaining} วัน</b>

<i>"กรุณาติดต่อลูกค้าเพื่อทำเรื่องต่อสัญญาหรือตรวจรับทรัพย์คืนครับ"</i>

<a href="${contractUrl}">🔍 ตรวจสอบสัญญาบน CRM</a>
  `.trim();
}

/**
 * 💰 Commission Payout Notification Formatter
 */
export function formatPayoutSuccessNotification(
  data: {
    agentName: string;
    netAmount: number;
    reference: string;
    dealId: string;
  }
) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const walletUrl = `${baseUrl}/dashboard/wallet`;

  return `
🎊 <b>ยินดีด้วยครับ! ค่าคอมมิชชันโอนสำเร็จ</b> 🎊
━━━━━━━━━━━━━━━━━━━

<b>👤 เอเยนต์:</b> ${data.agentName}
<b>💵 ยอดโอนสุทธิ:</b> <b>฿${data.netAmount.toLocaleString()}</b>
<b>🧾 เลขอ้างอิง:</b> <code>${data.reference}</code>

<i>บัญชีของคุณได้รับการอัพเดทเรียบร้อยแล้ว</i>
<i>ขอบคุณสำหรับความทุ่มเทเพื่อ VCC Asset ครับ! ✨</i>

<a href="${walletUrl}">📄 ดูสลิปและใบ 50 ทวิ</a>
  `.trim();
}

/**
 * ⌨️ Action Keyboard for Leads
 */
export function buildLeadActionKeyboard(leadId: string, phone: string | null) {
  const baseUrl = siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
  const leadUrl = `${baseUrl}/dashboard/leads/${leadId}`;
  const cleanPhone = phone?.replace(/\D/g, "") || "";
  
  const kb = new InlineKeyboard()
    .text("🙋‍♂️ รับงาน (Claim)", `claim_lead:${leadId}`)
    .row();

  if (cleanPhone) {
    kb.url("📞 โทรออก", `tel:${cleanPhone}`)
      .url("💬 WhatsApp", `https://wa.me/${cleanPhone.startsWith("0") ? "66" + cleanPhone.slice(1) : cleanPhone}`)
      .row();
  }

  return kb.url("🔍 ดูบน CRM", leadUrl);
}
