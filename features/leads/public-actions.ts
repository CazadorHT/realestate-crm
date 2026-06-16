"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function subscribeToLineAction(
  lineId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    if (!lineId || !lineId.trim()) {
      return { success: false, message: "กรุณากรอก Line ID" };
    }

    const { encrypt, generateBlindIndex } = await import("@/lib/crypto");
    const trimmedLineId = lineId.trim();

    // 🛡️ [PHASE 1] Use Security Definer RPC for public lead capture
    const { data: leadId, error } = await supabase.rpc("submit_public_lead", {
      p_full_name: encrypt(`Line Contact: ${trimmedLineId}`) || "Unknown",
      p_full_name_hash: generateBlindIndex(`Line Contact: ${trimmedLineId}`),
      p_line_id: encrypt(trimmedLineId),
      p_line_id_hash: generateBlindIndex(trimmedLineId),
      p_source: "WEBSITE",
      p_note: "Subscribe via Footer Newsletter"
    });

    if (error) {
      console.error("Error creating line lead via RPC:", error);
      return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
    }

    revalidatePath("/protected/leads"); // Update CRM list

    // 🤖 Trigger AI Smart Match Infrastructure
    if (leadId) {
      const { inngest } = await import("@/lib/inngest/client");
      await inngest.send({
        name: "lead.created",
        data: { leadId }
      }).catch(e => console.warn("Inngest lead.created skip:", e.message));

      // 📢 Notify Admin via LINE & Telegram
      try {
        const { sendLineNotification } = await import("@/lib/line");
        const { sendAdminNotification } = await import("@/lib/telegram");

        const alertMsg = `🔔 ลูกค้าสมัครรับข่าวสารใหม่ทางเว็บไซต์!\n\nLINE ID: ${trimmedLineId}\nบันทึกข้อมูลเข้าระบบเรียบร้อยแล้ว`;
        await sendLineNotification(alertMsg).catch(e => console.warn("[Notify] Line skip:", e.message));

        const tgMsg = `🔔 <b>ลูกค้าสมัครรับข่าวสารใหม่ทางเว็บไซต์!</b>\n\n<b>LINE ID:</b> <code>${trimmedLineId}</code>`;
        await sendAdminNotification(tgMsg, { parseMode: "HTML" }).catch(e => console.warn("[Notify] Telegram skip:", e.message));
      } catch (notifyErr) {
        console.warn("[Notify] Failed to notify admin:", notifyErr);
      }
    }

    return { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Error in subscribeToLineAction:", error);
    return { success: false, message: "เกิดข้อผิดพลาดที่ไม่คาดคิด" };
  }
}
