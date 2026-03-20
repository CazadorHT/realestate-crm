"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext, authzFail } from "@/lib/authz";
import { LINE_MESSAGING_API, lineConfig } from "@/lib/line-config";
import { saveOmniMessage } from "@/lib/line";
import { revalidatePath } from "next/cache";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/meta";
import { mapDbError } from "@/lib/db-error";

export async function sendDirectReplyAction(leadId: string, content: string) {
  try {
    const { supabase: userSupabase, tenantId } = await requireAuthContext();
    const supabase = createAdminClient(); // We need admin to send via internal APIs if needed

    // 1. Get Lead details (to know where to send)
    // We use userSupabase to ensure they only see their own leads
    const { data: lead, error: leadError } = await userSupabase
      .from("leads")
      .select("source, line_id, facebook_psid, instagram_sid, phone")
      .eq("id", leadId)
      .eq("tenant_id", tenantId!)
      .single();

    if (leadError || !lead) throw new Error("Lead not found or no permission");

    // 2. Platform specific sending (Keep using admin for API calls if necessary)
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
    return authzFail(err);
  }
}

export async function replyToCommentAction(messageId: string, content: string) {
  try {
    const { supabase: userSupabase, tenantId } = await requireAuthContext();
    const supabase = createAdminClient();

    // 1. Get original comment details
    // Verify it belongs to the tenant's leads
    const { data: msg, error: msgError } = await userSupabase
      .from("omni_messages")
      .select("external_message_id, lead_id, source, leads!inner(tenant_id)")
      .eq("id", messageId)
      .eq("leads.tenant_id", tenantId!)
      .single();

    if (msgError || !msg || !msg.external_message_id || !msg.lead_id) {
      throw new Error("Original comment not found or missing required data");
    }

    // 2. Reply via Meta API
    const { replyToMetaComment } = await import("@/lib/meta");
    const res = await replyToMetaComment(msg.external_message_id, content);

    if (!res.success) throw new Error(res.error);

    // 3. Save to omni_messages
    await saveOmniMessage({
      lead_id: msg.lead_id,
      source: msg.source as any,
      content,
      direction: "OUTGOING",
      payload: { comment_reply: true, parent_id: msg.external_message_id },
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: any) {
    return authzFail(err);
  }
}
