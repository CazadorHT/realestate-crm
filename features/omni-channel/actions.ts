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
import { translateLocation } from "@/lib/utils/provinces";
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

    let pushWarning: string | undefined = undefined;

    try {
      if (leadData.source === "LINE" && lineId) {
        let token = lineConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
          try {
            const { getSiteSettings } = await import("@/features/site-settings/actions");
            const settings = await getSiteSettings();
            token = settings.line_channel_access_token || "";
          } catch (_) {}
        }

        if (token) {
          const res = await fetch(`${LINE_MESSAGING_API}/push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: lineId,
              messages: [{ type: "text", text: content }],
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[sendDirectReplyAction] LINE API Warn: ${errText}`);
            pushWarning = `LINE Push: ${errText}`;
          }
        }
      } else if (
        leadData.source === "FACEBOOK" &&
        (fbPsid || fbPsid === null)
      ) {
        const psid = fbPsid || "MOCK_PSID";
        const res = await sendMetaMessage(psid, content, "FACEBOOK");
        if (!res.success) {
          console.warn(`[sendDirectReplyAction] Facebook API Warn: ${res.error}`);
          pushWarning = `Facebook Push: ${res.error}`;
        }
      } else if (leadData.source === "INSTAGRAM" && igSid) {
        const res = await sendMetaMessage(igSid, content, "INSTAGRAM");
        if (!res.success) {
          console.warn(`[sendDirectReplyAction] Instagram API Warn: ${res.error}`);
          pushWarning = `Instagram Push: ${res.error}`;
        }
      } else if (leadData.source === "WHATSAPP" && phone) {
        const res = await sendWhatsAppMessage(phone, content);
        if (!res.success) {
          console.warn(`[sendDirectReplyAction] WhatsApp API Warn: ${res.error}`);
          pushWarning = `WhatsApp Push: ${res.error}`;
        }
      }
    } catch (pushErr: any) {
      console.warn("[sendDirectReplyAction] External push exception:", pushErr);
      pushWarning = pushErr.message;
    }

    // 3. Log to V3 Communications Hub via saveOmniMessage (Guaranteed persistence)
    const saved = await saveOmniMessage({
      lead_id: leadId,
      source: (leadData.source || "OTHER") as Database["public"]["Enums"]["lead_source"],
      content,
      direction: "OUTGOING",
      payload: { 
        system_push: true, 
        sender: "admin", 
        sender_type: "human", 
        is_bot: false, 
        push_warning: pushWarning || null 
      },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true, data: saved, error: pushWarning };
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
    const saved = await saveOmniMessage({
      lead_id: leadId,
      source: (msg.platform || "OTHER") as Database["public"]["Enums"]["lead_source"],
      content,
      direction: "OUTGOING",
      payload: { comment_reply: true, parent_id: msg.external_message_id },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true, data: saved };
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

/**
 * Toggle AI Bot Handoff (Pause/Resume Bot for a specific lead)
 */
export async function toggleBotHandoffAction(
  leadId: string,
  botPaused: boolean,
): Promise<ActionResponse<{ botPaused: boolean }>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead, error: leadErr } = await leadQuery.single();
    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const currentUtmData = (lead.utm_data as Record<string, any>) || {};
    const currentPrefs = currentUtmData.preferences || {};

    const updatedUtmData = {
      ...currentUtmData,
      preferences: {
        ...currentPrefs,
        bot_paused: botPaused,
        bot_paused_at: botPaused ? new Date().toISOString() : null,
      },
    };

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    revalidatePath("/protected/inbox");
    return { success: true, data: { botPaused } };
  } catch (err: unknown) {
    console.error("[toggleBotHandoffAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Upload image attachment for chat and get public URL
 */
export async function uploadChatAttachmentAction(
  formData: FormData,
): Promise<ActionResponse<{ url: string; fileName: string }>> {
  try {
    await requireAuthContext();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `chat-attachments/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const adminSupabase = (await import("@/lib/supabase/admin")).createAdminClient();
    
    // Upload to properties or public storage bucket
    const { error: uploadError } = await adminSupabase.storage
      .from("properties")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[uploadChatAttachmentAction] Storage upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from("properties")
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        url: publicUrlData.publicUrl,
        fileName: file.name,
      },
    };
  } catch (err: unknown) {
    console.error("[uploadChatAttachmentAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Search active properties to share directly in chat
 */
export async function searchActivePropertiesForChatAction(
  searchQuery: string = "",
  limit: number = 24,
): Promise<ActionResponse<any[]>> {
  try {
    const { supabase } = await requireAuthContext();

    const fetchProps = async (client: any) => {
      let query = client
        .from("properties")
        .select(`
          id,
          title,
          title_en,
          price,
          rental_price,
          listing_type,
          property_type,
          bedrooms,
          bathrooms,
          size_sqm,
          land_size_sqwah,
          status,
          main_image,
          images,
          project_name,
          popular_area,
          province,
          district,
          address_line1,
          tenant_id
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(
          `title.ilike.%${q}%,title_en.ilike.%${q}%,project_name.ilike.%${q}%,popular_area.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%,address_line1.ilike.%${q}%`
        );
      }

      return await query;
    };

    let { data, error } = await fetchProps(supabase);

    // If RLS returned empty or error, fallback to admin client
    if (!data || data.length === 0 || error) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const adminRes = await fetchProps(adminSupabase);
      if (adminRes.data && adminRes.data.length > 0) {
        data = adminRes.data;
      }
    }

    const { getPublicImageUrl } = await import("@/features/properties/image-utils");

    const formatted = (data || []).map((p: any) => {
      let imageUrl: string | null = null;
      if (p.main_image) {
        imageUrl = p.main_image.startsWith("http")
          ? p.main_image
          : getPublicImageUrl(p.main_image);
      } else if (Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0]?.url || p.images[0]?.storage_path || p.images[0];
        if (typeof first === "string") {
          imageUrl = first.startsWith("http") ? first : getPublicImageUrl(first);
        }
      }

      return {
        id: p.id,
        code: p.id.slice(0, 8).toUpperCase(),
        title: p.title || p.title_en || "Untitled Property",
        price: p.price,
        rentPrice: p.rental_price,
        listingType: p.listing_type,
        propertyType: p.property_type,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.size_sqm || p.land_size_sqwah,
        projectName: p.project_name || "",
        imageUrl,
        publicUrl: `/properties/${p.id}`,
      };
    });

    return { success: true, data: formatted };
  } catch (err: unknown) {
    console.error("[searchActivePropertiesForChatAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Send a rich property card to the lead (LINE Flex Message & CRM Card)
 */
export async function sendPropertyCardAction(
  leadId: string,
  property: {
    id: string;
    code?: string;
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
    project_name?: string | null;
    project_name_en?: string | null;
    project_name_cn?: string | null;
    project_name_ru?: string | null;
    listing_type?: string | null;
    property_type?: string | null;
    price?: number | null;
    rental_price?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    size_sqm?: number | null;
    land_size_sqwah?: number | null;
    popular_area?: string | null;
    popular_area_en?: string | null;
    district?: string | null;
    district_en?: string | null;
    province?: string | null;
    province_en?: string | null;
    images?: string[];
    imageUrl?: string | null;
    publicUrl?: string | null;
  },
  lang: "th" | "en" | "cn" | "ru" = "th",
): Promise<ActionResponse> {
  try {
    const { buildPropertyCardFlexMessage } = await import("@/lib/line-flex-builders");

    // Localized title
    const localizedTitle =
      (lang === "en"
        ? property.title_en
        : lang === "cn"
          ? property.title_cn
          : lang === "ru"
            ? property.title_ru
            : property.title) ||
      property.title ||
      "—";

    const localizedProjectName =
      (lang === "en"
        ? property.project_name_en
        : lang === "cn"
          ? property.project_name_cn
          : lang === "ru"
            ? property.project_name_ru
            : property.project_name) ||
      property.project_name ||
      null;

    const rawArea = (lang === "en" ? (property.popular_area_en || property.popular_area) : property.popular_area) || "";
    const rawProv = (lang === "en" ? (property.province_en || property.province) : property.province) || "";
    const area = translateLocation(rawArea, lang);
    const prov = translateLocation(rawProv, lang);
    const localizedLocation = [area, prov].filter(Boolean).join(", ") || null;

    const isRent = property.listing_type === "RENT";
    const formattedPrice = property.price 
      ? `฿${Number(property.price).toLocaleString()}${isRent ? (lang === "th" ? "/ด." : "/mo") : ""}` 
      : property.rental_price 
        ? `฿${Number(property.rental_price).toLocaleString()}${lang === "th" ? "/ด." : "/mo"}` 
        : (lang === "th" ? "สอบถามราคา" : "Contact for price");

    const specs = [
      property.bedrooms ? `🛏️ ${property.bedrooms} ${lang === "th" ? "ห้องนอน" : "Bed" + (property.bedrooms > 1 ? "s" : "")}` : null,
      property.bathrooms ? `🚿 ${property.bathrooms} ${lang === "th" ? "ห้องน้ำ" : "Bath" + (property.bathrooms > 1 ? "s" : "")}` : null,
      property.size_sqm ? `📐 ${property.size_sqm} ${lang === "th" ? "ตร.ม." : "sq.m."}` : null,
    ].filter(Boolean).join(" • ");

    const textContent = `🏠 ${lang === "th" ? "แนะนำทรัพย์" : "Recommended Property"}: [${property.code || property.id.slice(0, 8).toUpperCase()}] ${localizedTitle}\n💰 ${lang === "th" ? "ราคา" : "Price"}: ${formattedPrice}${specs ? `\n✨ ${specs}` : ""}`;

    // Send direct reply with rich property payload
    const { supabase: userSupabase, tenantId } = await requireAuthContext();

    let leadQuery = userSupabase
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
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: leadData } = await leadQuery.single();
    const identity = leadData?.identity as any;
    const rawLineId = identity?.line_id;
    const lineId = rawLineId ? decrypt(rawLineId) : null;

    let pushWarning: string | undefined = undefined;

    // Send LINE Flex Message if applicable
    if (leadData?.source === "LINE" && lineId) {
      try {
        let token = lineConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
          const { getSiteSettings } = await import("@/features/site-settings/actions");
          const settings = await getSiteSettings();
          token = settings.line_channel_access_token || "";
        }

        if (token) {
          const flexMessage = buildPropertyCardFlexMessage(property, lang);

          const res = await fetch(`${LINE_MESSAGING_API}/push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: lineId,
              messages: [flexMessage],
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            pushWarning = `LINE Push: ${errText}`;
            console.error("[sendPropertyCardAction] LINE Flex Push error:", errText);
          }
        }
      } catch (err: any) {
        pushWarning = err.message;
        console.error("[sendPropertyCardAction] Push failed:", err);
      }
    }

    // Save to communications_hub_v3
    const saved = await saveOmniMessage({
      lead_id: leadId,
      source: (leadData?.source || "OTHER") as Database["public"]["Enums"]["lead_source"],
      content: textContent,
      direction: "OUTGOING",
      payload: {
        property_card: true,
        property_id: property.id,
        property_code: property.code || property.id.slice(0, 8).toUpperCase(),
        title: localizedTitle,
        price_text: formattedPrice,
        specs,
        project_name: localizedProjectName,
        listing_type: property.listing_type || null,
        property_type: property.property_type || null,
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        size_sqm: property.size_sqm || null,
        location: localizedLocation,
        images: property.images || (property.imageUrl ? [property.imageUrl] : []),
        image_url: property.imageUrl || property.images?.[0] || null,
        language: lang,
        push_warning: pushWarning || null,
      },
      tenant_id: tenantId || undefined,
    });

    revalidatePath("/protected/inbox");
    return { success: true, data: saved, error: pushWarning };
  } catch (err: unknown) {
    console.error("[sendPropertyCardAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Update Chat Status: "needs_action" (ต้องดำเนินการ) | "resolved" (ดำเนินการแล้ว)
 */
export async function updateChatStatusAction(
  leadId: string,
  chatStatus: "needs_action" | "resolved",
): Promise<ActionResponse<{ chatStatus: "needs_action" | "resolved" }>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead, error: leadErr } = await leadQuery.single();
    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const currentUtmData = (lead.utm_data as Record<string, any>) || {};
    const currentPrefs = currentUtmData.preferences || {};

    const updatedUtmData = {
      ...currentUtmData,
      preferences: {
        ...currentPrefs,
        chat_status: chatStatus,
        chat_status_updated_at: new Date().toISOString(),
      },
    };

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    revalidatePath("/protected/inbox");
    return { success: true, data: { chatStatus } };
  } catch (err: unknown) {
    console.error("[updateChatStatusAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Update Lead Tags (e.g. สนใจคอนโด, งบ 5-10M, รอนัดดูห้อง)
 */
export async function updateLeadTagsAction(
  leadId: string,
  tags: string[],
): Promise<ActionResponse<{ tags: string[] }>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead, error: leadErr } = await leadQuery.single();
    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const currentUtmData = (lead.utm_data as Record<string, any>) || {};
    const currentPrefs = currentUtmData.preferences || {};

    const updatedUtmData = {
      ...currentUtmData,
      preferences: {
        ...currentPrefs,
        tags,
        tags_updated_at: new Date().toISOString(),
      },
    };

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    revalidatePath("/protected/inbox");
    return { success: true, data: { tags } };
  } catch (err: unknown) {
    console.error("[updateLeadTagsAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Update Assigned Agent for Lead
 */
export async function updateLeadAssigneeAction(
  leadId: string,
  assigneeId: string | null,
): Promise<ActionResponse<{ assigneeId: string | null }>> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ assigned_to: assigneeId || null })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error } = await updateQuery;
    if (error) throw error;

    revalidatePath("/protected/inbox");
    return { success: true, data: { assigneeId } };
  } catch (err: unknown) {
    console.error("[updateLeadAssigneeAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Add an internal note (visible ONLY to team staff, customer NEVER sees this)
 */
export async function addLeadInternalNoteAction(
  leadId: string,
  content: string,
): Promise<ActionResponse<any>> {
  try {
    const { supabase, user, tenantId } = await requireAuthContext();
    if (!content.trim()) throw new Error("Note content cannot be empty");

    // Fetch author identity display name
    const { data: authorIdentity } = await supabase
      .from("identities_v3")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    const rawAuthorName = authorIdentity?.display_name || "Agent";
    const authorName = decrypt(rawAuthorName) || rawAuthorName;

    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead, error: leadErr } = await leadQuery.single();
    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const currentUtmData = (lead.utm_data as Record<string, any>) || {};
    const currentPrefs = currentUtmData.preferences || {};
    const existingNotes: any[] = Array.isArray(currentPrefs.internal_notes) ? currentPrefs.internal_notes : [];

    const newNote = {
      id: (await import("crypto")).randomUUID(),
      content: content.trim(),
      author_id: user.id,
      author_name: authorName,
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...existingNotes];

    const updatedUtmData = {
      ...currentUtmData,
      preferences: {
        ...currentPrefs,
        internal_notes: updatedNotes,
      },
    };

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    revalidatePath("/protected/inbox");
    return { success: true, data: newNote };
  } catch (err: unknown) {
    console.error("[addLeadInternalNoteAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Delete an internal note
 */
export async function deleteLeadInternalNoteAction(
  leadId: string,
  noteId: string,
): Promise<ActionResponse> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let leadQuery = supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId);

    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }

    const { data: lead, error: leadErr } = await leadQuery.single();
    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");

    const currentUtmData = (lead.utm_data as Record<string, any>) || {};
    const currentPrefs = currentUtmData.preferences || {};
    const existingNotes: any[] = Array.isArray(currentPrefs.internal_notes) ? currentPrefs.internal_notes : [];

    const updatedNotes = existingNotes.filter((n: any) => n.id !== noteId);

    const updatedUtmData = {
      ...currentUtmData,
      preferences: {
        ...currentPrefs,
        internal_notes: updatedNotes,
      },
    };

    let updateQuery = supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    revalidatePath("/protected/inbox");
    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteLeadInternalNoteAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Get tenant staff list for assigning agents (Deduplicated real staff & admins only)
 */
export async function getTenantStaffListAction(): Promise<ActionResponse<any[]>> {
  try {
    const { supabase } = await requireAuthContext();

    // 1. Fetch from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, email")
      .in("role", ["ADMIN", "SUPER_ADMIN", "MANAGER", "BRANCH_MANAGER", "AGENT", "STAFF"]);

    // 2. Fetch from tenant_members_v3
    const { data: members } = await supabase
      .from("tenant_members_v3")
      .select(`
        id,
        role,
        identity:identities_v3!tenant_members_v3_identity_id_fkey (
          id,
          display_name,
          avatar_url,
          email
        )
      `)
      .in("role", ["ADMIN", "SUPER_ADMIN", "MANAGER", "BRANCH_MANAGER", "AGENT", "STAFF"]);

    const staffMap = new Map<string, any>();

    // Add from profiles first
    for (const p of profiles || []) {
      const rawEmail = p.email || "";
      const email = rawEmail.includes(":") ? (decrypt(rawEmail) || rawEmail) : rawEmail;
      const name = p.full_name || (email ? email.split("@")[0] : "Staff");

      staffMap.set(p.id, {
        identityId: p.id,
        name,
        role: p.role || "AGENT",
        avatarUrl: p.avatar_url || null,
        email,
      });
    }

    // Add from tenant_members_v3
    for (const m of members || []) {
      const identityId = m.identity?.id;
      if (!identityId) continue;

      const rawEmail = m.identity?.email || "";
      const email = rawEmail.includes(":") ? (decrypt(rawEmail) || rawEmail) : rawEmail;

      const rawName = m.identity?.display_name;
      const name = rawName ? (decrypt(rawName) || rawName) : (email ? email.split("@")[0] : "Staff");

      if (name.includes("(Demo #") || name === "Unknown") continue;

      if (!staffMap.has(identityId)) {
        staffMap.set(identityId, {
          identityId,
          name,
          role: m.role || "AGENT",
          avatarUrl: m.identity?.avatar_url || null,
          email,
        });
      } else {
        const existing = staffMap.get(identityId);
        if (!existing.avatarUrl && m.identity?.avatar_url) {
          existing.avatarUrl = m.identity.avatar_url;
        }
        if (name && name !== email.split("@")[0]) {
          existing.name = name;
        }
      }
    }

    // Deduplicate by normalized name/email
    const finalStaff: any[] = [];
    const seenEmails = new Set<string>();

    for (const staff of staffMap.values()) {
      const key = staff.email?.toLowerCase().trim() || staff.identityId;
      if (seenEmails.has(key)) continue;
      seenEmails.add(key);
      finalStaff.push(staff);
    }

    // Sort: ADMIN/MANAGER first, then by name
    finalStaff.sort((a, b) => {
      const isBossA = a.role === "ADMIN" || a.role === "SUPER_ADMIN" || a.role.includes("MANAGER");
      const isBossB = b.role === "ADMIN" || b.role === "SUPER_ADMIN" || b.role.includes("MANAGER");
      if (isBossA && !isBossB) return -1;
      if (!isBossA && isBossB) return 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, data: finalStaff };
  } catch (err: unknown) {
    console.error("[getTenantStaffListAction] Error:", err);
    return { success: false, error: (err as Error).message };
  }
}
