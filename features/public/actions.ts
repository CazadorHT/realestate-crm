"use server";

import { createClient } from "@/lib/supabase/server";
import { DepositLeadInput, InquiryLeadInput, LeadState } from "./types";
import { depositLeadSchema, inquiryLeadSchema } from "./schema";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { siteConfig } from "@/lib/site-config";
import {
  getPublicImageUrl,
  getCoverImageUrl,
} from "@/features/properties/image-utils";
import { FlexBubble, FlexComponent, FlexBox, FlexText, FlexImage } from "@line/bot-sdk";
import { encrypt, generateBlindIndex } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

interface PropertyData {
  id?: string;
  title?: string | null;
  district?: string | null;
  province?: string | null;
  property_images?: { image_url: string; is_cover: boolean; sort_order: number }[];
  rental_price?: number | null;
  price?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  listing_type?: string | null;
}

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Duplicate submission cache (Content Hash within 3-minute sliding window)
const duplicateSubmissionCache = new Map<string, number>();
const DUPLICATE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function isDuplicateSubmission(phone: string, propertyType: string, details?: string | null): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const cleanDetails = (details || "").trim().toLowerCase();
  const key = `${cleanPhone}:${propertyType}:${cleanDetails}`;

  const now = Date.now();
  const lastTime = duplicateSubmissionCache.get(key);

  if (lastTime && now - lastTime < DUPLICATE_TTL_MS) {
    return true;
  }

  duplicateSubmissionCache.set(key, now);

  if (duplicateSubmissionCache.size > 1000) {
    for (const [k, time] of duplicateSubmissionCache.entries()) {
      if (now - time > DUPLICATE_TTL_MS) duplicateSubmissionCache.delete(k);
    }
  }
  return false;
}

// Helper to sanitize HTML/Script tags (Anti-XSS)
function sanitizeInput(text?: string | null): string | undefined {
  if (text === undefined || text === null) return undefined;
  return text
    .replace(/<[^>]*>?/gm, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// Helper to reset duplicate cache for testing
export async function clearDuplicateSubmissionCache() {
  duplicateSubmissionCache.clear();
}

// ==========================================
// 📸 DEPOSIT PREVIEW IMAGE UPLOAD ACTION
// ==========================================
export async function uploadDepositPreviewAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "กรุณาเลือกไฟล์รูปภาพ" };

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, message: "ขนาดไฟล์ต้องไม่เกิน 10MB" };
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { success: false, message: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, HEIC)" };
    }

    const supabase = await createClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sharp = (await import("sharp")).default;
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `deposit-previews/${Date.now()}_${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(fileName, compressedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Deposit Preview Upload Error]:", uploadError);
      return { success: false, message: "อัปโหลดรูปภาพไม่สำเร็จ" };
    }

    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl || getPublicImageUrl(fileName, "property-images");
    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("[Deposit Preview Upload Exception]:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" };
  }
}

// ==========================================
// 🏠 DEPOSIT LEAD ACTION
// ==========================================
export async function createDepositLeadAction(data: DepositLeadInput) {
  const parsed = depositLeadSchema.safeParse(data);
  if (!parsed.success) return { success: false, message: "ข้อมูลไม่ถูกต้อง" };

  // Sanitize text inputs
  const sanitizedFullName = sanitizeInput(data.fullName);
  const sanitizedDetails = sanitizeInput(data.details);
  const sanitizedEmail = sanitizeInput(data.email);
  const sanitizedLineId = sanitizeInput(data.lineId);

  // 1. Honeypot Check (Silent drop for bot submissions)
  if (data.website_hp && data.website_hp.trim().length > 0) {
    return { success: true, leadId: "hp_blocked" };
  }

  // 2. IP Rate Limiting
  let ip = "127.0.0.1";
  try {
    ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  } catch (e) {
    // Safe fallback outside Next.js request scope
  }
  try {
    await limiter.check(3, ip);
  } catch {
    return { success: false, message: "⏳ คุณส่งข้อมูลถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" };
  }

  // 3. Smart Duplicate Content Hash Check (Same phone + type + details within 3 mins)
  if (isDuplicateSubmission(data.phone, data.propertyType, sanitizedDetails)) {
    return {
      success: true,
      leadId: "dup_acknowledged",
      message: "ระบบได้รับข้อมูลของท่านแล้วเรียบร้อย",
    };
  }

  const supabase = await createClient();
  const cleanPhone = data.phone.replace(/[^0-9+]/g, "");
  const cleanLineId = sanitizedLineId?.replace(/^@/, "").trim();

  const { data: leadId, error: rpcError } = await supabase.rpc(
    "create_deposit_lead",
    {
      p_full_name: encrypt(sanitizedFullName) || sanitizedFullName,
      p_full_name_hash: generateBlindIndex(sanitizedFullName),
      p_phone: encrypt(data.phone) || data.phone,
      p_phone_hash: generateBlindIndex(data.phone),
      p_email: encrypt(sanitizedEmail || "") || sanitizedEmail || "",
      p_email_hash: generateBlindIndex(sanitizedEmail || ""),
      p_line_id: encrypt(cleanLineId || "") || cleanLineId || "",
      p_line_id_hash: generateBlindIndex(cleanLineId || ""),
      p_wechat_id: sanitizeInput(data.wechatId),
      p_whatsapp: sanitizeInput(data.whatsapp),
      p_property_type: data.propertyType,
      p_note: encrypt(`[ฝากทรัพย์]
