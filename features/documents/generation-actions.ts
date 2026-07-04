"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
import {
  replacePlaceholders,
  formatCurrency,
  formatDate,
  getTranslations,
  localizeObject,
  amountToThaiWords,
  amountToEnglishWords,
} from "./template-engine";
import { createDocumentRecordAction } from "./actions";
import { revalidatePath } from "next/cache";
import { siteConfig } from "@/lib/site-config";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { decrypt } from "@/lib/crypto";
// @ts-ignore
import Docxtemplater from "docxtemplater";
import { z } from "zod";
import { mapDbError } from "@/lib/db-error";

// Schema for document additional data (shared overrides)
const additionalDataSchema = z
  .object({
    language: z.enum(["th", "en", "cn", "ru"]).optional().default("th"),
    client_name_override: z.string().optional(),
    client_email_override: z.string().email().optional().or(z.literal("")),
    client_line_override: z.string().optional(),
    payment_period: z.string().optional(),
    payment_method: z.string().optional(),
    account_name: z.string().optional(),
    slip_url: z.string().optional(),
    reservation_fee: z.string().optional(),
    booking_amount: z.string().optional(),
    security_deposit: z.string().optional(),
    contract_due_date: z.string().optional(),
    client_passport: z.string().optional(),
    client_id_card: z.string().optional(),
    client_nationality: z.string().optional(),
  })
  .passthrough();

/**
 * Convert an image URL or Storage path to a Base64 Data URL.
 * Supports: Local paths (/images/...), Storage paths (slips/...), and full URLs.
 */
