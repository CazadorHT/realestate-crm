"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { generateText } from "@/lib/ai/gemini";
import { getDocumentSignedUrl } from "./actions";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { aiAnalysisSchema, ActionResponse, AIAnalysisResult } from "./schema";

/**
 * AI Document Analysis
 * Uses Gemini to summarize and detect risks in a document
 */
export async function analyzeDocumentAction(
  documentId: string,
): Promise<ActionResponse<AIAnalysisResult>> {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. Fetch document metadata
    const { data: doc, error: dError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (dError || !doc) throw new Error("ไม่พบเอกสารในระบบ");

    // Guard: File Size (Gemini 1.5 Flash handles large files, but for CRM we restrict to 10MB to avoid timeouts/costs)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (doc.size_bytes && doc.size_bytes > MAX_SIZE) {
      throw new Error(
        "ไฟล์มีขนาดใหญ่เกินกว่าที่ AI จะวิเคราะห์ได้ (จำกัด 10MB)",
      );
    }

    // Guard: Supported Mime Types (Ideally PDFs and Images)
    const supportedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (doc.mime_type && !supportedTypes.includes(doc.mime_type)) {
      // We still allow it but Gemini might struggle, so we just log or proceed with caution.
      // For now, let's just warn about binary files that aren't docs.
    }

    // 2. Get Signed URL (for AI to access)
    const signedUrl = await getDocumentSignedUrl(doc.storage_path);
    if (!signedUrl) throw new Error("ไม่สามารถเข้าถึงไฟล์เพื่อวิเคราะห์ได้");

    // 3. Prepare AI Prompt
    const prompt = `
คุณเป็นผู้เชี่ยวชาญด้านอสังหาริมทรัพย์และกฎหมายสัญญาในประเทศไทย
งานของคุณคือวิเคราะห์ไฟล์เอกสารนี้: ${doc.file_name} (URL: ${signedUrl})

กรุณาสรุปข้อมูลดังนี้ในรูปแบบ JSON:
1. summary: สรุปเนื้อหาสำคัญสั้นๆ 3-5 ประโยค เป็นภาษาไทย
2. risks: รายการจุดเสี่ยงหรือข้อควรระวังที่พบ (ถ้ามี) เป็น Array ของสตริง (ภาษาไทย)
3. key_dates: วันที่สำคัญที่พบในเอกสาร (เช่น วันเริ่มสัญญา, วันสิ้นสุด) เป็น Array ของอ็อบเจ็กต์ { date: string, description: string }
4. document_type_suggestion: แนะนำประเภทเอกสารที่ถูกต้อง (เลือกจาก: ID_CARD, PASSPORT, LEASE_CONTRACT, SALE_CONTRACT, TITLE_DEED, RESERVATION_DOCUMENT, OTHER)

ข้อกำหนด: 
- ตอบกลับเฉพาะ JSON เท่านั้น
- ถ้าไม่สามารถเข้าถึงไฟล์ผ่าน URL ได้ ให้ตอบสรุปตามชื่อไฟล์และข้อมูลเบื้องต้น
`;

    const aiRes = await generateText(prompt, "gemini-1.5-flash");

    // Robust JSON Cleaning: Extract only the content between the first { and last }
    let jsonStr = aiRes.text.trim();
    if (jsonStr.includes("{")) {
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    let rawJson;
    try {
      rawJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("AI JSON Parse Error. Raw text:", aiRes.text);
      throw new Error(
        "AI ตอบกลับผลลัพธ์ในรูปแบบที่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
      );
    }

    // 4. Validate and Sanitize with Zod (Hardening)
    const validatedAnalysis = aiAnalysisSchema.parse(rawJson);

    // 5. Return results for human verification (DO NOT save to DB yet)
    revalidatePath("/protected/documents");
    return { success: true, data: validatedAnalysis };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      message: mapDbError(error) || "เกิดข้อผิดพลาดในการวิเคราะห์ AI",
    };
  }
}
