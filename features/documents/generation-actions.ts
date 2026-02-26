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

      // Add formatted values
      if (deal) {
        contextData.deal.formatted_price = formatCurrency(
          (deal as any).property?.price,
        );
      }
    }

    // Merge additional data
    contextData = { ...contextData, ...additionalData };

    // Check for critical missing data
    if (ownerType === "DEAL" && (!contextData.lead || !contextData.property)) {
      throw new Error("ข้อมูลดีลไม่สมบูรณ์ (ขาดข้อมูลลูกค้าหรือทรัพย์สิน)");
    }

    // 3. Replace Placeholders
    const generatedContent = replacePlaceholders(template.content, contextData);

    // 4. Save as Document Record
    const fileName = `${template.name}_${new Date().getTime()}.html`.replace(
      /\s+/g,
      "_",
    );
    const storagePath = `generated/${ownerType}/${ownerId}/${fileName}`;

    // Upload generated HTML to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, generatedContent, {
        contentType: "text/html",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError)
      throw new Error("ไม่สามารถอัปโหลดไฟล์เอกสารได้: " + uploadError.message);

    // 5. Create Document Metadata
    const docRes = await createDocumentRecordAction({
      owner_id: ownerId,
      owner_type: ownerType,
      document_type: template.type,
      file_name: fileName,
      storage_path: storagePath,
      mime_type: "text/html",
      version: 1,
    });

    if (!docRes.success)
      throw new Error(
        "บันทึกข้อมูลเอกสารลงฐานข้อมูลไม่สำเร็จ: " + docRes.message,
      );

    revalidatePath("/protected/documents");
    return { success: true, data: docRes.data };
  } catch (error: unknown) {
    console.error("Document Generation Error:", error);
    const msg =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
    return { success: false, message: msg };
  }
}