อีเมล: ${sanitizedEmail || "-"}
Line: ${cleanLineId || "-"}
WeChat: ${sanitizeInput(data.wechatId) || "-"}
WhatsApp: ${sanitizeInput(data.whatsapp) || "-"}
Type: ${data.propertyType}
Image: ${data.propertyImage || "-"}
Details:
${sanitizedDetails || "-"}`),
    }
  );

  if (rpcError) {
    console.error("Error creating deposit lead via RPC:", rpcError);
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }

  const PROPERTY_TYPE_MAP: Record<string, string> = {
    CONDO: "คอนโด", HOUSE: "บ้านเดี่ยว", TOWNHOME: "ทาวน์โฮม", LAND: "ที่ดิน",
    COMMERCIAL: "อาคารพาณิชย์", APARTMENT: "อพาร์ทเมนท์", HOTEL: "โรงแรม",
    OFFICE: "สำนักงาน", WAREHOUSE: "โกดัง", FACTORY: "โรงงาน",
  };

  const templateConfig = await getTemplateConfig("DEPOSIT");
  const footerButtons: FlexComponent[] = [];
  if (data.phone) {
    footerButtons.push({
      type: "box", layout: "vertical", backgroundColor: "#1E88E5", cornerRadius: "lg", paddingAll: "lg",
      contents: [{ type: "text", text: "📞 โทรออก", size: "sm", color: "#ffffff", align: "center", weight: "bold" }],
      action: { type: "uri", label: "Call", uri: `tel:${cleanPhone || ""}` }
    });
  }
  if (data.lineId) {
    footerButtons.push({
      type: "box", layout: "vertical", backgroundColor: "#00B900", cornerRadius: "lg", paddingAll: "lg",
      contents: [{ type: "text", text: "📱 ทัก LINE", size: "sm", color: "#ffffff", align: "center", weight: "bold" }],
      action: { type: "uri", label: "LINE", uri: `https://line.me/ti/p/~${cleanLineId}` }
    });
  }
  footerButtons.push({
    type: "box", layout: "vertical", backgroundColor: templateConfig.config.headerColor || "#0D47A1", cornerRadius: "lg", paddingAll: "lg",
    contents: [{ type: "text", text: "📂 ดูในระบบ", size: "sm", color: "#ffffff", align: "center", weight: "bold" }],
    action: { type: "uri", label: "CRM", uri: `${siteConfig.url}/protected/leads/${leadId}` }
  });

  const flexBubble: FlexBubble = {
    type: "bubble",
    header: {
      type: "box", layout: "horizontal", backgroundColor: templateConfig.config.headerColor || "#0D47A1", paddingAll: "lg",
      contents: [
        { type: "text", text: "🏠 ", size: "xxl", flex: 1, align: "center", gravity: "center" },
        { type: "text", text: templateConfig.config.headerText || "ฝากทรัพย์ใหม่ (Deposit)", weight: "bold", color: "#FFFFFF", size: "md", flex: 8, gravity: "center", wrap: true }
      ]
    },
    body: {
      type: "box", layout: "vertical", contents: [
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "🏠 ประเภท", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: PROPERTY_TYPE_MAP[data.propertyType] || data.propertyType, size: "sm", color: "#111111", weight: "bold", flex: 7, wrap: true }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "👤 ชื่อลูกค้า", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.fullName, size: "sm", color: "#111111", flex: 7, wrap: true }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "📧 อีเมล", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.email || "-", size: "sm", color: "#111111", flex: 7, wrap: true }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "📞 เบอร์โทร", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.phone, size: "sm", color: "#111111", flex: 7, action: { type: "uri", label: "Call", uri: `tel:${cleanPhone}` } }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "📱 Line ID", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.lineId || "-", size: "sm", color: "#111111", flex: 7 }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "💬 WeChat", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.wechatId || "-", size: "sm", color: "#111111", flex: 7 }] },
        { type: "box", layout: "horizontal", margin: "md", contents: [{ type: "text", text: "🟢 WhatsApp", size: "sm", color: "#555555", flex: 4 }, { type: "text", text: data.whatsapp || "-", size: "sm", color: "#111111", flex: 7 }] },
        { type: "separator", margin: "lg" },
        { type: "text", text: "📝 รายละเอียด:", size: "sm", color: "#555555", margin: "lg" },
        { type: "text", text: data.details || "-", size: "sm", color: "#111111", wrap: true, margin: "sm" }
      ]
    },
    footer: { type: "box", layout: "vertical", spacing: "sm", contents: footerButtons, paddingAll: "lg" }
  };

  if (data.propertyImage) {
    flexBubble.hero = {
      type: "image",
      url: data.propertyImage,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    };
  }

  await sendLineNotification({
    type: "flex",
    altText: "🏠 มีคนฝากทรัพย์ใหม่นะครับ!",
    contents: flexBubble,
  });

  // 🚀 Bridge to Telegram for Website Deposit
  try {
    const { sendAdminNotification, sendAdminPhoto } = await import("@/lib/telegram");
    const propTypeThai = PROPERTY_TYPE_MAP[data.propertyType] || data.propertyType;
    let tgMessage = `🏠 <b>มีคนฝากทรัพย์สินใหม่ (จาก Website)</b>\n━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>ผู้ฝาก:</b> ${data.fullName}\n` +
      `📞 <b>เบอร์โทร:</b> ${data.phone}\n` +
      `📱 <b>Line ID:</b> ${data.lineId || "-"}\n` +
      `📧 <b>อีเมล:</b> ${data.email || "-"}\n` +
      `🏠 <b>ประเภททรัพย์:</b> ${propTypeThai}\n`;

    if (data.propertyImage) {
      tgMessage += `🖼️ <b>รูปตัวอย่างทรัพย์:</b> <a href="${data.propertyImage}">คลิกดูรูปภาพ</a>\n`;
    }

    tgMessage += `📝 <b>รายละเอียด:</b> ${data.details || "-"}\n\n` +
      `📂 <a href="${siteConfig.url}/protected/leads/${leadId}">คลิกจัดการข้อมูลลูกค้าใน CRM</a>`;

    if (data.propertyImage) {
      await sendAdminPhoto(data.propertyImage, tgMessage, { parseMode: "HTML" });
    } else {
      await sendAdminNotification(tgMessage, { parseMode: "HTML" });
    }
  } catch (tgErr) {
    console.error("[BRIDGE] Telegram notification failed for website deposit:", tgErr);
  }

  return { success: true, leadId };
}

