"use server";

import { createClient } from "@/lib/supabase/server";
import { getAiModelConfig } from "@/features/ai-settings/actions";
import { generateText } from "@/lib/ai/gemini";
import { decrypt } from "@/lib/crypto";
import { logAiUsage } from "@/features/ai-monitor/actions";
import { requireAuthContext } from "@/lib/authz";

export interface FollowUpScriptResponse {
  success: boolean;
  script?: string;
  message?: string;
}

export async function generateFollowUpScriptAction(
  leadId: string,
  context: "STALE_LEAD" | "EXPIRING_CONTRACT"
): Promise<FollowUpScriptResponse> {
  try {
    const { supabase, user } = await requireAuthContext();
    if (!user) return { success: false, message: "Unauthorized" };

    const aiConfig = await getAiModelConfig();
    const modelName = aiConfig.lead_model;

    // Fetch Lead Data
    const { data: lead, error: leadError } = await supabase
      .from("crm_leads_v3")
      .select("stage, ai_summary, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name)")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, message: "Lead not found" };
    }

    const ident = lead.identity as { display_name?: string } | null;
    const leadName = ident?.display_name || "ลูกค้า";
    const leadNotes = lead.ai_summary || "ไม่มีข้อมูลเพิ่มเติม";

    const systemInstruction = `
      คุณเป็น "Professional Real Estate Agent Assistant" ที่เชี่ยวชาญการเขียนข้อความติดตามลูกค้าแบบเป็นกันเองแต่มีความเป็นมืออาชีพ (Polite, Professional, Helpful)
      เป้าหมายของคุณคือการเขียนบทสนทนา (Script) เพื่อให้ Agent นำไปใช้ส่งต่อทาง Line หรือ WhatsApp เพื่อติดตามลูกค้าที่เงียบไป
      ภาษา: ไทย (และใส่คำทับศัพท์อสังหาฯ ที่เหมาะสม)
    `;

    const prompt = `
      ช่วยร่างข้อความติดตามลูกค้า (Follow-up Script) สำหรับสถานการณ์: ${context === "STALE_LEAD" ? "ลูกค้าไม่ได้ติดต่อมานานเกิน 3 วัน" : "สัญญาเช่ากำลังจะหมดอายุ"}
      
      ข้อมูลลูกค้า:
      - ชื่อ: ${leadName}
      - ขั้นตอนปัจจุบัน: ${lead.stage}
      - รายละเอียดเพิ่มเติม: ${leadNotes}

      คำแนะนำ:
      1. เขียนให้ดูเหมือน Agent เขียนเองจริงๆ ไม่ใช่ AI
      2. ใช้สรรพนามเรียกตัวเองว่า "ทางเรา" หรือ "ผม/ดิฉัน" (ให้เขียนกลางๆ ให้เลือกใช้ได้)
      3. ให้มี 2 ตัวเลือก: แบบเป็นทางการ (Formal) และ แบบเป็นกันเอง (Friendly)
      4. สรุปความต้องการลูกค้าสั้นๆ ในข้อความเพื่อให้ลูกค้ารู้ว่าเราจำรายละเอียดเขาได้
      5. จบด้วยคำถามปลายเปิดเพื่อกระตุ้นให้ลูกค้าตอบกลับ
      
      RESPONSE FORMAT:
      ไม่ต้องเกริ่นนำ ให้แสดงผลเป็นข้อความที่นำไปใช้ได้ทันที แบ่งเป็น 2 หัวข้อ: "แบบเป็นทางการ" และ "แบบเป็นกันเอง"
    `;

    const response = await generateText(prompt, modelName, 0, {
      systemInstruction,
      maxOutputTokens: 1000,
    });

    if (!response || !response.text) {
      throw new Error("AI returned empty response");
    }

    // Log Usage
    await logAiUsage({
      model: modelName,
      feature: "agent_followup_script",
      status: "success",
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
      userId: user.id,
    });

    return {
      success: true,
      script: response.text,
    };
  } catch (error: unknown) {
    console.error("generateFollowUpScriptAction error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเจนบทความ",
    };
  }
}
