import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt, generateBlindIndex } from "@/lib/crypto";
import {
  getMetaUserProfile,
  fetchFacebookLeadDetails,
  sendPrivateReply,
  replyToMetaComment,
  sendMetaCarousel,
  sendMetaMessage,
} from "@/lib/meta";
import { saveOmniMessage } from "@/lib/line"; // reuse same util since it's generic enough
import { redis } from "@/lib/redis";
import { getSiteSettings } from "@/features/site-settings/actions";
import { SocialKeyword } from "@/features/site-settings/schema";
import { z } from "zod";
import { MetaPlatform, MetaWebhookBody } from "@/types/meta";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";

/**
 * Zod Schemas for Meta Webhook Validation
 */
const MetaWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number().optional(),
      messaging: z.array(z.any()).optional(),
      changes: z.array(z.any()).optional(),
    }),
  ),
});


const PLACEHOLDER_NAMES = [
  "Facebook User",
  "FB User",
  "FB Lead Ad User",
  "Facebook Contact",
  "IG User",
  "IG Contact",
  "Instagram Contact",
  "Instagram User",
];

/**
 * GET handler for Meta Webhook Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === metaConfig.verifyToken) {
      console.log("✅ Meta Webhook Verified");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("Bad Request", { status: 400 });
}

/**
 * POST handler for Meta Webhook Events
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Validate Payload Structure
    const validation = MetaWebhookSchema.safeParse(rawBody);
    if (!validation.success) {
      console.error(
        "[Meta Webhook] Validation Failed:",
        validation.error.format(),
      );
      return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }

    const body = validation.data as MetaWebhookBody;

    // 2. Route by Object Type
    if (body.object === "page") {
      for (const entry of body.entry) {
        // Facebook Messenger events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              try {
                await handleMetaMessage(messagingEvent, "FACEBOOK");
              } catch (err) {
                console.error("[Meta Webhook] Error handling Facebook message:", err);
              }
            }
          }
        }
        // Handle Feed, Leadgen, Ratings, etc.
        if (entry.changes) {
          for (const change of entry.changes) {
            try {
              await handleFacebookChange(change, entry.id);
            } catch (err) {
              console.error("[Meta Webhook] Error handling Facebook change:", err);
            }
          }
        }
      }
    }
    // Instagram subscription
    else if (body.object === "instagram") {
      for (const entry of body.entry) {
        // Handle direct messages
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              try {
                await handleMetaMessage(messagingEvent, "INSTAGRAM");
              } catch (err) {
                console.error("[Meta Webhook] Error handling Instagram message:", err);
              }
            }
          }
        }
        // Handle comments and mentions
        if (entry.changes) {
          for (const change of entry.changes) {
            try {
              await handleInstagramChange(change);
            } catch (err) {
              console.error("[Meta Webhook] Error handling Instagram change:", err);
            }
          }
        }
      }
    }
    // WhatsApp subscription
    else if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "messages" && change.value.messages) {
              for (const message of change.value.messages) {
                try {
                  await handleWhatsAppWebhook(
                    message,
                    change.value.contacts?.[0],
                  );
                } catch (err) {
                  console.error("[Meta Webhook] Error handling WhatsApp change:", err);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Meta Webhook Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

async function handleFacebookChange(change: any, pageId?: string) {
  const { field, value } = change;
  if (!value) return;

  // Skip if the event sender is the Page itself (avoid self-lead generation when replying)
  if (value.from?.id && pageId && value.from.id === pageId) {
    console.log(`[Meta Webhook] Ignoring page's own action/reply. Page ID: ${pageId}`);
    return;
  }

  const supabase = createAdminClient() as any;
  let text = "";
  let senderId = "";
  let senderName = "Facebook User";
  let externalId = "";

  if (field === "feed") {
    // feed covers posts and comments
    const item = value.item; // 'comment' or 'post' or 'status'
    const verb = value.verb; // 'add', 'edited', etc.
    if (verb !== "add") return;

    if (item === "comment") {
      text = `[FB Comment]: ${value.message}`;
      senderId = value.from?.id;
      senderName = value.from?.name || "FB User";
      externalId = value.comment_id;
      const postId = value.post_id || value.parent_id;

      // Handle Keyword Automation
      await handleKeywordAutomation(
        value.message,
        externalId,
        "FACEBOOK",
        postId,
        senderId,
      );
    } else if (item === "post" || item === "status" || item === "photo") {
      text = `[FB Post]: ${value.message || "New Page post"}`;
      senderId = value.from?.id;
      senderName = value.from?.name || "FB User";
      externalId = value.post_id;
    } else {
      return;
    }
  } else if (field === "leadgen") {
    // Facebook Lead Ads
    externalId = value.leadgen_id;
    const leadDetails = await fetchFacebookLeadDetails(externalId);

    if (leadDetails) {
      // Find name and phone from field_data if possible
      const fullNameField = leadDetails.field_data?.find(
        (f: any) => f.name === "full_name",
      )?.values?.[0];
      const phoneField = leadDetails.field_data?.find(
        (f: any) => f.name === "phone_number",
      )?.values?.[0];

      senderName = fullNameField || "FB Lead Ad User";
      text = `[FB Lead Ad]: New submission via Form ID: ${value.form_id}. Customer: ${senderName}`;
      if (phoneField) text += ` | Phone: ${phoneField}`;
    } else {
      text = `[FB Lead Ad]: New lead submitted. Form ID: ${value.form_id} (Details pending)`;
    }

    senderId = `LEADGEN_${externalId}`;
  } else if (field === "ratings") {
    // Page Reviews
    text = `[FB Review]: ${value.review_text || "New Rating"} (${value.rating} stars)`;
    senderId = value.reviewer_id;
    senderName = value.reviewer_name || "FB Reviewer";
    externalId = value.open_graph_story_id;
  } else {
    return; // Unsupported field for now
  }

  if (!senderId) return;

  const facebookPsidHash = generateBlindIndex(senderId);

  // 1. Find or Create Lead
  const { data: identity } = await supabase
    .from("identities_v3")
    .select("id, crm_leads_v3(id)")
    .eq("social_links->>facebook_psid_hash", facebookPsidHash)
    .maybeSingle();

  let lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;

  if (!lead) {
    // Check for duplicate Facebook lead by name
    if (senderName && !PLACEHOLDER_NAMES.includes(senderName)) {
      const fullNameHash = generateBlindIndex(senderName);
      const { data: existingIdentity } = await supabase
        .from("identities_v3")
        .select("id, social_links, crm_leads_v3(id)")
        .eq("social_links->>full_name_hash", fullNameHash)
        .eq("role", "LEAD")
        .maybeSingle();

      if (existingIdentity?.crm_leads_v3?.[0]) {
        lead = existingIdentity.crm_leads_v3[0] as { id: string };

        // Bind the new Facebook PSID/LEADGEN ID to the existing identity
        const currentSocialLinks = (existingIdentity.social_links as Record<string, any>) || {};
        const updatedSocialLinks = {
          ...currentSocialLinks,
          facebook_psid_hash: facebookPsidHash,
          facebook_psid: encrypt(senderId),
        };

        await supabase
          .from("identities_v3")
          .update({ social_links: updatedSocialLinks })
          .eq("id", existingIdentity.id);
      }
    }
  }

  if (!lead) {
    const { data: tenant } = await supabase
      .from("tenants_v3")
      .select("id")
      .limit(1)
      .single();
    const tenantId = tenant?.id || null;

    // Create Identity
    const encryptedDisplayName = encrypt(senderName);
    const encryptedFacebookPsid = encrypt(senderId);
    
    const { data: newIdentity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        tenant_id: tenantId,
        category: 2, // External
        role: "LEAD",
        display_name: encryptedDisplayName,
        social_links: {
          facebook_psid_hash: facebookPsidHash,
          facebook_psid: encryptedFacebookPsid,
          full_name_hash: generateBlindIndex(senderName),
        },
        is_active: true,
      })
      .select("id")
      .single();

    if (identityErr || !newIdentity) {
      console.error("[Meta Webhook] Error creating FB identity:", identityErr);
      return;
    }

    await supabase.from("identity_secrets_v3").insert({
      identity_id: newIdentity.id,
      full_name_encrypted: encryptedDisplayName,
      updated_at: new Date().toISOString()
    });

    const { data: newLead, error: createError } = await supabase
      .from("crm_leads_v3")
      .insert({
        tenant_id: tenantId,
        identity_id: newIdentity.id,
        status: "ACTIVE",
        stage: "NEW",
        source: "FACEBOOK",
        utm_data: {
          preferences: {
            note: `Auto-captured from FB ${field}. Verb: ${value.verb || "N/A"}`
          }
        }
      })
      .select("id")
      .single();

    if (createError) {
      console.error(`[route.ts] Error creating FB ${field} lead:`, createError);
      return;
    }
    lead = newLead as { id: string };
  }

  // 2. Save Message
  if (lead && lead.id) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: "FACEBOOK",
      external_message_id: externalId,
      content: text,
      payload: change,
      direction: "INCOMING",
    });
  }
}

async function handleMetaMessage(event: any, source: MetaPlatform) {
  const senderId = event.sender.id; // PSID
  const text = event.message.text || "";

  if (!senderId || !text) return;

  const supabase = createAdminClient() as any;

  // 1. Find or Create Lead
  const idField = source === "FACEBOOK" ? "facebook_psid" : "instagram_sid";
  const hashKey = `${idField}_hash`;
  const senderIdHash = generateBlindIndex(senderId);

  const { data: identity } = await supabase
    .from("identities_v3")
    .select("id, crm_leads_v3(id)")
    .eq(`social_links->>${hashKey}`, senderIdHash)
    .maybeSingle();

  let lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;  if (!lead) {
    const profile = await getMetaUserProfile(senderId, source);
    const displayName = profile?.name || `${source} Contact`;

    // Check for duplicate lead by name
    let existingLead = null;
    if (displayName && !PLACEHOLDER_NAMES.includes(displayName)) {
      const fullNameHash = generateBlindIndex(displayName);
      const { data: existingIdentity } = await supabase
        .from("identities_v3")
        .select("id, social_links, crm_leads_v3(id)")
        .eq("social_links->>full_name_hash", fullNameHash)
        .eq("role", "LEAD")
        .maybeSingle();

      if (existingIdentity?.crm_leads_v3?.[0]) {
        existingLead = existingIdentity.crm_leads_v3[0] as { id: string };

        // Bind the new PSID/SID to the existing identity
        const currentSocialLinks = (existingIdentity.social_links as Record<string, any>) || {};
        const updatedSocialLinks = {
          ...currentSocialLinks,
          [hashKey]: senderIdHash,
          [idField]: encrypt(senderId),
        };

        await supabase
          .from("identities_v3")
          .update({ social_links: updatedSocialLinks })
          .eq("id", existingIdentity.id);
      }
    }

    if (existingLead) {
      lead = existingLead;
    } else {
      const encryptedDisplayName = encrypt(displayName);
      const encryptedSenderId = encrypt(senderId);

      const { data: tenant } = await supabase
        .from("tenants_v3")
        .select("id")
        .limit(1)
        .single();
      const tenantId = tenant?.id || null;

      // Create Identity
      const socialLinks: any = {
        full_name_hash: generateBlindIndex(displayName),
      };
      socialLinks[hashKey] = senderIdHash;
      socialLinks[idField] = encryptedSenderId;

      const { data: newIdentity, error: identityErr } = await supabase
        .from("identities_v3")
        .insert({
          tenant_id: tenantId,
          category: 2, // External
          role: "LEAD",
          display_name: encryptedDisplayName,
          social_links: socialLinks,
          avatar_url: profile?.profile_pic || null,
          is_active: true,
        })
        .select("id")
        .single();

      if (identityErr || !newIdentity) {
        console.error(`[Meta Webhook] Error creating ${source} identity:`, identityErr);
        return;
      }

      await supabase.from("identity_secrets_v3").insert({
        identity_id: newIdentity.id,
        full_name_encrypted: encryptedDisplayName,
        updated_at: new Date().toISOString()
      });

      const { data: newLead, error: createError } = await supabase
        .from("crm_leads_v3")
        .insert({
          tenant_id: tenantId,
          identity_id: newIdentity.id,
          status: "ACTIVE",
          stage: "NEW",
          source: source,
          utm_data: {
            preferences: {
              note: `Auto-captured from ${source}. Profile: ${JSON.stringify(profile)}`
            }
          }
        })
        .select("id")
        .single();

      if (createError) {
        console.error(
          `[route.ts] Error creating ${source} auto-lead:`,
          createError,
        );
        return;
      }
      lead = newLead as { id: string };
    }
  }

  // 2. Log Message to Omni-channel
  if (lead && lead.id) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: source as any,
      external_message_id: event.message.mid,
      content: text,
      payload: event,
      direction: "INCOMING",
    });

    // Lead Capture Gate Check
    if (redis && senderId) {
      const pendingKey = `lead_capture_pending:${senderId}`;
      const pendingDataStr = await redis.get(pendingKey) as string | null;

      if (pendingDataStr) {
        const pendingData = JSON.parse(pendingDataStr);
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /(\+66|0)[689]\d{8}/;

        const emailMatch = text.match(emailRegex);
        const phoneMatch = text.match(phoneRegex);

        if (emailMatch || phoneMatch) {
          const updateData: any = {};
          if (emailMatch) updateData.email = emailMatch[0];
          if (phoneMatch) updateData.phone = phoneMatch[0];

          await supabase
            .from("identities_v3")
            .update(updateData)
            .eq("id", identity?.id || lead.id);

          await redis.del(pendingKey);

          const confirmText = "ขอบคุณสำหรับข้อมูลค่ะ! บันทึกข้อมูลเรียบร้อยแล้วค่ะ";
          await sendMetaMessage(senderId, confirmText, source);

          await handleKeywordAutomation(
            pendingData.keyword,
            pendingData.commentId,
            source,
            pendingData.postId,
            senderId,
          );
          return;
        } else {
          const promptText = "รูปแบบอีเมลหรือเบอร์โทรศัพท์ไม่ถูกต้อง กรุณาลองใหม่อีกครั้งค่ะ";
          await sendMetaMessage(senderId, promptText, source);
          return;
        }
      }
    }

    // Direct DM Automation Trigger
    const settings = await getSiteSettings();
    if (settings.direct_dm_reply_enabled) {
      await handleKeywordAutomation(
        text,
        event.message.mid,
        source,
        undefined,
        senderId,
      );
    }
  }
}

async function handleInstagramChange(change: any) {
  const { field, value } = change;
  if (!value) return;

  const instagramBusinessId = process.env.META_INSTAGRAM_BUSINESS_ID;
  if (value.from?.id && instagramBusinessId && value.from.id === instagramBusinessId) {
    console.log(`[Meta Webhook] Ignoring Instagram page's own comment/reply to prevent infinite loop. ID: ${instagramBusinessId}`);
    return;
  }

  const supabase = createAdminClient() as any;
  let text = "";
  let senderId = "";
  let senderName = "IG User";
  let externalId = value.id;

  if (field === "comments") {
    text = `[IG Comment]: ${value.text}`;
    senderId = value.from?.id;
    senderName = value.from?.username || "IG User";
    const mediaId = value.media?.id || value.media_id;

    const settings = await getSiteSettings();
    const isStory = value.media?.media_product_type === "STORY" || value.media_product_type === "STORY";

    if (!isStory || settings.instagram_story_reply_enabled) {
      // Handle Keyword Automation
      await handleKeywordAutomation(
        value.text,
        externalId,
        "INSTAGRAM",
        mediaId,
        senderId,
      );
    }
  } else if (field === "mentions") {
    text = `[IG Mention]: ${value.text || "Tagged in a post"}`;
    senderId = value.from?.id;
    senderName = value.from?.username || "IG User";
  } else {
    return; // Unsupported field
  }

  if (!senderId) return;

  // 1. Find or Create Lead
  const instagramSidHash = generateBlindIndex(senderId);

  const { data: identity } = await supabase
    .from("identities_v3")
    .select("id, crm_leads_v3(id)")
    .eq("social_links->>instagram_sid_hash", instagramSidHash)
    .maybeSingle();

  let lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;

  if (!lead) {
    const { data: tenant } = await supabase
      .from("tenants_v3")
      .select("id")
      .limit(1)
      .single();
    const tenantId = tenant?.id || null;

    // Create Identity
    const encryptedDisplayName = encrypt(senderName);
    const encryptedInstagramSid = encrypt(senderId);

    const { data: newIdentity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        tenant_id: tenantId,
        category: 2, // External
        role: "LEAD",
        display_name: encryptedDisplayName,
        social_links: {
          instagram_sid_hash: instagramSidHash,
          instagram_sid: encryptedInstagramSid,
          full_name_hash: generateBlindIndex(senderName),
        },
        is_active: true,
      })
      .select("id")
      .single();

    if (identityErr || !newIdentity) {
      console.error("[Meta Webhook] Error creating IG identity:", identityErr);
      return;
    }

    await supabase.from("identity_secrets_v3").insert({
      identity_id: newIdentity.id,
      full_name_encrypted: encryptedDisplayName,
      updated_at: new Date().toISOString()
    });

    const { data: newLead, error: createError } = await supabase
      .from("crm_leads_v3")
      .insert({
        tenant_id: tenantId,
        identity_id: newIdentity.id,
        status: "ACTIVE",
        stage: "NEW",
        source: "INSTAGRAM",
        utm_data: {
          preferences: {
            note: `Auto-captured from IG ${field}.`
          }
        }
      })
      .select("id")
      .single();

    if (createError) {
      console.error(`Error creating IG ${field} lead:`, createError);
      return;
    }
    lead = newLead as { id: string };
  }

  // 2. Save Message
  if (lead && lead.id) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: "INSTAGRAM",
      external_message_id: externalId,
      content: text,
      payload: change,
      direction: "INCOMING",
    });
  }
}

async function handleWhatsAppWebhook(message: any, contact: any) {
  if (message.type !== "text") return; // Support text only for now

  const from = message.from; // Phone number
  const text = message.text.body;
  const name = contact?.profile?.name || `WA: ${from}`;

  const supabase = createAdminClient() as any;

  // 1. Find or Create Lead by Phone
  const phoneHash = generateBlindIndex(from);

  const { data: identity } = await supabase
    .from("identities_v3")
    .select("id, crm_leads_v3(id)")
    .eq("social_links->>phone_hash", phoneHash)
    .maybeSingle();

  let lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;

  if (!lead) {
    const { data: tenant } = await supabase
      .from("tenants_v3")
      .select("id")
      .limit(1)
      .single();
    const tenantId = tenant?.id || null;

    // Create Identity
    const encryptedDisplayName = encrypt(name);
    const encryptedPhone = encrypt(from);

    const { data: newIdentity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        tenant_id: tenantId,
        category: 2, // External
        role: "LEAD",
        display_name: encryptedDisplayName,
        phone: encryptedPhone,
        social_links: {
          phone_hash: phoneHash,
          full_name_hash: generateBlindIndex(name),
        },
        is_active: true,
      })
      .select("id")
      .single();

    if (identityErr || !newIdentity) {
      console.error("[Meta Webhook] Error creating WA identity:", identityErr);
      return;
    }

    await supabase.from("identity_secrets_v3").insert({
      identity_id: newIdentity.id,
      full_name_encrypted: encryptedDisplayName,
      updated_at: new Date().toISOString()
    });

    const { data: newLead, error: createError } = await supabase
      .from("crm_leads_v3")
      .insert({
        tenant_id: tenantId,
        identity_id: newIdentity.id,
        status: "ACTIVE",
        stage: "NEW",
        source: "WHATSAPP",
        utm_data: {
          preferences: {
            note: "Auto-captured from WhatsApp Webhook"
          }
        }
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating WA auto-lead:", createError);
      return;
    }
    lead = newLead as { id: string };
  }

  // 2. Log Message
  if (lead && lead.id) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: "WHATSAPP",
      external_message_id: message.id,
      content: text,
      payload: message,
      direction: "INCOMING",
    });
  }
}

/**
 * Helper function to replace all smart tags in a template
 */
