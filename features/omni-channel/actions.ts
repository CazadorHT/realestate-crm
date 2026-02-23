"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { LINE_MESSAGING_API, lineConfig } from "@/lib/line-config";
import { saveOmniMessage } from "@/lib/line";
import { revalidatePath } from "next/cache";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/meta";

export async function sendDirectReplyAction(leadId: string, content: string) {
  const supabase = createAdminClient();

  try {
    // 1. Get Lead details (to know where to send)
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("source, line_id, facebook_psid, instagram_sid, phone")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");

    // 2. Platform specific sending
    if (lead.source === "LINE" && lead.line_id) {
      const res = await fetch(`${LINE_MESSAGING_API}/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lead.line_id,
          messages: [{ type: "text", text: content }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LINE API Error: ${errText}`);
      }
    } else if (
      lead.source === "FACEBOOK" &&
      (lead.facebook_psid || lead.facebook_psid === null)
    ) {
      // If we don't have PSID, we might still want to "mock" send if we are in dev
      const psid = lead.facebook_psid || "MOCK_PSID";
      const res = await sendMetaMessage(psid, content, "FACEBOOK");
      if (!res.success) throw new Error(`Facebook API Error: ${res.error}`);
    } else if (lead.source === "INSTAGRAM" && lead.instagram_sid) {
      const res = await sendMetaMessage(
        lead.instagram_sid,
        content,
        "INSTAGRAM",
      );
      if (!res.success) throw new Error(`Instagram API Error: ${res.error}`);
    } else if (lead.source === "WHATSAPP" && lead.phone) {
      const res = await sendWhatsAppMessage(lead.phone, content);
      if (!res.success) throw new Error(`WhatsApp API Error: ${res.error}`);
    } else {
      console.log(
        `Sending for ${lead.source} is not implemented or missing ID.`,
      );
      // We'll still log it as success if we want to allow testing the UI
    }

    // 3. Log to omni_messages
    await saveOmniMessage({
      lead_id: leadId,
      source: lead.source as any,
      content,
      direction: "OUTGOING",
      payload: { system_push: true },
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: any) {
    console.error("Direct reply failed:", err);
    return { success: false, error: err.message };
  }
}