// ==========================================
// 💬 PUBLIC INQUIRY ACTION
// ==========================================
export async function submitInquiryAction(prevState: LeadState, formData: FormData): Promise<LeadState> {
  const rawHoneypot = formData.get("website_hp")?.toString();
  if (rawHoneypot && rawHoneypot.trim().length > 0) {
    return { success: true, data: { id: "hp_blocked", aiScore: 0, isHotLead: false, utmSource: "" } };
  }

  let ip = "127.0.0.1";
  try {
    ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
  } catch (e) {
    // Safe fallback outside Next.js request scope
  }
  try { await limiter.check(3, ip); } catch { return { error: "⏳ คุณส่งข้อความเร็วเกินไป" }; }

  const supabase = await createClient();
  const rawPhone = formData.get("phone")?.toString() || "";
  const sanitizedPhone = rawPhone.replace(/\D/g, "");

  const validatedFields = inquiryLeadSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: sanitizedPhone,
    lineId: formData.get("lineId"),
    wechatId: formData.get("wechatId"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    message: formData.get("message"),
    propertyId: formData.get("propertyId"),
    source: "WEBSITE",
    marketing_attribution: formData.get("marketing_attribution")?.toString(),
    ai_lead_score: formData.get("ai_lead_score") ? Number(formData.get("ai_lead_score")) : undefined,
  });

  if (!validatedFields.success) return { error: "ข้อมูลไม่ถูกต้อง", errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]> };

  const { data } = validatedFields;
  const cleanPhone = data.phone.replace(/[^0-9+]/g, "");

  try {
    const { data: lead, error: rpcError } = await supabase.rpc("submit_public_lead", {
      p_full_name: encrypt(data.fullName) || data.fullName,
      p_full_name_hash: generateBlindIndex(data.fullName),
      p_phone: encrypt(data.phone) || data.phone,
      p_phone_hash: generateBlindIndex(data.phone),
      p_email: encrypt(data.email || "") || null,
      p_email_hash: generateBlindIndex(data.email || ""),
      p_line_id: encrypt(data.lineId || "") || null,
      p_line_id_hash: generateBlindIndex(data.lineId || ""),
      p_wechat_id: data.wechatId || null,
      p_whatsapp: data.whatsapp || null,
      p_property_id: data.propertyId,
      p_source: "WEBSITE",
      p_note: data.message,
      p_utm_source: data.marketing_attribution,
      p_ai_score: Math.min(data.ai_lead_score || 0, 100),
    });

    if (rpcError) throw new Error(rpcError.message);
    const leadId = lead as unknown as string;

    let propertyData = null;
    let coverImage = null;

    if (data.propertyId) {
      const { data: property } = await supabase.from("properties").select(`title, rental_price, bedrooms, bathrooms, size_sqm, district, province, listing_type, price, original_price, original_rental_price, property_images (image_url, is_cover, sort_order)`).eq("id", data.propertyId).single();
      if (property) {
        propertyData = property;
        const images = (property.property_images as { image_url: string; is_cover: boolean; sort_order: number }[] || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        coverImage = getCoverImageUrl(images.map(img => ({ image_url: img.image_url, is_cover: img.is_cover || false, sort_order: img.sort_order || 0 })));
      }
    }

    const templateConfig = await getTemplateConfig("INQUIRY");
    const flexContents = await buildPropertyFlexMessage(propertyData, data, leadId, templateConfig, coverImage, cleanPhone);

    if (templateConfig.isActive) {
      await sendLineNotification({
        type: "flex",
        altText: `💬 ใหม่! ลูกค้าสนใจ: ${propertyData?.title || "ทรัพย์"}`,
        contents: flexContents,
      });
    }

    // 🚀 Bridge to Telegram for Website Inquiry
    try {
      const { sendAdminNotification } = await import("@/lib/telegram");
      const propTitle = propertyData ? (propertyData.title?.th || propertyData.title?.en || "ทรัพย์สิน") : "ไม่ระบุทรัพย์สิน";
      const propLink = data.propertyId ? `${siteConfig.url}/protected/properties/${data.propertyId}` : null;
      
      const tgMessage = `💬 <b>ลูกค้าสนใจทรัพย์สิน (จาก Website)</b>\n━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>ผู้สนใจ:</b> ${data.fullName}\n` +
        `📞 <b>เบอร์โทร:</b> ${data.phone}\n` +
        `📱 <b>Line ID:</b> ${data.lineId || "-"}\n` +
        `📧 <b>อีเมล:</b> ${data.email || "-"}\n` +
        `📝 <b>ข้อความ:</b> ${data.message || "-"}\n\n` +
        `🏠 <b>ทรัพย์สินที่สนใจ:</b> ${propTitle}\n` +
        (propLink ? `🔗 <a href="${propLink}">คลิกดูรายละเอียดทรัพย์ในระบบ</a>\n` : "") +
        `📂 <a href="${siteConfig.url}/protected/leads/${leadId}">คลิกจัดการข้อมูลลูกค้าใน CRM</a>`;
      await sendAdminNotification(tgMessage, { parseMode: "HTML" });
    } catch (tgErr) {
      console.error("[BRIDGE] Telegram notification failed for website inquiry:", tgErr);
    }

    return { success: true, data: { id: leadId, aiScore: data.ai_lead_score || 0, isHotLead: (data.ai_lead_score || 0) >= 80, utmSource: data.marketing_attribution || "direct" } };
  } catch (err) {
    console.error("Action Error:", err);
    return { error: "เกิดข้อผิดพลาดในการส่งข้อมูล" };
  }
}