function htmlToPlainText(html: string): string {
  if (!html) return "";
  let text = html;
  text = text.replace(/<h[1-6][^>]*>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "\n- ");
  text = text.replace(/<\/li>/gi, "");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, " ");
  return text.split("\n")
             .map(line => line.trim())
             .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
             .join("\n").trim();
}

function replaceTemplateTags(text: string, propertyData: any, dynamicValues: any, lang: "th" | "en" | "cn" | "ru" = "th") {
  if (!text) return "";
  let rendered = text;

  // ล้างอีโมจินำหน้าพร้อมตัวอักษรซ่อน/BOM/Spaces ที่อยู่ติดกับอีโมจิออกทั้งหมด เพื่อป้องกันปัญหาถอดรหัสกลายเป็นเครื่องหมายคำถาม
  rendered = rendered.replace(/[💰🔑💵💸🔥][\s\u200B-\u200D\uFEFF]*{{price_tag}}/g, "{{price_tag}}");  const {
    priceTag,
    priceText,
    originalPriceText,
    salePrice,
    rentPrice,
    originalSalePrice,
    originalRentPrice,
    detailsSummary,
    amenities,
    nearbyPlaces,
    nearbyTransits,
    link,
    primaryAgent,
    projectName,
  } = dynamicValues;

  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: {
      CONDO: "คอนโด",
      HOUSE: "บ้านเดี่ยว",
      TOWNHOME: "ทาวน์โฮม",
      TOWNHOUSE: "ทาวน์เฮ้าส์",
      LAND: "ที่ดิน",
      COMMERCIAL_BUILDING: "อาคารพาณิชย์",
      COMMERCIAL: "อาคารพาณิชย์",
      OFFICE_BUILDING: "ออฟฟิศ",
      OFFICE: "ออฟฟิศ",
      WAREHOUSE: "โกดัง",
      VILLA: "วิลล่า",
      POOL_VILLA: "พูลวิลล่า",
      OTHER: "อื่นๆ"
    },
    en: {
      CONDO: "Condo",
      HOUSE: "House",
      TOWNHOME: "Townhome",
      TOWNHOUSE: "Townhouse",
      LAND: "Land",
      COMMERCIAL_BUILDING: "Commercial Building",
      COMMERCIAL: "Commercial",
      OFFICE_BUILDING: "Office Building",
      OFFICE: "Office",
      WAREHOUSE: "Warehouse",
      VILLA: "Villa",
      POOL_VILLA: "Pool Villa",
      OTHER: "Other"
    },
    cn: {
      CONDO: "公寓",
      HOUSE: "独栋别墅",
      TOWNHOME: "联排别墅",
      TOWNHOUSE: "联排别墅",
      LAND: "土地",
      COMMERCIAL_BUILDING: "商铺",
      COMMERCIAL: "商用楼",
      OFFICE_BUILDING: "写字楼",
      OFFICE: "办公室",
      WAREHOUSE: "仓库",
      VILLA: "别墅",
      POOL_VILLA: "带泳池别墅",
      OTHER: "其他"
    },
    ru: {
      CONDO: "Кондо",
      HOUSE: "Дом",
      TOWNHOME: "Таунхаус",
      TOWNHOUSE: "Таунхаус",
      LAND: "Земля",
      COMMERCIAL_BUILDING: "Коммерческая недвижимость",
      COMMERCIAL: "Коммерция",
      OFFICE_BUILDING: "Офисное здание",
      OFFICE: "Офис",
      WAREHOUSE: "Склад",
      VILLA: "Вилла",
      POOL_VILLA: "Вилла с бассейном",
      OTHER: "Другое"
    },
  };

  const LISTING_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { SALE: "ขาย", RENT: "ให้เช่า", SALE_AND_RENT: "ขาย/เช่า" },
    en: { SALE: "Sale", RENT: "Rent", SALE_AND_RENT: "Sale/Rent" },
    cn: { SALE: "出售", RENT: "出租", SALE_AND_RENT: "出售/出租" },
    ru: { SALE: "Продажа", RENT: "Аренда", SALE_AND_RENT: "Продажа/Аренда" },
  };

  const tDescriptionRaw = (lang === "th" ? propertyData.description : propertyData[`description_${lang}`]) || propertyData.description || "";
  const tDescription = htmlToPlainText(tDescriptionRaw);

  const tPropertyType = propertyData.property_type
    ? PROPERTY_TYPE_LABELS[lang]?.[propertyData.property_type] || propertyData.property_type
    : "";

  const tListingType = propertyData.listing_type
    ? LISTING_TYPE_LABELS[lang]?.[propertyData.listing_type] || propertyData.listing_type
    : "";

  const tVerified = propertyData.verified
    ? (lang === "th"
      ? "✅ ตรวจสอบแล้ว"
      : lang === "cn"
        ? "✅ 已验证"
        : lang === "ru"
          ? "✅ Проверено"
          : "✅ Verified")
    : "";

  const tExclusive = propertyData.is_exclusive
    ? (lang === "th"
      ? "🌟 Exclusive"
      : lang === "cn"
        ? "🌟 独家"
        : lang === "ru"
          ? "🌟 Эксклюзив"
          : "🌟 Exclusive")
    : "";

  const tDistrict = (lang === "th" ? propertyData.district : propertyData[`district_${lang}`]) || propertyData.district || "";
  const tProvinceName = getProvinceName(propertyData.province || "", lang);

  const cleanForHashtag = (str: string | null | undefined): string => {
    if (!str || str === "-") return "";
    return str.toString().replace(/[\s,()\-./]/g, "");
  };

  const tPropertyTypeClean = cleanForHashtag(tPropertyType);
  const tListingTypeClean = cleanForHashtag(tListingType);
  const tPopularAreaVal = (lang === "th" ? propertyData.popular_area : propertyData[`popular_area_${lang}`]) || propertyData.popular_area || "";
  const tPopularAreaClean = cleanForHashtag(tPopularAreaVal);
  const tDistrictClean = cleanForHashtag(tDistrict);
  const tProvinceClean = cleanForHashtag(tProvinceName);
  const tLocationClean = cleanForHashtag(tPopularAreaVal || tDistrict || tProvinceName);
  const tTransitClean = cleanForHashtag(propertyData.transit_station_name);

  const resultText = rendered
    .replace(/{{title}}/g, (lang === "th" ? propertyData.title : propertyData[`title_${lang}`]) || propertyData.title || "")
    .replace(/{{description}}/g, tDescription)
    .replace(/{{price}}/g, priceText)
    .replace(/{{original}}/g, originalPriceText)
    .replace(/{{original_price}}/g, originalPriceText)
    .replace(/{{sale_price}}/g, salePrice)
    .replace(/{{rent_price}}/g, rentPrice)
    .replace(/{{rental_price}}/g, rentPrice)
    .replace(/{{original_sale_price}}/g, originalSalePrice)
    .replace(/{{original_rent_price}}/g, originalRentPrice)
    .replace(/{{original_rental_price}}/g, originalRentPrice)
    .replace(/{{bedrooms}}/g, propertyData.bedrooms?.toString() || "-")
    .replace(/{{bathrooms}}/g, propertyData.bathrooms?.toString() || "-")
    .replace(/{{size_sqm}}/g, propertyData.size_sqm?.toString() || "-")
    .replace(/{{land_size}}/g, propertyData.land_size_sqwah?.toString() || "-")
    .replace(/{{land_size_sqwah}}/g, propertyData.land_size_sqwah?.toString() || "-")
    .replace(/{{parking}}/g, propertyData.parking_slots?.toString() || "-")
    .replace(/{{parking_slots}}/g, propertyData.parking_slots?.toString() || "-")
    .replace(/{{office_capacity}}/g, propertyData.office_capacity || "-")
    .replace(/{{halls}}/g, propertyData.halls?.toString() || "-")
    .replace(/{{maid_rooms}}/g, propertyData.maid_rooms?.toString() || "-")
    .replace(/{{floor}}/g, propertyData.floor?.toString() || "-")
    .replace(/{{property_type}}/g, tPropertyType)
    .replace(/{{listing_type}}/g, tListingType)
    .replace(/{{property_type_clean}}/g, tPropertyTypeClean)
    .replace(/{{listing_type_clean}}/g, tListingTypeClean)
    .replace(/{{popular_area_clean}}/g, tPopularAreaClean)
    .replace(/{{district_clean}}/g, tDistrictClean)
    .replace(/{{province_clean}}/g, tProvinceClean)
    .replace(/{{location_clean}}/g, tLocationClean)
    .replace(/{{transit_clean}}/g, tTransitClean)
    .replace(
      /{{location}}/g,
      (() => {
        const tPopularArea = getLocaleValue(propertyData, "popular_area", lang);
        const tProvince = getProvinceName(propertyData.province || "", lang);
        return [tPopularArea, tProvince].filter(Boolean).join(lang === "th" ? " " : ", ");
      })()
    )
    .replace(/{{popular_area}}/g, tPopularAreaVal || "-")
    .replace(/{{district}}/g, tDistrict)
    .replace(/{{province}}/g, tProvinceName)
    .replace(/{{amenities}}/g, amenities)
    .replace(/{{nearby_places}}/g, nearbyPlaces)
    .replace(/{{near_transit}}/g, nearbyTransits)
    .replace(
      /{{transit}}/g,
      propertyData.transit_station_name
        ? `${propertyData.transit_station_name} (${propertyData.transit_distance_meters || 0} ม.)`
        : "-",
    )
    .replace(/{{verified}}/g, tVerified)
    .replace(/{{exclusive}}/g, tExclusive)
    .replace(/{{google_maps}}/g, propertyData.google_maps_link || (propertyData.address_info as any)?.maps_link || "")
    .replace(/{{link}}/g, link)
    .replace(/{{price_tag}}/g, priceTag)
    .replace(/{{details}}/g, detailsSummary)
    .replace(/{{agent_name}}/g, primaryAgent?.nickname || primaryAgent?.full_name || "")
    .replace(/{{agent_phone}}/g, primaryAgent?.phone || "")
    .replace(/{{agent_line}}/g, primaryAgent?.line_id || "")
    .replace(/{{project_name}}/g, projectName || "");

  let cleanResult = resultText.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  // ลบเครื่องหมายคำถามที่อาจแฝงมาเนื่องจากอักขระพิเศษถอดรหัสไม่สมบูรณ์
  cleanResult = cleanResult.replace(/\?\s*([💰🔑💵💸🔥])/g, "$1");
  cleanResult = cleanResult.replace(/\?\s*(เช่า|ขาย|Rent|Sale|เช่า\/ขาย|Rent\/Sale|Price|ราคา)/gi, "$1");
  return cleanResult;
}