async function getImageBase64(
  imageUrl: string,
  supabase?: ReturnType<typeof createClient> extends Promise<infer T>
    ? T
    : never,
): Promise<string> {
  if (!imageUrl) return "";

  try {
    // 1. If it's already a Data URL
    if (imageUrl.startsWith("data:")) return imageUrl;

    // 2. If it's a Supabase storage path (e.g. slips/ownerid/file.jpg)
    if (
      imageUrl.includes("/") &&
      !imageUrl.startsWith("/") &&
      !imageUrl.startsWith("http") &&
      supabase
    ) {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(imageUrl);
      if (error || !data) {
        console.error("Storage download error:", error);
        return "";
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const mimeType = data.type || "image/jpeg";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    // 3. If it's a local filesystem path (e.g. /images/logo.svg)
    if (imageUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(imageUrl).toLowerCase().replace(".", "");
        const mimeType = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    // 4. If it's a full URL
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return imageUrl;
      const blob = await res.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      return `data:${blob.type};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error("getImageBase64 error:", err);
  }

  return imageUrl;
}

export async function generateDocumentFromTemplateAction(
  templateId: string,
  ownerId: string,
  ownerType: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT",
  additionalData: z.infer<typeof additionalDataSchema> = { language: "th" },
) {
  try {
    // Validate UUIDs
    if (!z.string().uuid().safeParse(templateId).success)
      throw new Error("ID เทมเพลตไม่ถูกต้อง");
    if (!z.string().uuid().safeParse(ownerId).success)
      throw new Error("ID ข้อมูลเจ้าของไม่ถูกต้อง");

    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    let ownerTenantId: string | null = null;

    // 1. Fetch Template
    const { data: template, error: tError } = await supabase
      .from("contract_templates")
      .select("id, name, type, content, is_active")
      .eq("id", templateId)
      .single();

    if (tError) throw new Error(mapDbError(tError));
    if (!template) throw new Error("ไม่พบข้อมูลเทมเพลต");

    // 2. Fetch Owner Data (Lead, Property, Deal)
    const validData = additionalDataSchema.parse(additionalData);
    const lang = (validData.language === "th" || validData.language === "en" || validData.language === "cn" || validData.language === "ru")
      ? validData.language
      : "th";
    const translations = await getTranslations(lang);

    // Base64 process for config images (Logo, Signature, Stamp)
    const config = { ...siteConfig };

    // Process config images in parallel
    const [logoB64, logoDarkB64, signatureB64, stampB64] = await Promise.all([
      getImageBase64(config.logo),
      getImageBase64(config.logoDark),
      getImageBase64(config.companySignature),
      getImageBase64(config.companyStamp),
    ]);

    config.logo = logoB64;
    config.logoDark = logoDarkB64;
    config.companySignature = signatureB64;
    config.companyStamp = stampB64;

    let contextData: Record<string, any> = {
      date: {
        today: formatDate(new Date(), lang),
      },
      config: config,
      t: translations,
      lang: lang,
    };

    if (ownerType === "LEAD") {
      const { data: leadData, error: lError } = await supabase
        .from("crm_leads_v3")
        .select(`
          id,
          tenant_id,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id
          )
        `)
        .eq("id", ownerId)
        .single();
      if (lError) throw new Error(mapDbError(lError));
      if (!leadData) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      ownerTenantId = leadData.tenant_id;
      const lead = {
        id: leadData.id,
        tenant_id: leadData.tenant_id,
        full_name: decrypt((leadData.identity as any)?.display_name) || "",
        email: decrypt((leadData.identity as any)?.email) || "",
        phone: decrypt((leadData.identity as any)?.phone) || "",
        line_id: (leadData.identity as any)?.line_id || ""
      };
      contextData.lead = localizeObject(lead, lang);
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select("id, title, title_en, title_cn, title_ru, price, original_price, rental_price, original_rental_price, tenant_id")
        .eq("id", ownerId)
        .single();
      if (pError) throw new Error(mapDbError(pError));
      if (!property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      ownerTenantId = property.tenant_id;
      contextData.property = localizeObject(property, lang);
    } else if (ownerType === "DEAL") {
      const { data: dealData, error: dError } = await supabase
        .from("crm_deals_v3")
        .select(`
          id,
          deal_type,
          transaction_date,
          tenant_id,
          lead:crm_leads_v3(
            id,
            identity:identities_v3!crm_leads_v3_identity_id_fkey(
              display_name,
              email,
              phone,
              line_id
            )
          ),
          property:properties!crm_deals_v3_property_id_fkey(
            id,
            title,
            title_en,
            title_cn,
            title_ru,
            price,
            rental_price
          )
        `)
        .eq("id", ownerId)
        .single();
      if (dError) throw new Error(mapDbError(dError));
      if (!dealData) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      ownerTenantId = dealData.tenant_id;

      const propRaw = dealData.property as any;

      const deal = {
        id: dealData.id,
        deal_type: dealData.deal_type,
        transaction_date: dealData.transaction_date,
        tenant_id: dealData.tenant_id,
        lead: dealData.lead ? {
          id: (dealData.lead as any).id,
          full_name: decrypt((dealData.lead as any).identity?.display_name) || "",
          email: decrypt((dealData.lead as any).identity?.email) || "",
          phone: decrypt((dealData.lead as any).identity?.phone) || "",
          line_id: (dealData.lead as any).identity?.line_id || ""
        } : null,
        property: propRaw ? {
          id: propRaw.id,
          title: propRaw.title || "",
          title_en: propRaw.title_en || propRaw.title || "",
          title_cn: propRaw.title_cn || propRaw.title || "",
          title_ru: propRaw.title_ru || propRaw.title || "",
          price: propRaw.price,
          rental_price: propRaw.rental_price,
          original_price: propRaw.price,
          original_rental_price: propRaw.rental_price
        } : null
      };

      contextData.deal = localizeObject(deal, lang);
      contextData.lead = localizeObject(deal.lead, lang);
      contextData.property = localizeObject(deal.property, lang);

      // Add formatted values based on deal type
      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        let price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        if (validData.booking_amount) {
          const overridePrice = parseFloat(validData.booking_amount.replace(/,/g, ""));
          if (!isNaN(overridePrice)) {
            price = overridePrice;
          }
        }

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;

        // Add amount in words
        contextData.deal.amount_in_words =
          lang === "th"
            ? amountToThaiWords(price)
            : amountToEnglishWords(price);

        // Ensure payment_period has a fallback (e.g. from transaction date)
        contextData.deal.payment_period =
          validData.payment_period || formatDate(deal.transaction_date, lang);

        // Try to fetch rental contract if it exists for more details
        if (isRent) {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("id, deposit_amount, advance_payment_amount, lease_term_months, start_date")
            .eq("deal_id", ownerId)
            .maybeSingle();

          if (contract) {
            contextData.contract = contract;
            contextData.deal.deposit_amount = formatCurrency(
              contract.deposit_amount,
            );
            contextData.deal.advance_payment_amount = formatCurrency(
              contract.advance_payment_amount,
            );
            contextData.deal.lease_term = contract.lease_term_months;
            contextData.deal.start_date = formatDate(contract.start_date, lang);
          }
        }
      }

      // Allow templates to use deal.reservation_fee or deal.booking_amount
      const rawResFee = validData.reservation_fee || "";
      const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;
      contextData.deal.reservation_fee = resFeeNum > 0 ? formatCurrency(resFeeNum) : "";
      contextData.deal.reservation_fee_words = resFeeNum > 0
        ? (lang === "th" ? amountToThaiWords(resFeeNum) : amountToEnglishWords(resFeeNum))
        : "";
      contextData.deal.booking_amount = validData.booking_amount || "";
      contextData.deal.contract_due_date = validData.contract_due_date || "";
      
      const rawSecDep = validData.security_deposit || "";
      const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;
      contextData.deal.security_deposit = secDepNum > 0 ? formatCurrency(secDepNum) : "";
      contextData.deal.security_deposit_words = secDepNum > 0
        ? (lang === "th" ? amountToThaiWords(secDepNum) : amountToEnglishWords(secDepNum))
        : "";
    } else if (ownerType === "RENTAL_CONTRACT") {
      const { data: contract, error: cError } = await supabase
        .from("rental_contracts")
        .select("id, tenant_id, contract_number, start_date, end_date, rent_price, deposit_amount")
        .eq("id", ownerId)
        .single();
      if (cError) throw new Error(mapDbError(cError));
      if (!contract) throw new Error("ไม่พบข้อมูลสัญญาเช่าที่ระบุ");
      ownerTenantId = contract.tenant_id;
      contextData.contract = localizeObject(contract, lang);
    }

    // Populate identity info if any nationality, passport or id card are provided
    if (contextData.lead) {
      let identityInfo = "";
      if (validData.client_id_card) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "เลขบัตรประชาชน" : "ID Card No."}:</span> <span>${validData.client_id_card}</span>`;
      }
      if (validData.client_passport) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "เลขที่พาสปอร์ต" : "Passport No."}:</span> <span>${validData.client_passport}</span>`;
      }
      if (validData.client_nationality) {
        identityInfo += `<br><span style="color: #666;">${lang === "th" ? "สัญชาติ" : "Nationality"}:</span> <span>${validData.client_nationality}</span>`;
      }
      contextData.lead.identity_info = identityInfo;
    }

    // Build financial_info_html block
    const rawResFee = validData.reservation_fee || "";
    const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;
    const formattedResFee = resFeeNum > 0 ? formatCurrency(resFeeNum) : "";
    const resFeeWords = resFeeNum > 0
      ? (lang === "th" ? amountToThaiWords(resFeeNum) : amountToEnglishWords(resFeeNum))
      : "";

    const rawSecDep = validData.security_deposit || "";
    const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;
    const formattedSecDep = secDepNum > 0 ? formatCurrency(secDepNum) : "";
    const secDepWords = secDepNum > 0
      ? (lang === "th" ? amountToThaiWords(secDepNum) : amountToEnglishWords(secDepNum))
      : "";

    let financial_info_html = "";
    const reservationLabel = translations.reservation_deposit || (lang === "th" ? "ได้รับเงินมัดจำการจองเป็นจำนวนเงิน" : "Reservation Deposit Amount");
    const securityLabel = lang === "th" ? "เงินประกันการเช่า / Security Deposit" : "Security Deposit";

    if (formattedSecDep) {
      financial_info_html = `
      <div style="display: flex; gap: 15px; margin-bottom: 15px; width: 100%;">
        <div style="flex: 1; text-align: center; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px;">
          <p style="font-size: 11px; margin: 0 0 5px 0; color: #4f46e5; font-weight: bold;">${reservationLabel}</p>
          <div style="font-size: 18px; font-weight: bold; color: #4338ca;">
            ${formattedResFee} THB
          </div>
          <div style="font-size: 10px; font-style: italic; color: #666; margin-top: 3px;">( ${resFeeWords} )</div>
        </div>
        
        <div style="flex: 1; text-align: center; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px;">
          <p style="font-size: 11px; margin: 0 0 5px 0; color: #16a34a; font-weight: bold;">${securityLabel}</p>
          <div style="font-size: 18px; font-weight: bold; color: #15803d;">
            ${formattedSecDep} THB
          </div>
          <div style="font-size: 10px; font-style: italic; color: #666; margin-top: 3px;">( ${secDepWords} )</div>
        </div>
      </div>
      `;
    } else {
      financial_info_html = `
      <div style="text-align: center; margin-bottom: 15px; width: 100%;">
        <p style="font-size: 13px; margin-bottom: 5px;">${reservationLabel}:</p>
        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px; font-size: 20px; font-weight: bold; color: #4338ca;">
          ${formattedResFee} THB
        </div>
        <div style="font-size: 11px; font-style: italic; color: #666; margin-top: 3px;">( ${resFeeWords} )</div>
      </div>
      `;
    }
    contextData.financial_info_html = financial_info_html;

    // Merge additional data (properly sanitized by Zod)
    contextData = { ...contextData, ...validData };

    // Final Image Processing (e.g. Slip) - Convert to Base64
    if (contextData.slip_url) {
      contextData.slip_url = await getImageBase64(
        contextData.slip_url,
        supabase,
      );
    }

    // Fix: Ensure slip_url is available consistently across all owner types
    if (!contextData.deal) contextData.deal = {};
    if (contextData.slip_url) contextData.deal.slip_url = contextData.slip_url;

    if (contextData.property && contextData.property.id) {
      const fullId = contextData.property.id;
      const shortId = fullId.includes("-") ? fullId.split("-")[0] : fullId;
      contextData.property.id = shortId;
      contextData.property.property_code = `RES-${shortId}`;
      contextData.property.short_id = shortId;
    }

    // Apply Overrides
    if (validData.client_name_override && contextData.lead) {
      contextData.lead.full_name = validData.client_name_override;
    }
    if (validData.client_email_override && contextData.lead) {
      contextData.lead.email = validData.client_email_override;
    }
    if (validData.client_line_override && contextData.lead) {
      contextData.lead.line_id = validData.client_line_override;
    }

    contextData.payment_period =
      validData.payment_period || contextData.deal?.payment_period || "";
    contextData.payment_method = validData.payment_method || "Transfer";
    contextData.account_name = validData.account_name || "";
    contextData.bank_account_name = validData.account_name || "";

    if (contextData.lead) {
      if (validData.client_passport) contextData.lead.passport = validData.client_passport;
      if (validData.client_id_card) contextData.lead.id_card = validData.client_id_card;
      if (validData.client_nationality) contextData.lead.nationality = validData.client_nationality;
    }
    contextData.client_passport = validData.client_passport || "";
    contextData.client_id_card = validData.client_id_card || "";
    contextData.client_nationality = validData.client_nationality || "";

    // Add translation terms directly to context for convenience
    contextData.terms_deposit = lang === "th"
      ? "เงินจองนี้ถือเป็นส่วนหนึ่งของค่าทำสัญญา"
      : "Reservation deposit part of contract fee.";
    contextData.terms_sign_by = lang === "th"
      ? "ผู้จองตกลงจะเข้าทำสัญญาภายใน"
      : "Sign contract by:";
    contextData.terms_payment_transfer = lang === "th"
      ? "วิธีชำระเงินที่ระบุ: Transfer (โปรดเก็บหลักฐานการโอนเงิน)"
      : "Payment Method: Transfer (Please keep the transfer slip)";

    // Check for critical missing data
    if (ownerType === "DEAL" && (!contextData.lead || !contextData.property)) {
      throw new Error("ข้อมูลดีลไม่สมบูรณ์ (ขาดข้อมูลลูกค้าหรือทรัพย์สิน)");
    }

    // 3. Replace Placeholders
    if (!template.content || template.content.trim() === "") {
      throw new Error("ต้นแบบสัญญาไม่มีเนื้อหา (Template content is empty)");
    }
    const generatedContent = replacePlaceholders(template.content, contextData);

    // 4. Save as Document Record
    const timestamp = new Date().getTime();
    const safeTemplateName = template.name.replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    const displayFileName = `${safeTemplateName}_${timestamp}.html`;

    // Use an ASCII-safe string for Supabase storage key to avoid "Invalid key" errors
    const storageFileName = `generated_${template.type.toLowerCase()}_${timestamp}.html`;
    const finalTenantId = ownerTenantId || tenantId;
    const storagePath =
      finalTenantId && finalTenantId !== "ALL"
        ? `${finalTenantId}/generated/${ownerType}/${ownerId}/${storageFileName}`
        : `generated/${ownerType}/${ownerId}/${storageFileName}`;

    // Add UTF-8 meta tag and print styles for A4
    const finalHtmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
  
  :root {
    --primary-color: #0c4a6e;
    --border-color: #e2e8f0;
  }

  * { box-sizing: border-box; }

  body { 
    font-family: 'Sarabun', sans-serif; 
    line-height: 1.4; 
    color: #1e293b; 
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    background-color: #f1f5f9;
  }

  /* A4 Page Setup - Automatic Scaling */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm;
    margin: 10mm auto;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media print {
    body { background: none; margin: 0; padding: 0; }
    .page {
      margin: 0;
      box-shadow: none;
      width: 210mm;
      height: 297mm;
      padding: 10mm;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .no-print { display: none; }
  }

  h1, h2, h3 { color: var(--primary-color); text-align: center; margin: 0 0 10px 0; }
  
  /* Ensure images fit within the page */
  img { max-width: 100%; height: auto; }

  .slip-container {
    text-align: center;
    margin: 10px 0;
    page-break-inside: avoid;
    flex-grow: 0;
    flex-shrink: 1;
    min-height: 0;
  }
  
  .slip-image {
    max-height: 80mm; /* Reduced size to fit better with text */
    max-width: 100mm;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 2px;
    object-fit: contain;
  }

  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
  th, td { border: 1px solid var(--border-color); padding: 6px 10px; text-align: left; }
  th { background-color: #f8fafc; font-weight: bold; }
  
  /* Helper for "auto" text scaling if it's too much content */
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="content-wrapper">
      ${generatedContent}
    </div>
  </div>
</body>
</html>
    `.trim();

    // Upload generated HTML to storage
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(finalHtmlContent);

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, uint8Array, {
        contentType: "text/html",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError)
      throw new Error(`ไม่สามารถอัปโหลดไฟล์ได้: ${mapDbError(uploadError)} `);

    // 5. Create Document Metadata
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: template.type as any,
      file_name: displayFileName,
      storage_path: storagePath,
      mime_type: "text/html",
      size_bytes: uint8Array.byteLength,
      version: 1,
      tenant_id: ownerTenantId,
    });

    if (!docRes.success)
      throw new Error(docRes.message || "บันทึกข้อมูลเข้าฐานข้อมูลไม่สำเร็จ");

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return {
        success: false,
        message: "ข้อมูลนำเข้าไม่ถูกต้อง: " + error.issues[0].message,
      };
    console.error("Document Generation Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการสร้างเอกสาร",
    };
  }
}