// ==========================================
// 🧩 SMART MATCH LEAD ACTION
// ==========================================
export async function createLeadFromMatchAction(
  sessionId: string,
  propertyId: string,
  contactInfo: { fullName: string; phone: string; email?: string; lineId?: string; wechatId?: string; whatsapp?: string }
) {
  const supabase = await createClient();
  const { data: leadId, error: rpcError } = await supabase.rpc("create_lead_from_match", {
    p_session_id: sessionId,
    p_property_id: propertyId,
    p_full_name: encrypt(contactInfo.fullName) || contactInfo.fullName,
    p_full_name_hash: generateBlindIndex(contactInfo.fullName),
    p_phone: encrypt(contactInfo.phone) || contactInfo.phone,
    p_phone_hash: generateBlindIndex(contactInfo.phone),
    p_email: contactInfo.email ? (encrypt(contactInfo.email) || contactInfo.email) : null,
    p_email_hash: contactInfo.email ? generateBlindIndex(contactInfo.email) : null,
    p_line_id: contactInfo.lineId ? (encrypt(contactInfo.lineId) || contactInfo.lineId) : null,
    p_line_id_hash: contactInfo.lineId ? generateBlindIndex(contactInfo.lineId) : null,
    p_wechat_id: contactInfo.wechatId || null,
    p_whatsapp: contactInfo.whatsapp || null
  });

  if (rpcError) throw new Error(rpcError.message);

  // Notify via LINE
  const { data: property } = await supabase.from("properties").select("title, district, province, property_images(image_url, is_cover, sort_order)").eq("id", propertyId).single();
  const templateConfig = await getTemplateConfig("INQUIRY"); // Reuse inquiry template for now
  
  const coverImage = property ? getCoverImageUrl((property.property_images as { image_url: string; is_cover: boolean; sort_order: number }[] || []).map(img => ({ image_url: img.image_url, is_cover: img.is_cover || false, sort_order: img.sort_order || 0 }))) : null;

  const flexContents = await buildPropertyFlexMessage(property, { ...contactInfo, source: "WEBSITE", message: "สนใจทรัพย์นี้จากระบบ Smart Match Wizard" }, leadId as unknown as string, templateConfig, coverImage, contactInfo.phone.replace(/\D/g, ""));

  await sendLineNotification({
    type: "flex",
    altText: "🎯 ลูกค้าจับคู่ทรัพย์สำเร็จ (Smart Match)",
    contents: flexContents,
  });

  return { success: true, leadId };
}

