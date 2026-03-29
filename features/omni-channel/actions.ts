"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext, authzFail } from "@/lib/authz";
import { LINE_MESSAGING_API, lineConfig } from "@/lib/line-config";
import { saveOmniMessage } from "@/lib/line";
import { revalidatePath } from "next/cache";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/meta";
import { OmniMessage } from "./types";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  messages?: OmniMessage[]; // Backward compatibility for existing UI
};

export async function sendDirectReplyAction(
  leadId: string,
  content: string,
): Promise<ActionResponse> {
  try {
    const { supabase: userSupabase, tenantId } = await requireAuthContext();

    // 1. Get Lead details
    const { data: lead, error: leadError } = await userSupabase
      .from("leads")
      .select("source, line_id, facebook_psid, instagram_sid, phone")
      .eq("id", leadId)
      .eq("tenant_id", tenantId!)
      .single();

    if (leadError || !lead) throw new Error("ไม่พบข้อมูลลูกค้า หรือคุณไม่มีสิทธิ์เข้าถึง");

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
    } else if (lead.source === "FACEBOOK" && (lead.facebook_psid || lead.facebook_psid === null)) {
      const psid = lead.facebook_psid || "MOCK_PSID";
      const res = await sendMetaMessage(psid, content, "FACEBOOK");
      if (!res.success) throw new Error(`Facebook API Error: ${res.error}`);
    } else if (lead.source === "INSTAGRAM" && lead.instagram_sid) {
      const res = await sendMetaMessage(lead.instagram_sid, content, "INSTAGRAM");
      if (!res.success) throw new Error(`Instagram API Error: ${res.error}`);
    } else if (lead.source === "WHATSAPP" && lead.phone) {
      const res = await sendWhatsAppMessage(lead.phone, content);
      if (!res.success) throw new Error(`WhatsApp API Error: ${res.error}`);
    }

    // 3. Log to omni_messages
    await saveOmniMessage({
      lead_id: leadId,
      source: lead.source as any,
      content,
      direction: "OUTGOING",
      payload: { system_push: true },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: any) {
    console.error("[sendDirectReplyAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function replyToCommentAction(
  messageId: string,
  content: string,
): Promise<ActionResponse> {
  try {
    const { supabase: userSupabase, tenantId } = await requireAuthContext();

    // 1. Get original comment details
    const { data: msg, error: msgError } = await userSupabase
      .from("omni_messages")
      .select("external_message_id, lead_id, source, leads!inner(tenant_id)")
      .eq("id", messageId)
      .eq("leads.tenant_id", tenantId!)
      .single();

    if (msgError || !msg || !msg.external_message_id || !msg.lead_id) {
      throw new Error("ไม่พบข้อความต้นฉบับ หรือข้อมูลไม่ครบถ้วน");
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
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: any) {
    console.error("[replyToCommentAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getLeadMessagesAction(
  leadId: string,
): Promise<ActionResponse<OmniMessage[]>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // 1. Get lead info to filter global messages
    const { data: lead } = await supabase
      .from("leads")
      .select("created_at, source")
      .eq("id", leadId)
      .single();

    if (!lead) throw new Error("ไม่พบข้อมูลลูกค้า");

    // 2. Fetch both specific and global messages
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("omni_messages")
      .select("*")
      .or(`lead_id.eq.${leadId},and(lead_id.is.null,source.eq.${lead.source},created_at.gte.${lead.created_at})`)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { 
      success: true, 
      messages: data as OmniMessage[],
      data: data as OmniMessage[] 
    };
  } catch (err: any) {
    console.error("[getLeadMessagesAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function markLeadMessagesAsReadAction(
  leadId: string,
): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAuthContext();

    const { error } = await supabase
      .from("omni_messages")
      .update({ is_read: true })
      .eq("lead_id", leadId)
      .eq("direction", "INCOMING")
      .eq("is_read", false);

    if (error) throw error;

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: any) {
    console.error("[markLeadMessagesAsReadAction] Error:", err);
    return { success: false, error: err.message };
  }
}
