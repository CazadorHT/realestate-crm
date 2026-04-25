 "use server";
import { requireAuthContext, authzFail } from "@/lib/authz";
import { LINE_MESSAGING_API, lineConfig } from "@/lib/line-config";
import { saveOmniMessage } from "@/lib/line";
import { revalidatePath } from "next/cache";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/meta";
import { OmniMessage } from "./types";
import { Database } from "@/lib/database.types";
import { decrypt } from "@/lib/crypto";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  messages?: OmniMessage[]; // Backward compatibility for existing UI
  hasMore?: boolean;
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

    if (leadError || !lead)
      throw new Error("ไม่พบข้อมูลลูกค้า หรือคุณไม่มีสิทธิ์เข้าถึง");

    // 2. Platform specific sending (Decrypt identifiers just-in-time for API calls)
    const lineId = decrypt(lead.line_id);
    const fbPsid = decrypt(lead.facebook_psid);
    const igSid = decrypt(lead.instagram_sid);
    const phone = decrypt(lead.phone);

    if (lead.source === "LINE" && lineId) {
      const res = await fetch(`${LINE_MESSAGING_API}/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineId,
          messages: [{ type: "text", text: content }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LINE API Error: ${errText}`);
      }
    } else if (
      lead.source === "FACEBOOK" &&
      (fbPsid || fbPsid === null)
    ) {
      const psid = fbPsid || "MOCK_PSID";
      const res = await sendMetaMessage(psid, content, "FACEBOOK");
      if (!res.success) throw new Error(`Facebook API Error: ${res.error}`);
    } else if (lead.source === "INSTAGRAM" && igSid) {
      const res = await sendMetaMessage(
        igSid,
        content,
        "INSTAGRAM",
      );
      if (!res.success) throw new Error(`Instagram API Error: ${res.error}`);
    } else if (lead.source === "WHATSAPP" && phone) {
      const res = await sendWhatsAppMessage(phone, content);
      if (!res.success) throw new Error(`WhatsApp API Error: ${res.error}`);
    }

    // 3. Log to omni_messages
    await saveOmniMessage({
      lead_id: leadId,
      source: lead.source as Database["public"]["Enums"]["lead_source"],
      content,
      direction: "OUTGOING",
      payload: { system_push: true },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: unknown) {
    console.error("[sendDirectReplyAction] Error:", err);
    return { success: false, error: (err as Error).message };
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
      source: msg.source as Database["public"]["Enums"]["lead_source"],
      content,
      direction: "OUTGOING",
      payload: { comment_reply: true, parent_id: msg.external_message_id },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: unknown) {
    console.error("[replyToCommentAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function getLeadMessagesAction(
  leadId: string,
  offset: number = 0,
  limit: number = 20,
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

    // 2. Fetch messages ordered by newest first for better performance & visibility
    // 🛡️ [PHASE 1] Use Security Definer RPC for complex cross-tenant message fetching
    const { data, error } = await supabase.rpc("get_lead_messages", {
      p_lead_id: leadId,
      p_source: lead.source as string, // Cast since we already verified lead exists
      p_lead_created_at: lead.created_at,
      p_offset: offset,
      p_limit: limit + 1, // Fetch one extra to check hasMore
    });

    if (error) throw error;

    const messages = (data as OmniMessage[]) || [];
    const hasMore = messages.length > limit;

    // If we fetched one extra to check hasMore, remove it
    const finalMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      success: true,
      messages: finalMessages,
      data: finalMessages,
      hasMore,
    };
  } catch (err: unknown) {
    console.error("[getLeadMessagesAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

import { z } from "zod";

const CategorySchema = z.enum(["CUSTOMER", "AGENT", "OWNER"]);

export async function updateLeadCategoryAction(
  leadId: string,
  category: string,
): Promise<ActionResponse> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // 1. Validate category
    const validatedCategory = CategorySchema.parse(category);

    // 2. Get current preferences to merge
    const { data: lead } = await supabase
      .from("leads")
      .select("preferences")
      .eq("id", leadId)
      .eq("tenant_id", tenantId!)
      .single();

    if (!lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const newPreferences = {
      ...((lead.preferences as Record<string, unknown>) || {}),
      category: validatedCategory,
      category_updated_at: new Date().toISOString(),
    };

    // 3. Update
    const { error } = await supabase
      .from("leads")
      .update({ preferences: newPreferences })
      .eq("id", leadId)
      .eq("tenant_id", tenantId!);

    if (error) throw error;

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: unknown) {
    console.error("[updateLeadCategoryAction] Error:", err);
    return {
      success: false,
      error:
        err instanceof z.ZodError ? "Invalid category" : (err as Error).message,
    };
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
  } catch (err: unknown) {
    console.error("[markLeadMessagesAsReadAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}