// ==========================================
// 🛠️ HELPERS (Flex Message Builder)
// ==========================================
interface TemplateConfig {
  config: {
    headerColor?: string;
    headerText?: string;
  };
}

async function buildPropertyFlexMessage(propertyData: PropertyData | null, data: DepositLeadInput | InquiryLeadInput, leadId: string, templateConfig: TemplateConfig, coverImage: string | null, cleanPhone: string) {
  const imageUrl = coverImage ? (coverImage.startsWith("http") ? coverImage : getPublicImageUrl(coverImage)) : null;

  const flex: FlexBubble = {
    type: "bubble",
    header: {
      type: "box", layout: "horizontal", backgroundColor: templateConfig.config.headerColor || "#2E7D32", paddingAll: "lg",
      contents: [
        { type: "text", text: "💬", size: "xxl", flex: 1, align: "center", gravity: "center" },
        { type: "text", text: templateConfig.config.headerText || "สนใจทรัพย์ / สอบถาม", weight: "bold", color: "#FFFFFF", size: "md", flex: 8, gravity: "center", wrap: true }
      ]
    },
    body: { type: "box", layout: "vertical", paddingAll: "none", contents: [] }
  };

  if (imageUrl && flex.body) {
    flex.body.contents.push({ type: "image", url: imageUrl, size: "full", aspectRatio: "4:3", aspectMode: "cover", gravity: "top", action: { type: "uri", label: "View Property", uri: `${siteConfig.url}/properties/${propertyData?.id || ""}` } });
  }

  const bodyContent: FlexBox = { type: "box", layout: "vertical", paddingAll: "md", contents: [] };

  if (propertyData) {
    bodyContent.contents.push(
      { type: "text", text: propertyData.title || "ไม่ระบุชื่อทรัพย์", weight: "bold", size: "sm", wrap: true, color: "#333333" },
      { type: "text", text: `📍 ${propertyData.district || "-"}, ${propertyData.province || "-"}`, size: "xs", color: "#888888", margin: "xs" }
    );

    bodyContent.contents.push({
      type: "box", layout: "horizontal", margin: "md",
      contents: [
        { type: "text", text: `🛏️ ${propertyData.bedrooms || "-"}`, size: "xs", color: "#666666", flex: 1 },
        { type: "separator", color: "#E0E0E0" },
        { type: "text", text: `🚿 ${propertyData.bathrooms || "-"}`, size: "xs", color: "#666666", flex: 1, align: "center" },
        { type: "separator", color: "#E0E0E0" },
        { type: "text", text: `📏 ${propertyData.size_sqm || "-"} ตร.ม.`, size: "xs", color: "#666666", flex: 2, align: "center" }
      ]
    });

    // 💎 DIAMOND GRADE PRICE DISPLAY
    const priceBox = buildPriceSection(propertyData);
    bodyContent.contents.push(priceBox);
    bodyContent.contents.push({ type: "separator", margin: "md" });
  }

  const contactFields: { label: string; value: string; wrap?: boolean }[] = [
    { label: "👤 ลูกค้า:", value: data.fullName || "-" },
    { label: "📧 อีเมล:", value: data.email || "-" },
    { label: "📞 โทร:", value: data.phone || "-" },
    { label: "💬 WeChat:", value: data.wechatId || "-" },
    { label: "🟢 WhatsApp:", value: data.whatsapp || "-" },
    { label: "💬 Line:", value: data.lineId || "-" },
    { label: "📝 ข้อความ:", value: ("message" in data ? data.message : "details" in data ? data.details : "-") || "-", wrap: true }
  ];

  bodyContent.contents.push({
    type: "box", layout: "vertical", margin: "md",
    contents: contactFields.map(f => ({
      type: "box", layout: "horizontal", margin: "sm",
      contents: [{ type: "text", text: f.label, size: "xs", color: "#888888", flex: 3 }, { type: "text", text: f.value, size: "xs", color: "#333333", flex: 7, wrap: f.wrap }]
    }))
  });

  if (flex.body) flex.body.contents.push(bodyContent);

  const footerButtons: FlexComponent[] = [];
  if (propertyData?.id) {
    footerButtons.push({ 
      type: "box", layout: "vertical", backgroundColor: "#666666", cornerRadius: "lg", paddingAll: "lg", 
      contents: [{ type: "text", text: "🏠 ดูทรัพย์", size: "sm", color: "#ffffff", align: "center", weight: "bold" }], 
      action: { type: "uri", label: "ดูทรัพย์บนเว็บ", uri: `${siteConfig.url}/properties/${propertyData.id}` } 
    });
  }
  if (data.phone) footerButtons.push({ type: "box", layout: "vertical", backgroundColor: "#1E88E5", cornerRadius: "lg", paddingAll: "lg", contents: [{ type: "text", text: "📞 โทรออก", size: "sm", color: "#ffffff", align: "center", weight: "bold" }], action: { type: "uri", label: "Call", uri: `tel:${cleanPhone}` } });
  if (data.whatsapp) footerButtons.push({ type: "box", layout: "vertical", backgroundColor: "#25D366", cornerRadius: "lg", paddingAll: "lg", contents: [{ type: "text", text: "🟢 WhatsApp", size: "sm", color: "#ffffff", align: "center", weight: "bold" }], action: { type: "uri", label: "WhatsApp", uri: `https://wa.me/${data.whatsapp.replace(/\D/g, "")}` } });
  footerButtons.push({ type: "box", layout: "vertical", backgroundColor: templateConfig.config.headerColor || "#2E7D32", cornerRadius: "lg", paddingAll: "lg", contents: [{ type: "text", text: "📂 ดูในระบบ", size: "sm", color: "#ffffff", align: "center", weight: "bold" }], action: { type: "uri", label: "CRM", uri: `${siteConfig.url}/protected/leads/${leadId}` } });

  flex.footer = {
    type: "box", layout: "vertical", spacing: "sm", paddingAll: "lg",
    contents: [
      { type: "box", layout: "horizontal", spacing: "sm", contents: footerButtons.slice(0, 2) },
      { type: "box", layout: "horizontal", spacing: "sm", margin: "sm", contents: footerButtons.slice(2) }
    ]
  };

  return flex;
}

