import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMetaUserProfile,
  fetchFacebookLeadDetails,
  sendPrivateReply,
  replyToMetaComment,
  sendMetaCarousel,
} from "@/lib/meta";
import { saveOmniMessage } from "@/lib/line"; // reuse same util since it's generic enough
import { getSiteSettings } from "@/features/site-settings/actions";
import { SocialKeyword } from "@/features/site-settings/schema";
import { z } from "zod";
import { MetaPlatform, MetaWebhookBody } from "@/types/meta";

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
              await handleMetaMessage(messagingEvent, "FACEBOOK");
            }
          }
        }
        // Handle Feed, Leadgen, Ratings, etc.
        if (entry.changes) {
          for (const change of entry.changes) {
            await handleFacebookChange(change);
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
              await handleMetaMessage(messagingEvent, "INSTAGRAM");
            }
          }
        }
        // Handle comments and mentions
        if (entry.changes) {
          for (const change of entry.changes) {
            await handleInstagramChange(change);
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
                await handleWhatsAppWebhook(
                  message,
                  change.value.contacts?.[0],
                );
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

async function handleFacebookChange(change: any) {
  const { field, value } = change;
  if (!value) return;

  const supabase = createAdminClient();
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

  // 1. Find or Create Lead
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("facebook_psid", senderId)
    .single();

  if (!lead) {
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        full_name: senderName,
        facebook_psid: senderId,
        source: "FACEBOOK",
        stage: "NEW",
        note: `Auto-captured from FB ${field}. Verb: ${value.verb || "N/A"}`,
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
  if (lead) {
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

  const supabase = createAdminClient();

  // 1. Find or Create Lead
  const idField = source === "FACEBOOK" ? "facebook_psid" : "instagram_sid";

  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq(idField, senderId)
    .single();

  if (!lead) {
    const profile = await getMetaUserProfile(senderId, source);

    // Explicitly construct insert object to avoid TS issues with dynamic keys
    const insertData: any = {
      full_name: profile?.name || `${source} Contact`,
      source: source,
      stage: "NEW",
      avatar_url: profile?.profile_pic || null,
      note: `Auto-captured from ${source}. Profile: ${JSON.stringify(profile)}`,
    };
    insertData[idField] = senderId;

    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert(insertData)
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

  // 2. Log Message to Omni-channel
  if (lead) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: source as any,
      external_message_id: event.message.mid,
      content: text,
      payload: event,
      direction: "INCOMING",
    });
  }
}

async function handleInstagramChange(change: any) {
  const { field, value } = change;
  if (!value) return;

  const supabase = createAdminClient();
  let text = "";
  let senderId = "";
  let senderName = "IG User";
  let externalId = value.id;

  if (field === "comments") {
    text = `[IG Comment]: ${value.text}`;
    senderId = value.from?.id;
    senderName = value.from?.username || "IG User";
    const mediaId = value.media?.id || value.media_id;

    // Handle Keyword Automation
    await handleKeywordAutomation(
      value.text,
      externalId,
      "INSTAGRAM",
      mediaId,
      senderId,
    );
  } else if (field === "mentions") {
    text = `[IG Mention]: ${value.text || "Tagged in a post"}`;
    senderId = value.from?.id;
    senderName = value.from?.username || "IG User";
  } else {
    return; // Unsupported field
  }

  if (!senderId) return;

  // 1. Find or Create Lead
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("instagram_sid", senderId)
    .single();

  if (!lead) {
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        full_name: senderName,
        instagram_sid: senderId,
        source: "INSTAGRAM",
        stage: "NEW",
        note: `Auto-captured from IG ${field}.`,
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
  if (lead) {
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

  const supabase = createAdminClient();

  // 1. Find or Create Lead by Phone
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", from)
    .single();

  if (!lead) {
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        full_name: name,
        phone: from,
        source: "WHATSAPP",
        stage: "NEW",
        note: "Auto-captured from WhatsApp Webhook",
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
  if (lead) {
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
function replaceTemplateTags(text: string, propertyData: any, dynamicValues: any, lang: "th" | "en" | "cn" = "th") {
  if (!text) return "";
  let rendered = text;
  const {
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
  } = dynamicValues;

  return rendered
    .replace(/{{title}}/g, (lang === "th" ? propertyData.title : propertyData[`title_${lang}`]) || propertyData.title || "")
    .replace(/{{description}}/g, (lang === "th" ? propertyData.description : propertyData[`description_${lang}`]) || propertyData.description || "")
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
    .replace(/{{floor}}/g, propertyData.floor?.toString() || "-")
    .replace(/{{property_type}}/g, propertyData.property_type || "")
    .replace(
      /{{listing_type}}/g,
      propertyData.listing_type === "SALE"
        ? (lang === "th" ? "ขาย" : "Sale")
        : propertyData.listing_type === "RENT"
          ? (lang === "th" ? "ให้เช่า" : "Rent")
          : (lang === "th" ? "ขาย/เช่า" : "Sale/Rent"),
    )
    .replace(
      /{{location}}/g,
      `${(lang === "th" ? propertyData.district : propertyData[`district_${lang}`]) || propertyData.district || ""} ${(lang === "th" ? propertyData.province : propertyData[`province_${lang}`]) || propertyData.province || ""}`.trim(),
    )
    .replace(/{{popular_area}}/g, (lang === "th" ? propertyData.popular_area : propertyData[`popular_area_${lang}`]) || propertyData.popular_area || "-")
    .replace(/{{amenities}}/g, amenities)
    .replace(/{{nearby_places}}/g, nearbyPlaces)
    .replace(/{{near_transit}}/g, nearbyTransits)
    .replace(
      /{{transit}}/g,
      propertyData.transit_station_name
        ? `${propertyData.transit_station_name} (${propertyData.transit_distance_meters || 0} ม.)`
        : "-",
    )
    .replace(/{{verified}}/g, propertyData.verified ? (lang === "th" ? "✅ ตรวจสอบแล้ว" : "✅ Verified") : "")
    .replace(
      /{{exclusive}}/g,
      propertyData.is_exclusive ? "💎 Exclusive" : "",
    )
    .replace(/{{google_maps}}/g, propertyData.google_maps_link || "")
    .replace(/{{link}}/g, link)
    .replace(/{{price_tag}}/g, priceTag)
    .replace(/{{details}}/g, detailsSummary)
    .replace(/{{agent_name}}/g, primaryAgent?.full_name || "")
    .replace(/{{agent_phone}}/g, primaryAgent?.phone || "")
    .replace(/{{agent_line}}/g, primaryAgent?.line_id || "");
}

/**
 * Detect language of a given text (Thai, Chinese, or English)
 */
function detectLanguage(text: string): "th" | "en" | "cn" {
  if (/[ก-ฮ]/.test(text)) return "th";
  if (/[\u4e00-\u9fa5]/.test(text)) return "cn";
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

  // 1. Fetch dynamic keywords from DB
  const settings = await getSiteSettings();
  const automationKeywords = settings.social_automation_keywords || [];

  if (automationKeywords.length === 0) return;

  const lowerText = text.toLowerCase();

  // 2. Find matching keyword
  const match = automationKeywords.find(
    (k: SocialKeyword) =>
      k.enabled !== false && lowerText.includes(k.keyword.toLowerCase()),
  );

  if (!match) return;

  console.log(
    `🤖 Dynamic keyword matched in ${platform} comment: "${text}" matches "${match.keyword}"`,
  );

  // 3. Property Lookup (Optional - only if we have a postId)
  let propertyData: any = null;
  if (postId) {
    propertyData = await lookupPropertyByPostId(postId);
  }

  // 4. Prepare Message Content
  let dmContent = match.dm_content;
  let publicReply = match.public_reply;

  if (propertyData) {
    const lang = detectLanguage(dmContent);

    // Price logic
    const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : "售价";
    const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : "租金";
    const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : "泰铢";
    const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : "/月";

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
        const pct = Math.round(((original - price) / original) * 100);
        return lang === "th"
          ? `🔥 ลดพิเศษ! ${price.toLocaleString()} บาท (จาก ${original.toLocaleString()} - ลด ${pct}%)`
          : lang === "en"
            ? `🔥 Hot Deal! ${price.toLocaleString()} THB (Was ${original.toLocaleString()} - ${pct}% OFF)`
            : `🔥 特价! ${price.toLocaleString()} 泰铢 (原价 ${original.toLocaleString()} - 优惠 ${pct}%)`;
      }
      return `${tSale}: ${price.toLocaleString()} ${tBaht}`;
    };
    const formatRent = (price: number, original?: number) => {
      if (original && original > price) {
        const pct = Math.round(((original - price) / original) * 100);
        return lang === "th"
          ? `🔥 ดีลดี! เช่า ${price.toLocaleString()} บาท/เดือน (จาก ${original.toLocaleString()} - ลด ${pct}%)`
          : lang === "en"
            ? `🔥 Great Deal! Rent ${price.toLocaleString()} THB/mo (Was ${original.toLocaleString()} - ${pct}% OFF)`
            : `🔥 优选! 租金 ${price.toLocaleString()} 泰铢/月 (原价 ${original.toLocaleString()} - 优惠 ${pct}%)`;
      }
      return `${tRent}: ${price.toLocaleString()} ${tBaht}${tPerMonth}`;
    };

    if (propertyData.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (propertyData.price) parts.push(formatSale(propertyData.price, propertyData.original_price || undefined));
      if (propertyData.rental_price) parts.push(formatRent(propertyData.rental_price, propertyData.original_rental_price || undefined));
      priceTag = parts.join("\n");
    } else if (propertyData.listing_type === "RENT") {
      priceTag = propertyData.rental_price ? formatRent(propertyData.rental_price, propertyData.original_rental_price || undefined) : (lang === "th" ? "ติดต่อสอบถามราคาเช่า" : "Contact for Rent");
    } else {
      priceTag = propertyData.price ? formatSale(propertyData.price, propertyData.original_price || undefined) : (lang === "th" ? "ติดต่อสอบถามราคาขาย" : "Contact for Sale");
    }

    const link = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
    const primaryAgent = propertyData.property_agents?.[0]?.profiles;

    const amenities = (propertyData as any).property_features?.map((f: any) => `- ${f.features?.name}`).filter(Boolean).join("\n") || "-";
    const nearbyPlaces = (propertyData.nearby_places as any[])?.map((p: any) => `- ${p.name} (${p.distance || ""})`).slice(0, 5).join("\n") || "-";
    const nearbyTransits = (propertyData.nearby_transits as any[])?.map((p: any) => `- ${p.name} (${p.distance || ""})`).join("\n") || "-";

    const detailsSummary = [
      propertyData.bedrooms ? (lang === "th" ? `${propertyData.bedrooms} ห้องนอน` : lang === "en" ? `${propertyData.bedrooms} Bed` : `${propertyData.bedrooms} 卧室`) : null,
      propertyData.bathrooms ? (lang === "th" ? `${propertyData.bathrooms} ห้องน้ำ` : lang === "en" ? `${propertyData.bathrooms} Bath` : `${propertyData.bathrooms} 浴室`) : null,
      propertyData.size_sqm ? `${propertyData.size_sqm} ${lang === "th" ? "ตร.ม." : "Sqm"}` : null,
      propertyData.floor ? (lang === "th" ? `ชั้น ${propertyData.floor}` : lang === "en" ? `Floor ${propertyData.floor}` : `${propertyData.floor} 层`) : null,
    ].filter(Boolean).join(" | ") || "-";

    const dynamicValues = {
      priceTag, priceText, originalPriceText, salePrice, rentPrice,
      originalSalePrice, originalRentPrice, detailsSummary, amenities,
      nearbyPlaces, nearbyTransits, link, primaryAgent
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

  // 5. Send Private Reply (DM)
  const dmRes = await sendPrivateReply(commentId, dmContent, platform);

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

    // 6. Public Reply (if configured)
    if (publicReply) {
      await replyToMetaComment(commentId, publicReply);
    }
  } else {
    console.error(`Failed to send private reply for ${platform}:`, dmRes.error);
  }
}

/**
 * Lookup property details by checking audit logs for post_id mapping
 */
async function lookupPropertyByPostId(postId: string) {
  const supabase = createAdminClient();

  // Search audit_logs for the social_post action with this post_id
  const { data, error } = await supabase
    .from("audit_logs")
    .select("entity_id")
    .eq("action", "property.social_post")
    .filter("metadata->>post_id", "eq", postId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.entity_id) return null;

  // Now fetch property details
  const { data: property } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_agents (
        profiles (
          full_name,
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

  return property;
}