/**
 * Detect language of a given text (Thai, Chinese, or English)
 */
function detectLanguage(text: string): "th" | "en" | "cn" | "ru" {
  if (/[ก-ฮ]/.test(text)) return "th";
  if (/[\u4e00-\u9fa5]/.test(text)) return "cn";
  if (/[а-яА-Я]/.test(text)) return "ru";
  return "en";
}

/**
 * Handle Keyword-based Automation (Comment-to-DM)
 */
async function handleKeywordAutomation(
  text: string,
  commentId: string,
  platform: MetaPlatform,
  postId?: string,
  senderId?: string,
) {
  if (!text || !commentId) return;

  // Deduplicate request using Upstash Redis to prevent double sends from Meta Webhook retries
  if (redis) {
    const redisKey = `meta_webhook_dedup:${commentId}`;
    const isLocked = await redis.set(redisKey, "1", { nx: true, ex: 10 }); // Lock for 10 seconds
    if (!isLocked) {
      console.warn(`[Meta Webhook] Duplicate request detected for comment ${commentId}. Ignoring.`);
      return;
    }
  }

  // 1. Fetch dynamic keywords from DB
  const settings = await getSiteSettings();
  const automationKeywords = settings.social_automation_keywords || [];

  if (automationKeywords.length === 0) return;

  const lowerText = text.toLowerCase();

  // 2. Find matching keyword (respects linked_post_id if set)
  const match = automationKeywords.find(
    (k: SocialKeyword) =>
      k.enabled !== false &&
      lowerText.includes(k.keyword.toLowerCase()) &&
      // If keyword is pinned to a specific post, only match that post's comments
      (!k.linked_post_id || k.linked_post_id === postId),
  );

  if (!match) return;

  console.log(
    `🤖 Dynamic keyword matched in ${platform} comment: "${text}" matches "${match.keyword}"`,
  );

  const isDirectDM = !postId;
  let lang = match.language || detectLanguage(match.dm_content || "");

  // 2.1 Follow Gate Check
  if (settings.follow_gate_enabled && platform === "INSTAGRAM" && senderId) {
    const tokenToUse = settings.meta_page_access_token || process.env.META_PAGE_ACCESS_TOKEN;
    if (tokenToUse) {
      const isFollowing = await checkInstagramFollows(senderId, tokenToUse);
      if (!isFollowing) {
        const followPrompt = lang === "th" 
          ? "กรุณากดติดตามเพจ Instagram ของเราก่อนรับรายละเอียดโครงการนะคะ 😊" 
          : "Please follow our Instagram page first to receive the details! 😊";
        if (isDirectDM) {
          await sendMetaMessage(senderId, followPrompt, platform);
        } else {
          await sendPrivateReply(commentId, followPrompt, platform);
        }
        return;
      }
    }
  }

  // 2.2 Lead Capture Gate Check
  if (settings.lead_capture_gate_enabled && senderId) {
    const supabase = createAdminClient() as any;
    const senderIdHash = generateBlindIndex(senderId);
    const idField = platform === "FACEBOOK" ? "facebook_psid_hash" : "instagram_sid_hash";

    const { data: identity } = await supabase
      .from("identities_v3")
      .select("id, email, phone")
      .eq(`social_links->>${idField}`, senderIdHash)
      .maybeSingle();

    const hasContactInfo = !!(identity?.email || identity?.phone);

    if (!hasContactInfo && redis) {
      const pendingKey = `lead_capture_pending:${senderId}`;
      const isPending = await redis.get(pendingKey);

      if (!isPending) {
        await redis.set(pendingKey, JSON.stringify({ keyword: match.keyword, commentId, postId }), { ex: 300 });
        const promptText = lang === "th"
          ? "กรุณาพิมพ์อีเมลหรือเบอร์โทรศัพท์ของคุณเพื่อรับสิทธิ์ดูรายละเอียดโครงการค่ะ 😊"
          : "Please reply with your email or phone number to receive the property details! 😊";
        if (isDirectDM) {
          await sendMetaMessage(senderId, promptText, platform);
        } else {
          await sendPrivateReply(commentId, promptText, platform);
        }
        return;
      }
    }
  }

  // 3. Property Lookup (Optional - only if we have a postId)
  let propertyData: any = null;
  if (postId) {
    propertyData = await lookupPropertyByPostId(postId);
  }

  // 4. Prepare Message Content
  // ล้างอักขระซ่อนเร้น BOM/Zero-width space ทันทีที่ดึงมาจาก DB เพื่อป้องกันปัญหาถอดรหัสล้มเหลวกลายเป็นเครื่องหมายคำถาม
  let dmContent = (match.dm_content || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  let publicReply = (match.public_reply || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  
  if (match.public_replies && match.public_replies.length > 0) {
    const validReplies = match.public_replies.filter(Boolean);
    if (validReplies.length > 0) {
      const picked = validReplies[Math.floor(Math.random() * validReplies.length)];
      publicReply = (picked || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    }
  }

  if (propertyData) {
    // Price logic
    const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : lang === "ru" ? "Продажа" : "售价";
    const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : lang === "ru" ? "Аренда" : "租金";
    const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : lang === "ru" ? "ТНВ" : "泰铢";
    const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : lang === "ru" ? "/мес" : "/月";

    let priceText = "";
    if (propertyData.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (propertyData.price) parts.push(`${tSale} ${propertyData.price.toLocaleString()} ${tBaht}`);
      if (propertyData.rental_price) parts.push(`${tRent} ${propertyData.rental_price.toLocaleString()} ${tBaht}${tPerMonth}`);
      priceText = parts.join(" | ");
    } else if (propertyData.listing_type === "RENT") {
      priceText = propertyData.rental_price ? `${propertyData.rental_price.toLocaleString()} ${tBaht}${tPerMonth}` : "";
    } else {
      priceText = propertyData.price ? `${propertyData.price.toLocaleString()} ${tBaht}` : "";
    }

    let originalPriceText = "";
    if (propertyData.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (propertyData.original_price) parts.push(`${tSale} ${propertyData.original_price.toLocaleString()} ${tBaht}`);
      if (propertyData.original_rental_price) parts.push(`${tRent} ${propertyData.original_rental_price.toLocaleString()} ${tBaht}${tPerMonth}`);
      originalPriceText = parts.join(" | ");
    } else if (propertyData.listing_type === "RENT") {
      originalPriceText = propertyData.original_rental_price ? `${propertyData.original_rental_price.toLocaleString()} ${tBaht}${tPerMonth}` : "";
    } else {
      originalPriceText = propertyData.original_price ? `${propertyData.original_price.toLocaleString()} ${tBaht}` : "";
    }

    const salePrice = propertyData.price ? `${propertyData.price.toLocaleString()} ${tBaht}` : "";
    const rentPrice = propertyData.rental_price ? `${propertyData.rental_price.toLocaleString()} ${tBaht}${tPerMonth}` : "";
    const originalSalePrice = propertyData.original_price ? `${propertyData.original_price.toLocaleString()} ${tBaht}` : "";
    const originalRentPrice = propertyData.original_rental_price ? `${propertyData.original_rental_price.toLocaleString()} ${tBaht}${tPerMonth}` : "";

    // Magic price tag
    let priceTag = "";
    const formatSale = (price: number, original?: number) => {
      if (original && original > price) {
        return lang === "th"
          ? "\u0e25\u0e14\u0e1e\u0e34\u0e40\u0e28\u0e29! " + price.toLocaleString() + " \u0e1a\u0e32\u0e17 (\u0e0a\u0e32\u0e01 " + original.toLocaleString() + " \u0e3f)"
          : lang === "en"
            ? "Hot Deal! " + price.toLocaleString() + " THB (Was " + original.toLocaleString() + " \u0e3f)"
            : lang === "ru"
              ? "\u0413\u043e\u0440\u044f\u0447\u0435\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435! " + price.toLocaleString() + " THB (\u0411\u044b\u043b\u043e " + original.toLocaleString() + " \u0e3f)"
              : "\u7279\u4ef7! " + price.toLocaleString() + " \u6cf0\u94e2 (\u539f\u4ef7 " + original.toLocaleString() + " \u0e3f)";
      }
      return `${tSale}: ${price.toLocaleString()} ${tBaht}`;
    };
    const formatRent = (price: number, original?: number) => {
      if (original && original > price) {
        return lang === "th"
          ? "\u0e14\u0e35\u0e25\u0e14\u0e35! \u0e40\u0e0a\u0e48\u0e32 " + price.toLocaleString() + " \u0e1a\u0e32\u0e17/\u0e40\u0e14\u0e37\u0e2d\u0e19 (\u0e0a\u0e32\u0e01 " + original.toLocaleString() + " \u0e3f)"
          : lang === "en"
            ? "Great Deal! Rent " + price.toLocaleString() + " THB/mo (Was " + original.toLocaleString() + " \u0e3f)"
            : lang === "ru"
              ? "\u041e\u0442\u043b\u0438\u0447\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435! \u0410\u0440\u0435\u043d\u0434\u0430 " + price.toLocaleString() + " THB/mo (\u0411\u044b\u043b\u043e " + original.toLocaleString() + " \u0e3f)"
              : "\u4e18\u9009! \u79df\u91d1 " + price.toLocaleString() + " \u6cf0\u94e2/\u6708 (\u539f\u4ef7 " + original.toLocaleString() + " \u0e3f)";
      }
      return `${tRent}: ${price.toLocaleString()} ${tBaht}${tPerMonth}`;
    };

    // Smart Price Detection (Matches social.ts)
    const actualPrice = propertyData.price || (propertyData.price_per_sqm || 0) * (propertyData.size_sqm || 0);
    const actualRentPrice = propertyData.rental_price || (propertyData.rent_price_per_sqm || 0) * (propertyData.size_sqm || 0);

    if (propertyData.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (actualPrice) parts.push(formatSale(actualPrice, propertyData.original_price || undefined));
      if (actualRentPrice) parts.push(formatRent(actualRentPrice, propertyData.original_rental_price || undefined));
      priceTag = parts.length > 0 ? parts.join("\n") : (lang === "th" ? "ติดต่อสอบถามราคา" : lang === "ru" ? "Цена по запросу" : "Contact for Price");
    } else if (propertyData.listing_type === "RENT") {
      const finalPrice = actualRentPrice || actualPrice;
      priceTag = finalPrice 
        ? formatRent(finalPrice, propertyData.original_rental_price || undefined) 
        : (lang === "th" ? "ติดต่อสอบถามราคาเช่า" : lang === "ru" ? "Цена аренды по запросу" : "Contact for Rent");
    } else {
      const finalPrice = actualPrice || actualRentPrice;
      priceTag = finalPrice 
        ? formatSale(finalPrice, propertyData.original_price || undefined) 
        : (lang === "th" ? "ติดต่อสอบถามราคาขาย" : lang === "ru" ? "Цена продажи по запросу" : "Contact for Sale");
    }

    const link = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
    const primaryAgent = propertyData.property_agents?.[0]?.profiles;

    const amenities = (propertyData as any).property_features?.map((f: any) => `- ${f.features?.name}`).filter(Boolean).join("\n") || "-";
    const nearbyPlaces = (propertyData.nearby_places as any[])?.map((p: any) => `- ${p.name} (${p.distance || ""})`).slice(0, 5).join("\n") || "-";
    const nearbyTransits = (propertyData.nearby_transits as any[])?.map((p: any) => `- ${p.name} (${p.distance || ""})`).join("\n") || "-";

    const detailsSummary = [
      propertyData.bedrooms ? (lang === "th" ? `${propertyData.bedrooms} ห้องนอน` : lang === "en" ? `${propertyData.bedrooms} Bed` : lang === "ru" ? `${propertyData.bedrooms} Спальни` : `${propertyData.bedrooms} 卧室`) : null,
      propertyData.bathrooms ? (lang === "th" ? `${propertyData.bathrooms} ห้องน้ำ` : lang === "en" ? `${propertyData.bathrooms} Bath` : lang === "ru" ? `${propertyData.bathrooms} Ванные` : `${propertyData.bathrooms} 浴室`) : null,
      propertyData.size_sqm ? `${propertyData.size_sqm} ${lang === "th" ? "ตร.ม." : lang === "en" ? "sq.m." : lang === "cn" ? "平米" : lang === "ru" ? "кв.м." : "Sq.m."}` : null,
      propertyData.land_size_sqwah
        ? lang === "th"
          ? `${propertyData.land_size_sqwah} ตร.ว.`
          : lang === "en"
            ? `${propertyData.land_size_sqwah} sq.wah`
            : lang === "cn"
              ? `${propertyData.land_size_sqwah} 哇`
              : lang === "ru"
                ? `${propertyData.land_size_sqwah} кв.ва`
                : `${propertyData.land_size_sqwah} Sq.wah`
        : null,
      propertyData.floor ? (lang === "th" ? `ชั้น ${propertyData.floor}` : lang === "en" ? `Floor ${propertyData.floor}` : lang === "ru" ? `${propertyData.floor} этаж` : `${propertyData.floor} 层`) : null,
      propertyData.parking_slots
        ? lang === "th"
          ? `${propertyData.parking_slots} ที่จอดรถ`
          : lang === "en"
            ? `${propertyData.parking_slots} Parking`
            : lang === "ru"
              ? `${propertyData.parking_slots} Парковка`
              : `${propertyData.parking_slots} 车位`
        : null,
      propertyData.office_capacity
        ? lang === "th"
          ? `ความจุ ${propertyData.office_capacity} คน`
          : lang === "en"
            ? `Capacity ${propertyData.office_capacity} Pax`
            : lang === "ru"
              ? `Вместимость ${propertyData.office_capacity} чел.`
              : `容量 ${propertyData.office_capacity} คน`
        : null,
      propertyData.halls
        ? lang === "th"
          ? `${propertyData.halls} ห้องโถง`
          : lang === "en"
            ? `${propertyData.halls} Hall`
            : lang === "ru"
              ? `${propertyData.halls} Холл`
              : `${propertyData.halls} 大厅`
        : null,
      propertyData.maid_rooms
        ? lang === "th"
          ? `${propertyData.maid_rooms} ห้องแม่บ้าน`
          : lang === "en"
            ? `${propertyData.maid_rooms} Maid Room`
            : lang === "ru"
              ? `${propertyData.maid_rooms} Комната для прислуги`
              : `${propertyData.maid_rooms} 保姆房`
        : null,
    ].filter(Boolean).join(" | ") || "-";

    let projectName = "";
    if (propertyData.project) {
      projectName = getLocaleValue(propertyData.project, "name", lang);
    } else if (propertyData.address_info) {
      const addr = propertyData.address_info as any;
      projectName = addr[lang] || addr["en"] || addr["th"] || "";
    }

    const dynamicValues = {
      priceTag, priceText, originalPriceText, salePrice, rentPrice,
      originalSalePrice, originalRentPrice, detailsSummary, amenities,
      nearbyPlaces, nearbyTransits, link: platform === "INSTAGRAM" ? "" : link, primaryAgent,
      projectName
    };

    dmContent = replaceTemplateTags(dmContent, propertyData, dynamicValues, lang);
    if (publicReply) {
      publicReply = replaceTemplateTags(publicReply, propertyData, dynamicValues, lang);
    }
  } else {
    // Fallback: Remove tags if no property found
    dmContent = dmContent.replace(/{{[a-z_]+}}/g, "");
    if (publicReply) {
      publicReply = publicReply.replace(/{{[a-z_]+}}/g, "");
    }
  }

  // Parse Spintax like {option1|option2} to prevent spam filter detection
  const parseSpintax = (str: string): string => {
    return str.replace(/{([^{}]+)}/g, (match, choicesStr) => {
      const choices = choicesStr.split("|");
      return choices[Math.floor(Math.random() * choices.length)];
    });
  };

  dmContent = parseSpintax(dmContent);
  if (publicReply) {
    publicReply = parseSpintax(publicReply);
  }

  // 5. Send Private Reply (DM)
  let dmRes;
  if (isDirectDM && senderId) {
    if (match.buttons && match.buttons.length > 0) {
      dmRes = await sendMetaMessage(senderId, dmContent, platform, match.buttons);
    } else if (propertyData && platform === "INSTAGRAM") {
      const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
      const buttonTitle = lang === "th" ? "ดูรายละเอียด" : lang === "cn" ? "查看详情" : lang === "ru" ? "Подробнее" : "View Details";
      const contentWithLink = `${dmContent}\n\n${buttonTitle}: ${buttonUrl}`;
      dmRes = await sendMetaMessage(senderId, contentWithLink, platform);
    } else {
      dmRes = await sendMetaMessage(senderId, dmContent, platform);
    }
  } else {
    if (match.buttons && match.buttons.length > 0) {
      dmRes = await sendPrivateReply(commentId, dmContent, platform, undefined, undefined, match.buttons);
    } else if (propertyData && platform === "INSTAGRAM") {
      const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
      const buttonTitle = lang === "th" ? "ดูรายละเอียด" : lang === "cn" ? "查看详情" : lang === "ru" ? "Подробнее" : "View Details";
      dmRes = await sendPrivateReply(commentId, dmContent, platform, buttonUrl, buttonTitle);
      
      // Fallback: If button template fails (e.g. Meta restrictions), send as plain text
      if (!dmRes.success) {
        console.warn(`[Meta Webhook] Button template failed, falling back to plain text DM:`, dmRes.error);
        const fallbackContent = `${dmContent}\n\n${buttonTitle}: ${buttonUrl}`;
        dmRes = await sendPrivateReply(commentId, fallbackContent, platform);
      }
    } else {
      dmRes = await sendPrivateReply(commentId, dmContent, platform);
    }
  }
  if (dmRes.success && senderId) {
    // 6. Media Support (Albums)
    if (propertyData && propertyData.images) {
      const images = Array.isArray(propertyData.images) ? propertyData.images : [];
      if (images.length > 0) {
        const carouselElements = images.slice(0, 10).map((imgUrl: any) => ({
          title: propertyData.title || "Property Photo",
          subtitle: propertyData.description?.substring(0, 80) + "...",
          image_url: imgUrl,
          default_action: {
            type: "web_url",
            url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`,
          },
        }));
        await sendMetaCarousel(senderId, carouselElements, platform);
      }
    }
  } else {
    console.error(`Failed to send private reply for ${platform}:`, dmRes.error);
  }

  // 6. Public Reply (if configured)
  if (publicReply) {
    const commentRes = await replyToMetaComment(commentId, publicReply, platform);
    if (!commentRes.success) {
      console.error(`[Meta Webhook] Failed to reply to comment ${commentId}:`, commentRes.error);
    } else {
      console.log(`[Meta Webhook] Successfully replied to comment ${commentId}`);
    }
  }
}

/**
 * Lookup property details by checking audit logs for post_id mapping
 */
async function lookupPropertyByPostId(postId: string) {
  const supabase = createAdminClient();

  // Search system_audit_logs_v3 for the social_post action with this post_id
  const { data, error } = await supabase
    .from("system_audit_logs_v3")
    .select("entity_id")
    .eq("action", "property.social_post")
    .filter("new_data->>post_id", "eq", postId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.entity_id) return null;

  // Now fetch property details
  const { data: propertyData } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_agents (
        agent_id,
        profiles:identities_v3 (
          full_name:display_name,
          nickname,
          phone,
          line_id
        )
      ),
      property_features (
        features (
          name,
          icon_key
        )
      )
    `,
    )
    .eq("id", data.entity_id)
    .single();

  const property = propertyData as any;

  if (property && property.property_agents) {
    for (const pa of property.property_agents) {
      if (pa.agent_id) {
        const { data: staffProfile } = await supabase
          .from("profiles")
          .select("full_name, nickname, phone, line_id")
          .eq("id", pa.agent_id)
          .maybeSingle();

        if (staffProfile) {
          const profiles = pa.profiles as any;
          pa.profiles = {
            ...profiles,
            full_name: decrypt(profiles?.full_name) || staffProfile.full_name || profiles?.full_name || "",
            nickname: decrypt(profiles?.nickname) || staffProfile.nickname || profiles?.nickname || "",
            phone: decrypt(profiles?.phone) || staffProfile.phone || profiles?.phone || "",
            line_id: decrypt(profiles?.line_id) || staffProfile.line_id || profiles?.line_id || "",
          };
        } else if (pa.profiles) {
          const profiles = pa.profiles as any;
          pa.profiles = {
            ...profiles,
            full_name: decrypt(profiles.full_name) || "",
            nickname: decrypt(profiles.nickname) || "",
            phone: decrypt(profiles.phone) || "",
            line_id: decrypt(profiles.line_id) || "",
          };
        }
      }
    }
  }

  if (property && property.project_id) {
    const { data: proj } = await supabase
      .from("projects")
      .select("name")
      .eq("id", property.project_id)
      .single();
    if (proj) {
      property.project = proj;
    }
  }

  return property;
}

async function checkInstagramFollows(psid: string, token: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v20.0/${psid}?fields=follows_business_page&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.follows_business_page;
  } catch {
    return true; // fallback to true to prevent blocking under dev environments
  }
}
