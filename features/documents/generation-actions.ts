"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  replacePlaceholders,
  formatCurrency,
  formatDateThai,
} from "./template-engine";
import { createDocumentRecordAction } from "./actions";
import { revalidatePath } from "next/cache";

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
    let contextData: any = {
      date: {
        today: formatDateThai(new Date()),
      },
    };

    if (ownerType === "LEAD") {
      const { data: lead, error: lError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", ownerId)
        .single();
      if (lError || !lead) throw new Error("ไม่พบข้อมูลลีดที่ระบุ");
      contextData.lead = lead;
    } else if (ownerType === "PROPERTY") {
      const { data: property, error: pError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", ownerId)
        .single();
      if (pError || !property) throw new Error("ไม่พบข้อมูลทรัพย์สินที่ระบุ");
      contextData.property = property;
    } else if (ownerType === "DEAL") {
      const { data: deal, error: dError } = await supabase
        .from("deals")
        .select("*, lead:leads(*), property:properties(*)")
        .eq("id", ownerId)
        .single();
      if (dError || !deal) throw new Error("ไม่พบข้อมูลดีลที่ระบุ");
      contextData.deal = deal;
      contextData.lead = (deal as any)?.lead;
      contextData.property = (deal as any)?.property;

      // Add formatted values based on deal type
      if (deal && contextData.property) {
        const isRent = deal.deal_type === "RENT";
        const price = isRent
          ? contextData.property.rental_price
          : contextData.property.price;

        contextData.deal.formatted_price = formatCurrency(price);
        contextData.deal.price = price;

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
            contextData.deal.start_date = formatDateThai(contract.start_date);
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

    // Add UTF-8 meta tag and print styles
    const finalHtmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun&display=swap');
  body { 
    font-family: 'Sarabun', sans-serif; 
    line-height: 1.6; 
    color: #333; 
    max-width: 800px; 
    margin: 0 auto; 
    padding: 40px; 
  }
  h1 { text-align: center; }
  @media print {
    body { padding: 0; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>
${generatedContent}
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
