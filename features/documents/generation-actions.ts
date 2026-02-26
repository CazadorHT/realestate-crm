"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
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

/**
 * Convert an image URL or Storage path to a Base64 Data URL.
 * Supports: Local paths (/images/...), Storage paths (slips/...), and full URLs.
 */
async function getImageBase64(imageUrl: string, supabase?: any): Promise<string> {
  if (!imageUrl) return "";

  try {
    // 1. If it's already a Data URL
    if (imageUrl.startsWith("data:")) return imageUrl;

    // 2. If it's a Supabase storage path (e.g. slips/ownerid/file.jpg)
    if (imageUrl.includes("/") && !imageUrl.startsWith("/") && !imageUrl.startsWith("http") && supabase) {
      const { data, error } = await supabase.storage.from("documents").download(imageUrl);
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
  additionalData: any = {},
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. Fetch Template
    const { data: template, error: tError } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (tError || !template) throw new Error("Template not found");

    // 2. Fetch Owner Data (Lead, Property, Deal)
    const lang = (additionalData.language as "th" | "en" | "cn") || "th";
    const translations = await getTranslations(lang);

    // Base64 process for config images (Logo, Signature, Stamp)
    // We convert them to Base64 so documents are self-contained and don't require public bucket access.
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

    let contextData: any = {
      date: {
        today: formatDate(new Date(), lang),
      },
      config: config,
      t: translations,
      lang: lang,
    };

    if (ownerType === "LEAD") {
      const { data: lead, error: lError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", ownerId)
        .single();
      if (lError || !lead) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      contextData.lead = localizeObject(lead, lang);
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", ownerId)
        .single();
      if (pError || !property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      contextData.property = localizeObject(property, lang);
    } else if (ownerType === "DEAL") {
      const { data: deal, error: dError } = await supabase
        .from("deals")
        .select("*, lead:leads(*), property:properties(*)")
        .eq("id", ownerId)
        .single();
      if (dError || !deal) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      contextData.deal = localizeObject(deal, lang);
      contextData.lead = localizeObject((deal as any)?.lead, lang);
      contextData.property = localizeObject((deal as any)?.property, lang);

      // Add formatted values based on deal type
      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        const price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;

        // Add amount in words
        contextData.deal.amount_in_words =
          lang === "th" ? amountToThaiWords(price) : amountToEnglishWords(price);

        // Ensure payment_period has a fallback (e.g. from transaction date)
        contextData.deal.payment_period =
          contextData.deal.payment_period ||
          formatDate(deal.transaction_date, lang);

        // Try to fetch rental contract if it exists for more details
        if (isRent) {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("*")
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
      // Since it's not in DB yet, fallback to empty string if not in additionalData
      contextData.deal.reservation_fee = contextData.deal.reservation_fee || "";
      contextData.deal.booking_amount = contextData.deal.booking_amount || "";
    }

    // Merge additional data
    contextData = { ...contextData, ...additionalData };

    // Final Image Processing (e.g. Slip) - Convert to Base64
    if (contextData.slip_url) {
      // If it's a URL, convert it. If it's a storage path, convert it.
      contextData.slip_url = await getImageBase64(contextData.slip_url, supabase);
    }

    // Fix: Ensure slip_url is available consistently across all owner types
    // and make sure many templates that use {{deal.slip_url}} have a fallback
    if (!contextData.deal) {
      contextData.deal = {};
    }
    
    if (contextData.slip_url) {
      contextData.deal.slip_url = contextData.slip_url;
    }

    // Apply Overrides
    if (contextData.client_name_override && contextData.lead) {
      contextData.lead.full_name = contextData.client_name_override;
    }
    if (contextData.client_email_override && contextData.lead) {
      contextData.lead.email = contextData.client_email_override;
    }
    if (contextData.client_line_override && contextData.lead) {
      contextData.lead.line_id = contextData.client_line_override;
    }

    // Ensure common fields are at top level context for easier template access
    contextData.payment_period = contextData.payment_period || contextData.deal?.payment_period || "";
    contextData.payment_method = contextData.payment_method || "Transfer";
    contextData.account_name = contextData.account_name || "";

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
    const storagePath = `generated/${ownerType}/${ownerId}/${storageFileName}`;

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

    // Convert string to UTF-8 Uint8Array
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(finalHtmlContent);

    // Upload generated HTML to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, uint8Array, {
        contentType: "text/html",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      throw new Error(
        `ไม่สามารถอัปโหลดไฟล์เอกสารไปยัง Storage ได้: ${uploadError.message === "Payload too large" ? "ไฟล์ใหญ่เกินไป" : "เซิร์ฟเวอร์ขัดข้อง"}`,
      );
    }

    // 5. Create Document Metadata
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: template.type,
      file_name: displayFileName,
      storage_path: storagePath,
      mime_type: "text/html",
      version: 1,
    });

    if (!docRes.success) {
      console.error("DB Record Error:", docRes.message);
      throw new Error("บันทึกข้อมูลลงฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    console.error("Document Generation Error:", error);
    const msg =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
    return { success: false, message: msg };
  }
}
