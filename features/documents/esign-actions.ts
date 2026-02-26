"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getESignService, ESignStatus } from "./esign-service";
import { getDocumentSignedUrl } from "./actions";
import { revalidatePath } from "next/cache";

/**
 * Initiate e-Signature for a document
 */
export async function initiateESignAction(documentId: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. Fetch document and owner info
    const { data: doc, error: dError } = await supabase
      .from("documents")
      .select("*, lead:leads(*)")
      .eq("id", documentId)
      .single();

    if (dError || !doc) throw new Error("ไม่พบเอกสารที่ระบุ");

    // Check if already signed
    if (doc.esign_status === "SIGNED") {
      throw new Error(
        "เอกสารนี้ได้รับการลงนามเรียบร้อยแล้ว ไม่สามารถส่งซ้ำได้",
      );
    }

    // Check if already sent and waiting
    if (doc.esign_status === "SENT") {
      // Allow resending if needed? Usually we should sync first.
      // For now, let's just warn or allow it to overwrite if the user really wants.
      // But a safer bridge is to sync status first.
    }

    // We only support e-signature for LEAD owner types for now
    const recipientEmail = (doc.lead as any)?.email;
    const recipientName = (doc.lead as any)?.full_name || "Recipient";

    if (!recipientEmail) {
      throw new Error(
        `ลีด "${recipientName}" ไม่มีอีเมลสำหรับส่งสัญญาเซ็นออนไลน์ กรุณาเพิ่มอีเมลที่ข้อมูลลีดก่อน`,
      );
    }

    // Email format validation simple check
    if (!recipientEmail.includes("@")) {
      throw new Error("อีเมลของลีดไม่ถูกต้อง (Invalid Email Format)");
    }

    // 2. Get Signed URL for the document (to pass to Adobe Sign)
    const documentUrl = await getDocumentSignedUrl(doc.storage_path);
    if (!documentUrl) throw new Error("ไม่สามารถสร้างลิงก์สำหรับส่งเอกสารได้");

    // 3. Call e-Signature Service
    const esignService = getESignService();
    const result = await esignService.createEnvelope({
      documentUrl,
      recipientEmail,
      recipientName,
      subject: `สัญญา ${doc.file_name}`,
      message: "กรุณาตรวจสอบและลงนามในสัญญาอิเล็กทรอนิกส์นี้",
    });

    // 4. Update Document Record
    const { error: uError } = await supabase
      .from("documents")
      .update({
        esign_status: result.status,
        esign_provider: process.env.ESIGN_PROVIDER || "MOCK",
        esign_envelope_id: result.envelopeId,
      })
      .eq("id", documentId);

    if (uError)
      throw new Error(
        "บันทึกข้อมูล e-Sign ลงฐานข้อมูลไม่สำเร็จ: " + uError.message,
      );

    revalidatePath("/protected/documents");
    return { success: true, status: result.status };
  } catch (error: unknown) {
    console.error("Initiate ESign Error:", error);
    const msg =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งสัญญา";
    return { success: false, message: msg };
  }
}

/**
 * Sync status from e-Signature provider
 */
export async function syncESignStatusAction(documentId: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const { data: doc, error: dError } = await supabase
      .from("documents")
      .select("esign_envelope_id, esign_status")
      .eq("id", documentId)
      .single();

    if (dError || !doc || !doc.esign_envelope_id) {
      throw new Error("ไม่มีข้อมูลการส่งเซ็นสำหรับเอกสารนี้");
    }

    const esignService = getESignService();
    const newStatus = await esignService.getEnvelopeStatus(
      doc.esign_envelope_id,
    );

    if (newStatus !== doc.esign_status) {
      const { error: uError } = await supabase
        .from("documents")
        .update({
          esign_status: newStatus,
          esign_signed_at:
            newStatus === "SIGNED" ? new Date().toISOString() : null,
        })
        .eq("id", documentId);

      if (uError) throw new Error(uError.message);
    }

    revalidatePath("/protected/documents");
    return { success: true, status: newStatus };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sync error";
    return { success: false, message: msg };
  }
}