function buildPriceSection(propertyData: PropertyData): FlexBox {
  const contents: FlexComponent[] = [];
  
  const createPriceLine = (current: number | null, original: number | null, unit: string = "") => {
    const lines: FlexComponent[] = [];
    const price = current || original;
    if (!price) return [];

    if (original && current && original > current) {
      const discount = Math.round(((original - current) / original) * 100);
      lines.push({
        type: "box", layout: "horizontal", alignItems: "center",
        contents: [
          { type: "box", layout: "vertical", contents: [{ type: "text", text: `฿${original.toLocaleString()}`, size: "xs", color: "#888888", decoration: "line-through" }, { type: "text", text: `฿${current.toLocaleString()}${unit}`, weight: "bold", size: "lg", color: "#E53935" }] },
          { type: "box", layout: "vertical", backgroundColor: "#FFEBEE", paddingAll: "xs", cornerRadius: "sm", margin: "sm", contents: [{ type: "text", text: `-${discount}%`, size: "xs", color: "#E53935", weight: "bold" }] }
        ]
      });
    } else {
      lines.push({ type: "text", text: `฿${price.toLocaleString()}${unit}`, weight: "bold", size: "lg", color: "#E53935" });
    }
    return lines;
  };

  const hasRent = (propertyData.rental_price && propertyData.rental_price > 0) || (propertyData.original_rental_price && propertyData.original_rental_price > 0);
  const hasSale = (propertyData.price && propertyData.price > 0) || (propertyData.original_price && propertyData.original_price > 0);

  if (hasRent) {
    if (hasSale) contents.push({ type: "text", text: "ราคาเช่า:", size: "xs", color: "#888888" });
    contents.push(...createPriceLine(propertyData.rental_price || null, propertyData.original_rental_price || null, "/ด."));
  }
  if (hasSale) {
    if (hasRent) { contents.push({ type: "separator", margin: "sm" }); contents.push({ type: "text", text: "ราคาขาย:", size: "xs", color: "#888888", margin: "sm" }); }
    contents.push(...createPriceLine(propertyData.price ?? null, propertyData.original_price ?? null));
  }

  if (!hasRent && !hasSale) contents.push({ type: "text", text: "ติดต่อสอบถาม", weight: "bold", size: "lg", color: "#E53935" });

  return { type: "box", layout: "vertical", margin: "md", contents };
}