export async function generateDocxDocumentFromTemplateAction(
  ownerId: string,
  ownerType: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT",
  docxStoragePath: string,
  additionalData: z.infer<typeof additionalDataSchema> = { language: "th" },
  options?: { templateName?: string },
) {
  try {
    // Validate Input
    if (!z.string().uuid().safeParse(ownerId).success)
      throw new Error("ID ข้อมูลเจ้าของไม่ถูกต้อง");
    const validData = additionalDataSchema.parse(additionalData);

    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    let ownerTenantId: string | null = null;

    // 1. Fetch the DOCX template from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(docxStoragePath);

    if (fileError)
      throw new Error(`ไม่สามารถโหลดเทมเพลตได้: ${mapDbError(fileError)}`);
    if (!fileData) throw new Error("ไม่พบไฟล์เทมเพลต");

    const templateBuffer = Buffer.from(await fileData.arrayBuffer());

    // 2. Prepare Context (similar to generateDocumentFromTemplateAction)
    const lang = (validData.language === "th" || validData.language === "en" || validData.language === "cn" || validData.language === "ru")
      ? validData.language
      : "th";
    const translations = await getTranslations(lang);

    let contextData: Record<string, any> = {
      date: { today: formatDate(new Date(), lang) },
      config: siteConfig,
      t: translations,
      lang: lang,
    };

    if (ownerType === "LEAD") {
      const { data: leadData, error: lError } = await supabase
        .from("crm_leads_v3")
        .select(`
          id,
          tenant_id,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id
          )
        `)
        .eq("id", ownerId)
        .single();
      if (lError) throw new Error(mapDbError(lError));
      if (!leadData) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      ownerTenantId = leadData.tenant_id;
      const lead = {
        id: leadData.id,
        tenant_id: leadData.tenant_id,
        full_name: decrypt((leadData.identity as any)?.display_name) || "",
        email: decrypt((leadData.identity as any)?.email) || "",
        phone: decrypt((leadData.identity as any)?.phone) || "",
        line_id: (leadData.identity as any)?.line_id || ""
      };
      contextData.lead = localizeObject(lead, lang);
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select("id, title, title_en, title_cn, title_ru, price, original_price, rental_price, original_rental_price, tenant_id")
        .eq("id", ownerId)
        .single();
      if (pError) throw new Error(mapDbError(pError));
      if (!property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      ownerTenantId = property.tenant_id;
      contextData.property = localizeObject(property, lang);
    } else if (ownerType === "DEAL") {
      const { data: dealData, error: dError } = await supabase
        .from("crm_deals_v3")
        .select(`
          id,
          deal_type,
          transaction_date,
          tenant_id,
          lead:crm_leads_v3(
            id,
            identity:identities_v3!crm_leads_v3_identity_id_fkey(
              display_name,
              email,
              phone,
              line_id
            )
          ),
          property:properties!crm_deals_v3_property_id_fkey(
            id,
            title,
            title_en,
            title_cn,
            title_ru,
            price,
            rental_price
          )
        `)
        .eq("id", ownerId)
        .single();
      if (dError) throw new Error(mapDbError(dError));
      if (!dealData) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      ownerTenantId = dealData.tenant_id;

      const propRaw = dealData.property as any;

      const deal = {
        id: dealData.id,
        deal_type: dealData.deal_type,
        transaction_date: dealData.transaction_date,
        tenant_id: dealData.tenant_id,
        lead: dealData.lead ? {
          id: (dealData.lead as any).id,
          full_name: decrypt((dealData.lead as any).identity?.display_name) || "",
          email: decrypt((dealData.lead as any).identity?.email) || "",
          phone: decrypt((dealData.lead as any).identity?.phone) || "",
          line_id: (dealData.lead as any).identity?.line_id || ""
        } : null,
        property: propRaw ? {
          id: propRaw.id,
          title: propRaw.title || "",
          title_en: propRaw.title_en || propRaw.title || "",
          title_cn: propRaw.title_cn || propRaw.title || "",
          title_ru: propRaw.title_ru || propRaw.title || "",
          price: propRaw.price,
          rental_price: propRaw.rental_price,
          original_price: propRaw.price,
          original_rental_price: propRaw.rental_price
        } : null
      };

      contextData.deal = localizeObject(deal, lang);
      contextData.lead = localizeObject(deal.lead, lang);
      contextData.property = localizeObject(deal.property, lang);

      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        let price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        if (validData.booking_amount) {
          const overridePrice = parseFloat(validData.booking_amount.replace(/,/g, ""));
          if (!isNaN(overridePrice)) {
            price = overridePrice;
          }
        }

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;
        contextData.deal.amount_in_words =
          lang === "th"
            ? amountToThaiWords(price)
            : amountToEnglishWords(price);
        contextData.deal.payment_period =
          validData.payment_period || formatDate(deal.transaction_date, lang);

        if (isRent) {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("id, deposit_amount, advance_payment_amount, lease_term_months, start_date")
            .eq("deal_id", ownerId)
            .maybeSingle();
          if (contract) {
            contextData.contract = contract;
            contextData.deal.deposit_amount = formatCurrency(
              contract.deposit_amount,
            );
            contextData.deal.advance_payment_amount = formatCurrency(
              contract.advance_payment_amount,
            );
            contextData.deal.lease_term = contract.lease_term_months;
            contextData.deal.start_date = formatDate(contract.start_date, lang);
          }
        }
      }
      
      const rawResFee = validData.reservation_fee || "";
      const resFeeNum = parseFloat(rawResFee.replace(/,/g, "")) || 0;
      contextData.deal.reservation_fee = resFeeNum > 0 ? formatCurrency(resFeeNum) : "";
      contextData.deal.reservation_fee_words = resFeeNum > 0
        ? (lang === "th" ? amountToThaiWords(resFeeNum) : amountToEnglishWords(resFeeNum))
        : "";
      contextData.deal.booking_amount = validData.booking_amount || "";
      contextData.deal.contract_due_date = validData.contract_due_date || "";
      
      const rawSecDep = validData.security_deposit || "";
      const secDepNum = parseFloat(rawSecDep.replace(/,/g, "")) || 0;
      contextData.deal.security_deposit = secDepNum > 0 ? formatCurrency(secDepNum) : "";
      contextData.deal.security_deposit_words = secDepNum > 0
        ? (lang === "th" ? amountToThaiWords(secDepNum) : amountToEnglishWords(secDepNum))
        : "";
    } else if (ownerType === "RENTAL_CONTRACT") {
      const { data: contract, error: cError } = await supabase
        .from("rental_contracts")
        .select("id, tenant_id, contract_number, start_date, end_date, rent_price, deposit_amount")
        .eq("id", ownerId)
        .single();
      if (cError) throw new Error(mapDbError(cError));
      if (!contract) throw new Error("ไม่พบข้อมูลสัญญาเช่าที่ระบุ");
      ownerTenantId = contract.tenant_id;
      contextData.contract = localizeObject(contract, lang);
    }

    // Merge additional data (properly sanitized)
    contextData = { ...contextData, ...validData };

    if (contextData.property && contextData.property.id) {
      const fullId = contextData.property.id;
      const shortId = fullId.includes("-") ? fullId.split("-")[0] : fullId;
      contextData.property.id = shortId;
      contextData.property.property_code = `RES-${shortId}`;
      contextData.property.short_id = shortId;
    }

    if (validData.client_name_override && contextData.lead) {
      contextData.lead.full_name = validData.client_name_override;
    }
    if (validData.client_email_override && contextData.lead) {
      contextData.lead.email = validData.client_email_override;
    }
    if (validData.client_line_override && contextData.lead) {
      contextData.lead.line_id = validData.client_line_override;
    }

    contextData.payment_period =
      validData.payment_period || contextData.deal?.payment_period || "";
    contextData.payment_method = validData.payment_method || "Transfer";
    contextData.account_name = validData.account_name || "";
    contextData.bank_account_name = validData.account_name || "";

    if (contextData.lead) {
      if (validData.client_passport) contextData.lead.passport = validData.client_passport;
      if (validData.client_id_card) contextData.lead.id_card = validData.client_id_card;
      if (validData.client_nationality) contextData.lead.nationality = validData.client_nationality;
    }
    contextData.client_passport = validData.client_passport || "";
    contextData.client_id_card = validData.client_id_card || "";
    contextData.client_nationality = validData.client_nationality || "";

    // Add translation terms directly to context for convenience
    contextData.terms_deposit = lang === "th"
      ? "เงินจองนี้ถือเป็นส่วนหนึ่งของค่าทำสัญญา"
      : "Reservation deposit part of contract fee.";
    contextData.terms_sign_by = lang === "th"
      ? "ผู้จองตกลงจะเข้าทำสัญญาภายใน"
      : "Sign contract by:";
    contextData.terms_payment_transfer = lang === "th"
      ? "วิธีชำระเงินที่ระบุ: Transfer (โปรดเก็บหลักฐานการโอนเงิน)"
      : "Payment Method: Transfer (Please keep the transfer slip)";

    // 3. Process the DOCX with docxtemplater
    let zip;
    try {
      zip = new PizZip(templateBuffer);
    } catch (e) {
      throw new Error("ไฟล์ DOCX ไม่ถูกต้อง หรืออาจจะเสียหาย");
    }

    let doc;
    try {
      doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(contextData);
    } catch (error: unknown) {
      console.error("Docxtemplater parsing error:", error);
      let errorMsg = "รูปแบบตัวแปร(Tag) ในไฟล์ DOCX ไม่ถูกต้อง";
      const err = error as {
        properties?: {
          errors?: {
            properties?: { explanation?: string };
            message?: string;
          }[];
        };
      };
      if (err.properties && err.properties.errors instanceof Array) {
        const errorDetails = err.properties.errors
          .map((e) => e.properties?.explanation || e.message)
          .join(", ");
        errorMsg += ` รายละเอียด: ${errorDetails}`;
      }
      throw new Error(errorMsg);
    }

    const buf = doc
      .getZip()
      .generate({ type: "nodebuffer", compression: "DEFLATE" });

    // 4. Save to Storage
    const timestamp = new Date().getTime();
    const safeTemplateName = (
      options?.templateName || "custom_contract"
    ).replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    const displayFileName = `${safeTemplateName}_${timestamp}.docx`;
    const storageFileName = `generated_${timestamp}.docx`;
    const finalTenantId = ownerTenantId || tenantId;
    const finalStoragePath =
      finalTenantId && finalTenantId !== "ALL"
        ? `${finalTenantId}/generated/${ownerType}/${ownerId}/${storageFileName}`
        : `generated/${ownerType}/${ownerId}/${storageFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(finalStoragePath, buf, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError)
      throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${mapDbError(uploadError)}`);

    // 5. Create DB Record
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: "OTHER",
      file_name: displayFileName,
      storage_path: finalStoragePath,
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size_bytes: buf.length,
      version: 1,
      tenant_id: ownerTenantId,
    });

    if (!docRes.success)
      throw new Error(docRes.message || "บันทึกข้อมูลเข้าฐานข้อมูลไม่สำเร็จ");

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return {
        success: false,
        message: "ข้อมูลนำเข้าไม่ถูกต้อง: " + error.issues[0].message,
      };
    console.error("DOCX Generation Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX",
    };
  }
}

export async function getDealDetailsAction(dealId: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { data: dealData, error: dError } = await supabase
      .from("crm_deals_v3")
      .select(`
        id,
        deal_type,
        transaction_date,
        lead:crm_leads_v3(
          id,
          identity:identities_v3!crm_leads_v3_identity_id_fkey(
            display_name,
            email,
            phone,
            line_id
          )
        )
      `)
      .eq("id", dealId)
      .single();

    if (dError) throw new Error(dError.message);
    if (!dealData) throw new Error("Deal not found");

    const leadRaw = dealData.lead as any;
    const identityRaw = leadRaw?.identity;

    return {
      success: true,
      data: {
        id: dealData.id,
        deal_type: dealData.deal_type,
        lead: leadRaw ? {
          id: leadRaw.id,
          full_name: decrypt(identityRaw?.display_name) || "",
          email: decrypt(identityRaw?.email) || "",
          phone: decrypt(identityRaw?.phone) || "",
          line_id: identityRaw?.line_id || ""
        } : null
      }
    };
  } catch (error) {
    console.error("Error fetching deal details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

