 "use server";
import { requireAuthContext } from "@/lib/authz";
import { LINE_MESSAGING_API, lineConfig } from "@/lib/line-config";
import { saveOmniMessage } from "@/lib/line";
import { revalidatePath } from "next/cache";
import { sendMetaMessage, sendWhatsAppMessage } from "@/lib/meta";
import { OmniMessage } from "./types";
import { Database } from "@/lib/database.types";
import { Json } from "@/lib/database.types.generated";
import { decrypt } from "@/lib/crypto";
import { z } from "zod";

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

    // 1. Get Lead details directly from V3 Core crm_leads_v3 joined with identities_v3
    // Eliminate select(*) to save bandwidth and reduce payload size
    let query = userSupabase
      .from("crm_leads_v3")
      .select(`
        source,
        identity:identities_v3!crm_leads_v3_identity_id_fkey (
          line_id,
          phone,
          social_links
        )
      `)
      .eq("id", leadId);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: leadData, error: leadError } = await query.single();

    const identity = leadData?.identity as {
      line_id?: string | null;
      phone?: string | null;
      social_links?: Json | null;
    } | null;

    if (leadError || !leadData || !identity) {
      throw new Error("ไม่พบข้อมูลลูกค้า หรือคุณไม่มีสิทธิ์เข้าถึง");
    }

    const socialLinks = (identity.social_links as Record<string, unknown>) || {};
    const rawLineId = identity.line_id;
    const rawFbPsid = socialLinks.facebook_psid as string | undefined | null;
    const rawIgSid = socialLinks.instagram_sid as string | undefined | null;
    const rawPhone = identity.phone;

    // 2. Platform specific sending (Decrypt identifiers just-in-time for API calls)
    const lineId = rawLineId ? decrypt(rawLineId) : null;
    const fbPsid = rawFbPsid ? decrypt(rawFbPsid) : null;
    const igSid = rawIgSid ? decrypt(rawIgSid) : null;
    const phone = rawPhone ? decrypt(rawPhone) : null;

    if (leadData.source === "LINE" && lineId) {
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
      leadData.source === "FACEBOOK" &&
      (fbPsid || fbPsid === null)
    ) {
      const psid = fbPsid || "MOCK_PSID";
      const res = await sendMetaMessage(psid, content, "FACEBOOK");
      if (!res.success) throw new Error(`Facebook API Error: ${res.error}`);
    } else if (leadData.source === "INSTAGRAM" && igSid) {
      const res = await sendMetaMessage(igSid, content, "INSTAGRAM");
      if (!res.success) throw new Error(`Instagram API Error: ${res.error}`);
    } else if (leadData.source === "WHATSAPP" && phone) {
      const res = await sendWhatsAppMessage(phone, content);
      if (!res.success) throw new Error(`WhatsApp API Error: ${res.error}`);
    }

    // 3. Log to V3 Communications Hub via saveOmniMessage
    await saveOmniMessage({
      lead_id: leadId,
      source: (leadData.source || "OTHER") as Database["public"]["Enums"]["lead_source"],
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

    // 1. Get original comment details from V3 communications hub
    let msgQuery = userSupabase
      .from("communications_hub_v3")
      .select("external_message_id, identity_id, platform, tenant_id")
      .eq("id", messageId);

    if (tenantId) {
      msgQuery = msgQuery.eq("tenant_id", tenantId);
    }

    const { data: msg, error: msgError } = await msgQuery.single();

    if (msgError || !msg || !msg.external_message_id || !msg.identity_id) {
      throw new Error("ไม่พบข้อความต้นฉบับ หรือข้อมูลไม่ครบถ้วน");
    }

    // Find active lead_id for this identity
    let leadQuery = userSupabase
      .from("crm_leads_v3")
      .select("id")
      .eq("identity_id", msg.identity_id);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: leadData } = await leadQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const leadId = leadData?.id || msg.identity_id;

    // 2. Reply via Meta API
    const { replyToMetaComment } = await import("@/lib/meta");
    const res = await replyToMetaComment(msg.external_message_id, content);

    if (!res.success) throw new Error(res.error || "Meta reply failed");

    // 3. Save to V3 Communications Hub via saveOmniMessage
    await saveOmniMessage({
      lead_id: leadId,
      source: (msg.platform || "OTHER") as Database["public"]["Enums"]["lead_source"],
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

    // 1. Get lead info from V3 Core to filter messages by identity_id and source
    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("created_at, source, identity_id")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead } = await leadQuery.single();

    if (!lead || !lead.identity_id) throw new Error("ไม่พบข้อมูลลูกค้า");

    // 2. Fetch messages from communications_hub_v3 ordered by newest first
    // Query both direct messages for this identity AND global/broadcast messages for this platform
    // Completely eliminates select(*) and only requests the exact 9 columns needed
    let msgQuery = supabase
      .from("communications_hub_v3")
      .select(`
        id,
        tenant_id,
        content,
        direction,
        platform,
        external_message_id,
        is_read,
        payload,
        created_at
      `)
      .or(`identity_id.eq.${lead.identity_id},and(identity_id.is.null,platform.eq.${lead.source || "OTHER"},created_at.gte.${lead.created_at || "1970-01-01"})`);

    const { data: rawMessages, error } = await msgQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    if (error) throw error;

    const messagesData = (rawMessages || []) as Array<{
      id: string;
      tenant_id: string | null;
      content: string | null;
      direction: number;
      platform: string;
      external_message_id: string | null;
      is_read: boolean | null;
      payload: Json | null;
      created_at: string | null;
    }>;

    const hasMore = messagesData.length > limit;
    const slicedData = hasMore ? messagesData.slice(0, limit) : messagesData;

    // Filter out comments (only want direct messages / DMs)
    const filteredData = slicedData.filter((m) => {
      const payload = (m.payload as Record<string, any>) || {};
      if (payload.field === "comments" || payload.type === "comment") return false;
      if (payload.field === "feed" && payload.value?.item === "comment") return false;
      if (typeof m.content === "string" && (m.content.startsWith("[FB Comment]:") || m.content.startsWith("[IG Comment]:"))) return false;
      return true;
    });

    // Map to OmniMessage interface expected by UI components
    const finalMessages: OmniMessage[] = filteredData.map((m) => ({
      id: m.id,
      lead_id: leadId,
      tenant_id: m.tenant_id,
      content: m.content,
      direction: m.direction === 0 ? "INCOMING" : "OUTGOING",
      source: m.platform,
      external_message_id: m.external_message_id,
      is_read: m.is_read || false,
      payload: (m.payload as OmniMessage["payload"]) || null,
      created_at: m.created_at,
      updated_at: m.created_at || new Date().toISOString(),
    }));

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

const CategorySchema = z.enum(["CUSTOMER", "AGENT", "OWNER"]);

export async function updateLeadCategoryAction(
  leadId: string,
  category: string,
): Promise<ActionResponse> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // 1. Validate category
    const validatedCategory = CategorySchema.parse(category);

    // 2. Get current utm_data/preferences to merge from V3 Core crm_leads_v3
    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead } = await leadQuery.single();

    if (!lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const newUtmData = {
      ...((lead.utm_data as Record<string, unknown>) || {}),
      category: validatedCategory,
      category_updated_at: new Date().toISOString(),
      preferences: {
        ...(((lead.utm_data as Record<string, unknown>)?.preferences as Record<string, unknown>) || {}),
        category: validatedCategory,
      },
    };

    // 3. Update V3 Core crm_leads_v3
    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: newUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error } = await updateQuery;

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
    const { supabase, tenantId } = await requireAuthContext();

    // 1. Get identity_id from V3 Core crm_leads_v3
    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("identity_id")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead } = await leadQuery.single();

    if (!lead || !lead.identity_id) {
      throw new Error("ไม่พบข้อมูลผู้ติดต่อ");
    }

    // 2. Update communications_hub_v3 for this identity_id
    // direction === 0 is INBOUND (incoming from customer)
    let readQuery = supabase
      .from("communications_hub_v3")
      .update({ is_read: true })
      .eq("identity_id", lead.identity_id)
      .eq("direction", 0)
      .eq("is_read", false);

    if (tenantId) {
      readQuery = readQuery.eq("tenant_id", tenantId);
    }

    const { error } = await readQuery;

    if (error) throw error;

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: unknown) {
    console.error("[markLeadMessagesAsReadAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}
