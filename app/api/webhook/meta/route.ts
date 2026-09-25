export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
  sendMetaQuickReplies,
} from "@/lib/meta";
import { saveOmniMessage } from "@/lib/line"; // reuse same util since it's generic enough
import { redis } from "@/lib/redis";
import { getSiteSettings } from "@/features/site-settings/actions";
import { SocialKeyword, SocialButton } from "@/features/site-settings/schema";
import { z } from "zod";
import { MetaPlatform, MetaWebhookBody } from "@/types/meta";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { sendAdminNotification } from "@/lib/telegram";

// ==========================================
// RESILIENCE & CACHE HELPERS
// ==========================================

// In-Memory Feature Flag Cache (TTL 60 seconds)
let cachedAdReferralBotEnabled: boolean | null = null;
let cachedAdReferralBotExpiry = 0;

async function isAdReferralBotEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedAdReferralBotEnabled !== null && now < cachedAdReferralBotExpiry) {
    return cachedAdReferralBotEnabled;
  }
  try {
    const settings = await getSiteSettings();
    // Default to true unless explicitly disabled in settings or env
    const envVal = process.env.ENABLE_AD_REFERRAL_BOT;
    const enabled = envVal !== undefined ? envVal !== "false" : (settings as any).ad_referral_bot_enabled !== false;
    cachedAdReferralBotEnabled = enabled;
    cachedAdReferralBotExpiry = now + 60000; // 60s cache
    return enabled;
  } catch (err) {
    console.warn("[Meta Webhook] Failed to fetch feature flag, falling back to true:", err);
    return true;
  }
}

// In-Memory Rate Limiter Fallback (Used when Redis is down or unavailable)
const inMemoryRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkInMemoryRateLimit(key: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = inMemoryRateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Clean up stale in-memory entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of inMemoryRateLimits.entries()) {
      if (now > val.resetAt) inMemoryRateLimits.delete(key);
    }
  }, 300000);
}

// Safe Redis Wrappers (Fail-Open Strategy)
async function safeRedisGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return (await redis.get(key)) as string | null;
  } catch (err) {
    console.warn(`[Redis Fail-Open] GET error for key ${key}:`, err);
    return null;
  }
}

async function safeRedisSet(key: string, value: string, exSeconds?: number): Promise<boolean> {
  if (!redis) return false;
  try {
    if (exSeconds) {
      await redis.set(key, value, { ex: exSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis Fail-Open] SET error for key ${key}:`, err);
    return false;
  }
}

async function safeRedisIncr(key: string, exSeconds = 60): Promise<number | null> {
  if (!redis) return null;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, exSeconds);
    }
    return count;
  } catch (err) {
    console.warn(`[Redis Fail-Open] INCR error for key ${key}:`, err);
    return null;
  }
}

// Debounced Telegram Alerts for Admin Notice (Throttled to max 1 alert per 5 minutes per sender)
async function sendDebouncedTelegramAlert(text: string, dedupeKey: string, cooldownSec = 300) {
  const alertKey = `tg_alert_cooldown:${dedupeKey}`;
  const isCooldown = await safeRedisGet(alertKey);
  if (isCooldown) return;
  await safeRedisSet(alertKey, "1", cooldownSec);
  try {
    await sendAdminNotification(text);
  } catch (e) {
    console.error("[Meta Webhook] Error sending debounced Telegram notification:", e);
  }
}

// HMAC SHA-256 Signature Verification
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = (metaConfig.appSecret || process.env.META_APP_SECRET || "").trim();
  // If no secret configured in development, allow request but warn
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Meta Webhook Security] META_APP_SECRET is not configured in production! Rejecting request.");
      return false;
    }
    console.warn("[Meta Webhook Security] META_APP_SECRET is not configured. Skipping HMAC verification in non-production.");
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    console.error("[Meta Webhook Security] Missing or malformed x-hub-signature-256 header.");
    return false;
  }

  const expectedSignature = signatureHeader.substring(7); // remove 'sha256='
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const calculatedSignature = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(calculatedSignature, "utf8"),
    );
  } catch (err) {
    return false;
  }
}

/**
 * Interactive Quick Action Buttons for Story Ads / Welcome Flows (Multi-language)
 */
function getStoryAdButtons(lang: "th" | "en" | "cn" | "ru" = "th"): SocialButton[] {
  if (lang === "en") {
    return [
      { title: "📅 Book Viewing", type: "postback", payload: "ACTION_BOOK_VIEWING" },
      { title: "🏠 Available Units", type: "postback", payload: "ACTION_BROWSE_ROOMS" },
      { title: "💬 Chat with Staff", type: "postback", payload: "ACTION_TALK_ADMIN" },
    ];
  }
  if (lang === "cn") {
    return [
      { title: "📅 预约看房", type: "postback", payload: "ACTION_BOOK_VIEWING" },
      { title: "🏠 查看房源", type: "postback", payload: "ACTION_BROWSE_ROOMS" },
      { title: "💬 联系客服", type: "postback", payload: "ACTION_TALK_ADMIN" },
    ];
  }
  if (lang === "ru") {
    return [
      { title: "📅 На просмотр", type: "postback", payload: "ACTION_BOOK_VIEWING" },
      { title: "🏠 Все квартиры", type: "postback", payload: "ACTION_BROWSE_ROOMS" },
      { title: "💬 Менеджер", type: "postback", payload: "ACTION_TALK_ADMIN" },
    ];
  }
  return [
    { title: "📅 นัดดูห้องจริง", type: "postback", payload: "ACTION_BOOK_VIEWING" },
    { title: "🏠 ห้องว่าง/ราคา", type: "postback", payload: "ACTION_BROWSE_ROOMS" },
    { title: "💬 คุยกับแอดมิน", type: "postback", payload: "ACTION_TALK_ADMIN" },
  ];
}

const DEFAULT_STORY_AD_BUTTONS = getStoryAdButtons("th");

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
  const traceId = crypto.randomUUID().slice(0, 8);
  let rawBodyText = "";

  try {
    rawBodyText = await req.text();
  } catch (err) {
    console.error(`[Meta Webhook] [${traceId}] Failed to read request body:`, err);
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  // 1. Verify HMAC SHA-256 Signature
  const signatureHeader = req.headers.get("x-hub-signature-256");
  const isValidSig = verifyMetaSignature(rawBodyText, signatureHeader);
  if (!isValidSig) {
    console.warn(`[Meta Webhook Security] [${traceId}] Signature check failed. Rejecting.`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse and Validate Payload Structure
  let rawBody: any;
  try {
    rawBody = JSON.parse(rawBodyText);
  } catch (err) {
    console.error(`[Meta Webhook] [${traceId}] JSON Parse failed:`, err);
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const validation = MetaWebhookSchema.safeParse(rawBody);
  if (!validation.success) {
    console.error(
      `[Meta Webhook] [${traceId}] Validation Failed:`,
      validation.error.format(),
    );
    return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
  }

  const body = validation.data as MetaWebhookBody;

  // 3. Process events asynchronously without blocking Fast 200 OK
  // In Next.js, processing before returning is safe if operations are lean,
  // but we ensure all internal sub-tasks handle their own errors.
  try {
    if (body.object === "page") {
      for (const entry of body.entry) {
        // Facebook Messenger events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            const senderId = messagingEvent.sender?.id;
            const eventTime = messagingEvent.timestamp || entry.time || Date.now();
            const messageMid = messagingEvent.message?.mid;
            const postbackPayload = messagingEvent.postback?.payload || messagingEvent.message?.quick_reply?.payload;
            const referralRef = messagingEvent.referral?.ref || messagingEvent.postback?.referral?.ref;

            // Generate Composite Idempotency Key
            let dedupKey = "";
            if (messageMid) {
              dedupKey = `meta_dedup:msg:${messageMid}`;
            } else if (referralRef && senderId) {
              dedupKey = `meta_dedup:ref:${senderId}:${referralRef}:${eventTime}`;
            } else if (postbackPayload && senderId) {
              dedupKey = `meta_dedup:pb:${senderId}:${postbackPayload}:${eventTime}`;
            }

            // Deduplication Check (TTL 24 hours = 86400s)
            if (dedupKey) {
              const alreadyProcessed = await safeRedisGet(dedupKey);
              if (alreadyProcessed) {
                console.log(`[Meta Webhook] [${traceId}] Skipping duplicate event: ${dedupKey}`);
                continue;
              }
              await safeRedisSet(dedupKey, "1", 86400);
            }

            // Rate Limiting Check (10 req/min per senderId)
            if (senderId) {
              const rateKey = `meta_rate:${senderId}`;
              const count = await safeRedisIncr(rateKey, 60);
              const allowed = count !== null ? count <= 10 : checkInMemoryRateLimit(rateKey, 10, 60000);
              if (!allowed) {
                console.warn(`[Meta Webhook] [${traceId}] Rate limit exceeded for sender: ${senderId}`);
                continue;
              }
            }

            if ((messagingEvent.message && !messagingEvent.message.is_echo) || messagingEvent.postback || messagingEvent.referral) {
              try {
                await handleMetaMessage(messagingEvent, "FACEBOOK", traceId);
              } catch (err) {
                console.error(`[Meta Webhook] [${traceId}] Error handling Facebook message:`, err);
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
              console.error(`[Meta Webhook] [${traceId}] Error handling Facebook change:`, err);
            }
          }
        }
      }
    }
    // Instagram subscription
    else if (body.object === "instagram") {
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if ((messagingEvent.message && !messagingEvent.message.is_echo) || messagingEvent.postback || messagingEvent.referral) {
              try {
                await handleMetaMessage(messagingEvent, "INSTAGRAM", traceId);
              } catch (err) {
                console.error(`[Meta Webhook] [${traceId}] Error handling Instagram message:`, err);
              }
            }
          }
        }
        if (entry.changes) {
          for (const change of entry.changes) {
            try {
              await handleInstagramChange(change);
            } catch (err) {
              console.error(`[Meta Webhook] [${traceId}] Error handling Instagram change:`, err);
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
                  console.error(`[Meta Webhook] [${traceId}] Error handling WhatsApp change:`, err);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(`[Meta Webhook] [${traceId}] Unhandled internal error:`, err);
    return NextResponse.json({ status: "ok" }); // Return 200 to prevent infinite Meta retry loops
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

  // Deduplicate request using Upstash Redis to prevent double leads from Meta Webhook retries
  if (redis && senderId) {
    const lockKey = `lead_create_lock:${senderId}`;
    const isLocked = await redis.set(lockKey, "1", { nx: true, ex: 5 });
    if (!isLocked) {
      console.warn(`[Meta Webhook] Duplicate lead creation lock hit for sender ${senderId}. Retrying lookup.`);
      // Wait 1 second and re-query
      await new Promise((r) => setTimeout(r, 1000));
      const { data: retryIdentity } = await supabase
        .from("identities_v3")
        .select("id, crm_leads_v3(id)")
        .eq("social_links->>facebook_psid_hash", facebookPsidHash)
        .maybeSingle();
      const retryLead = retryIdentity?.crm_leads_v3?.[0] as { id: string } | undefined;
      if (retryLead) {
        lead = retryLead;
      }
    }
  }

  if (!lead) {
    // Check for duplicate Facebook lead by name
    if (senderName && !PLACEHOLDER_NAMES.includes(senderName)) {
      const normalizedName = senderName.toLowerCase().trim();
      const fullNameHash = generateBlindIndex(normalizedName);
      let { data: existingIdentity } = await supabase
        .from("identities_v3")
        .select("id, social_links, crm_leads_v3(id)")
        .eq("social_links->>full_name_hash", fullNameHash)
        .eq("role", "LEAD")
        .maybeSingle();

      // Fallback: If hash search missed, scan identities directly by decrypting display_name
      if (!existingIdentity) {
        const { data: allLeadIdentities } = await supabase
          .from("identities_v3")
          .select("id, display_name, social_links, crm_leads_v3(id)")
          .eq("role", "LEAD");

        if (allLeadIdentities) {
          const matched = allLeadIdentities.find((i: any) => {
            const decName = (decrypt(i.display_name) || i.display_name || "").toLowerCase().trim();
            return decName === normalizedName;
          });
          if (matched) {
            existingIdentity = matched;
          }
        }
      }

      if (existingIdentity?.crm_leads_v3?.[0]) {
        lead = existingIdentity.crm_leads_v3[0] as { id: string };

        // Bind the new Facebook PSID/LEADGEN ID to the existing identity
        const currentSocialLinks = (existingIdentity.social_links as Record<string, any>) || {};
        const updatedSocialLinks = {
          ...currentSocialLinks,
          full_name_hash: fullNameHash,
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
          full_name_hash: generateBlindIndex(senderName.toLowerCase().trim()),
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

async function handleMetaMessage(event: any, source: MetaPlatform, traceId?: string) {
  const senderId = event.sender?.id; // PSID or IG SID
  const text = event.message?.text || event.postback?.title || "";
  const postbackPayload = event.postback?.payload || event.message?.quick_reply?.payload;
  const isStoryReply = !!event.message?.reply_to?.story || (event.referral?.source === "STORY" || event.referral?.type === "STORY");
  const referralData = event.referral || event.postback?.referral;

  if (!senderId || (!text && !postbackPayload)) return;

  const supabase = createAdminClient() as any;

  // 1. Find or Create Lead with Mutex Lock & Multi-layer Deduplication
  const idField = source === "FACEBOOK" ? "facebook_psid" : "instagram_sid";
  const hashKey = `${idField}_hash`;
  const senderIdHash = generateBlindIndex(senderId);

  // Redis Mutex lock to prevent duplicate leads from concurrent Webhooks
  if (redis) {
    const lockKey = `lead_dedup_lock:${senderIdHash}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 15 });
    if (!acquired) {
      console.log(`[Meta Webhook] Concurrent webhook in flight for ${senderId}. Waiting 300ms...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  const { data: identity } = await supabase
    .from("identities_v3")
    .select("id, display_name, crm_leads_v3(id)")
    .eq(`social_links->>${hashKey}`, senderIdHash)
    .maybeSingle();

  let lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;

  if (!lead) {
    const profile = await getMetaUserProfile(senderId, source);
    const rawDisplayName = (profile?.name || profile?.username || `${source} Contact`).trim();
    const cleanAccountName = rawDisplayName.replace(/^@/, "").trim();

    // Check for duplicate lead by clean display name / username
    let existingLead = null;
    if (cleanAccountName && !PLACEHOLDER_NAMES.includes(cleanAccountName)) {
      const fullNameHash = generateBlindIndex(cleanAccountName.toLowerCase());
      let { data: existingIdentity } = await supabase
        .from("identities_v3")
        .select("id, display_name, social_links, crm_leads_v3(id)")
        .eq("social_links->>full_name_hash", fullNameHash)
        .eq("role", "LEAD")
        .maybeSingle();

      // Fallback: scan identities directly by decrypting display_name
      if (!existingIdentity) {
        const { data: allLeadIdentities } = await supabase
          .from("identities_v3")
          .select("id, display_name, social_links, crm_leads_v3(id)")
          .eq("role", "LEAD")
          .order("created_at", { ascending: false })
          .limit(100);

        if (allLeadIdentities) {
          const matched = allLeadIdentities.find((i: any) => {
            const decName = (decrypt(i.display_name) || i.display_name || "").replace(/^@/, "").trim();
            return decName.toLowerCase() === cleanAccountName.toLowerCase();
          });
          if (matched) {
            existingIdentity = matched;
          }
        }
      }

      if (existingIdentity?.crm_leads_v3?.[0]) {
        existingLead = existingIdentity.crm_leads_v3[0] as { id: string };

        // Bind the new PSID/SID to the existing identity
        const currentSocialLinks = (existingIdentity.social_links as Record<string, any>) || {};
        const updatedSocialLinks = {
          ...currentSocialLinks,
          full_name_hash: fullNameHash,
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
      const encryptedDisplayName = encrypt(cleanAccountName);
      const encryptedSenderId = encrypt(senderId);

      const { data: tenant } = await supabase
        .from("tenants_v3")
        .select("id")
        .limit(1)
        .single();
      const tenantId = tenant?.id || null;

      // Create Identity
      const socialLinks: any = {
        full_name_hash: generateBlindIndex(cleanAccountName.toLowerCase()),
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

      // Prepare Initial UTM Data with Ad Referral details
      const initialUtmData: Record<string, any> = {
        preferences: {
          note: `Auto-captured from ${source}. Profile: ${JSON.stringify(profile)}`
        },
        utm_source: source.toLowerCase(),
        ad_id: referralData?.ad_id || null,
        campaign_id: referralData?.campaign_id || null,
        referral_source: referralData?.source || (isStoryReply ? "STORY" : null),
        referral_type: referralData?.type || null,
        ref: referralData?.ref || null,
      };

      const { data: newLead, error: createError } = await supabase
        .from("crm_leads_v3")
        .insert({
          tenant_id: tenantId,
          identity_id: newIdentity.id,
          status: "ACTIVE",
          stage: "NEW",
          source: source,
          utm_data: initialUtmData,
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

  // 2. Process Message & Lead Intelligence
  if (lead && lead.id) {
    // 2.0 Check Bot Pause (Human Handover Mode - 24 Hours)
    const { data: leadRow } = await supabase
      .from("crm_leads_v3")
      .select("id, utm_data")
      .eq("id", lead.id)
      .single();

    const currentUtmData = (leadRow?.utm_data as Record<string, any>) || {};
    const currentPrefs = (currentUtmData.preferences as Record<string, any>) || {};

    if (currentPrefs.bot_paused === true) {
      const isUnpauseCmd = text === "/bot on" || text === "/startbot" || text === "เปิดบอท" || text === "resume bot";
      const pausedAtTime = currentPrefs.bot_paused_at ? new Date(currentPrefs.bot_paused_at).getTime() : 0;
      const isExpired = Date.now() - pausedAtTime > 24 * 60 * 60 * 1000; // 24 hours expiry

      if (isUnpauseCmd || isExpired) {
        const updatedPrefs: Record<string, any> = { ...currentPrefs, bot_paused: false };
        delete updatedPrefs.bot_paused_at;
        await supabase.from("crm_leads_v3").update({
          utm_data: { ...currentUtmData, preferences: updatedPrefs }
        }).eq("id", lead.id);

        if (isUnpauseCmd) {
          await sendMetaMessage(senderId, "เปิดการทำงานของระบบตอบกลับอัตโนมัติเรียบร้อยค่ะ 🤖✨", source);
          return;
        }
      } else {
        console.log(`[Meta Webhook] Bot is PAUSED for lead ${lead.id} (Human Handover mode).`);
        // Debounced notification to Telegram if customer is waiting
        await sendDebouncedTelegramAlert(
          `💬 <b>[CRM Reminder] ลูกค้าทักข้อความเข้ามาขณะโหมดพักบอท</b>\n\n` +
          `👤 Lead ID: <code>${lead.id}</code>\n` +
          `📱 แพลตฟอร์ม: ${source}\n` +
          `💬 ข้อความ: <i>${(text || "คลิกปุ่ม/แอด").substring(0, 100)}</i>\n` +
          `👉 เจ้าหน้าที่กรุณาเข้าดูแลลูกค้า`,
          `bot_paused_notice_${lead.id}`,
          300
        );
        return;
      }
    }

    // 2.0.1 Race Condition Guard: If admin sent an outgoing message within the last 3 minutes, pause bot temporarily
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: recentAdminMessage } = await supabase
      .from("omni_messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("direction", "OUTGOING")
      .gte("created_at", threeMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (recentAdminMessage) {
      console.log(`[Meta Webhook] [${traceId}] Admin was active within last 3 minutes for lead ${lead.id}. Pausing bot to prevent race condition.`);
      await sendDebouncedTelegramAlert(
        `💬 <b>[CRM Active Admin] ลูกค้าตอบกลับในแชทที่แอดมินเพิ่งสนทนา</b>\n\n` +
        `👤 Lead ID: <code>${lead.id}</code>\n` +
        `📱 แพลตฟอร์ม: ${source}\n` +
        `💬 ข้อความลูกค้า: <i>${(text || "").substring(0, 100)}</i>`,
        `admin_active_guard_${lead.id}`,
        180
      );
      return;
    }

    // 2.1 Update Ad Referral data if new details received
    if (referralData && (referralData.ad_id || referralData.campaign_id || referralData.ref)) {
      const updatedUtmData = {
        ...currentUtmData,
        ad_id: referralData.ad_id || currentUtmData.ad_id,
        campaign_id: referralData.campaign_id || currentUtmData.campaign_id,
        referral_source: referralData.source || currentUtmData.referral_source,
        referral_type: referralData.type || currentUtmData.referral_type,
        ref: referralData.ref || currentUtmData.ref,
      };
      await supabase.from("crm_leads_v3").update({
        utm_data: updatedUtmData,
      }).eq("id", lead.id);
    }

    // 2.2 Log Message to Omni-channel
    await saveOmniMessage({
      lead_id: lead.id,
      source: source as any,
      external_message_id: event.message?.mid || `postback_${Date.now()}`,
      content: text || (postbackPayload ? `[Clicked Button: ${postbackPayload}]` : ""),
      payload: event,
      direction: "INCOMING",
    });

    // 2.2.1 Handle Ad Carousel Property Referral Flow (m.me/?ref=...)
    const isBotEnabled = await isAdReferralBotEnabled();
    if (isBotEnabled && referralData?.ref) {
      console.log(`[Meta Webhook] [${traceId}] Detected Ad Referral ref "${referralData.ref}" for sender ${senderId}. Triggering Property Flow.`);
      await handlePropertyReferralFlow(
        senderId,
        source,
        lead.id,
        referralData.ref,
        referralData.ad_id,
        traceId,
      );
      return;
    }

    // 2.3 Handle Postback / Quick Reply Button Clicks
    if (postbackPayload) {
      await handleMetaPostback(postbackPayload, senderId, source, lead.id);
      return;
    }

    // 2.4 Lead Capture Gate Check
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

    // 2.5 Direct DM / Story Reply Automation Trigger
    const settings = await getSiteSettings();
    let handled = false;

    if (settings.direct_dm_reply_enabled || isStoryReply) {
      handled = await handleKeywordAutomation(
        text,
        event.message?.mid || `dm_${Date.now()}`,
        source,
        undefined,
        senderId,
      );
    }

    // 2.6 Fallback: Story Ads Welcome Flow or Smart AI Property Assistant
    const detectedLang = detectLanguage(text || "");
    if (!handled && (isStoryReply || settings.direct_dm_reply_enabled)) {
      const isGreetingOrAdInquiry =
        isStoryReply ||
        text.length < 6 ||
        text.includes("สนใจ") ||
        text.includes("ว่างไหม") ||
        text.includes("ขอดูห้อง") ||
        text.toLowerCase().includes("available") ||
        text.toLowerCase().includes("hello") ||
        text.toLowerCase().includes("hi") ||
        text.toLowerCase().includes("price") ||
        text.toLowerCase().includes("rent") ||
        text.toLowerCase().includes("pm");

      if (isGreetingOrAdInquiry) {
        await sendStoryAdWelcomeFlow(senderId, source, lead.id, detectedLang);
      } else {
        // Handle conversational inquiries with AI Assistant
        const aiHandled = await handleAiPropertyAssistant(text, senderId, source, undefined, lead.id, detectedLang);
        if (!aiHandled) {
          await sendStoryAdWelcomeFlow(senderId, source, lead.id, detectedLang);
        }
      }
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

  // Deduplicate request using Upstash Redis to prevent double leads from Meta Webhook retries
  if (redis && senderId) {
    const lockKey = `lead_create_lock:${senderId}`;
    const isLocked = await redis.set(lockKey, "1", { nx: true, ex: 5 });
    if (!isLocked) {
      console.warn(`[Meta Webhook] Duplicate Instagram lead creation lock hit for sender ${senderId}. Retrying lookup.`);
      // Wait 1 second and re-query
      await new Promise((r) => setTimeout(r, 1000));
      const { data: retryIdentity } = await supabase
        .from("identities_v3")
        .select("id, crm_leads_v3(id)")
        .eq("social_links->>instagram_sid_hash", instagramSidHash)
        .maybeSingle();
      const retryLead = retryIdentity?.crm_leads_v3?.[0] as { id: string } | undefined;
      if (retryLead) {
        lead = retryLead;
      }
    }
  }

  if (!lead) {
    // Check for duplicate Instagram lead by username/name
    if (senderName && !PLACEHOLDER_NAMES.includes(senderName)) {
      const fullNameHash = generateBlindIndex(senderName.toLowerCase().trim());
      const { data: existingIdentity } = await supabase
        .from("identities_v3")
        .select("id, social_links, crm_leads_v3(id)")
        .eq("social_links->>full_name_hash", fullNameHash)
        .eq("role", "LEAD")
        .maybeSingle();

      if (existingIdentity?.crm_leads_v3?.[0]) {
        lead = existingIdentity.crm_leads_v3[0] as { id: string };

        // Bind the new Instagram SID to the existing identity
        const currentSocialLinks = (existingIdentity.social_links as Record<string, any>) || {};
        const updatedSocialLinks = {
          ...currentSocialLinks,
          instagram_sid_hash: instagramSidHash,
          instagram_sid: encrypt(senderId),
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
          full_name_hash: generateBlindIndex(senderName.toLowerCase().trim()),
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
  cleanResult = cleanResult.replace(/\?\s*([💰🔑💵💸🔥🔴🟢🔵🟡🏷️🔄📢🏠🏡✨⚡⭐🌟📌📍👇])/g, "$1");
  cleanResult = cleanResult.replace(/\?\s*(\[.*?\])/g, "$1");
  cleanResult = cleanResult.replace(/\?\s*([a-zA-Z0-9\u0e00-\u0e7f]+)\s*:/g, "$1:");
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
): Promise<boolean> {
  if (!text || !commentId) return false;

  // Deduplicate request using Upstash Redis to prevent double sends from Meta Webhook retries
  if (redis) {
    const redisKey = `meta_webhook_dedup:${commentId}`;
    const isLocked = await redis.set(redisKey, "1", { nx: true, ex: 10 }); // Lock for 10 seconds
    if (!isLocked) {
      console.warn(`[Meta Webhook] Duplicate request detected for comment ${commentId}. Ignoring.`);
      return false;
    }
  }

  // 1. Fetch dynamic keywords from DB
  const settings = await getSiteSettings();
  const automationKeywords = settings.social_automation_keywords || [];

  if (automationKeywords.length === 0) return false;

  const lowerText = text.toLowerCase();

  // 2. Find matching keyword (respects linked_post_id if set)
  const match = automationKeywords.find(
    (k: SocialKeyword) =>
      k.enabled !== false &&
      lowerText.includes(k.keyword.toLowerCase()) &&
      // If keyword is pinned to a specific post, only match that post's comments
      (!k.linked_post_id || k.linked_post_id === postId),
  );

  if (!match) return false;

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
        return true;
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
        return true;
      }
    }
  }

  // 3. Property Lookup (Optional - only if we have a postId)
  let propertyData: any = null;
  if (postId) {
    propertyData = await lookupPropertyByPostId(postId);
  }

  // 4. Prepare Message Content
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
    // 3.1 Check if property is sold / rented (Sold/Rented Fallback)
    const isSoldOrRented =
      propertyData.status === "SOLD" ||
      propertyData.status === "RENTED" ||
      propertyData.is_available === false;

    if (isSoldOrRented) {
      const soldNotice = lang === "th"
        ? "ห้องนี้มีผู้ทำสัญญาเช่า/ซื้อเรียบร้อยแล้วค่ะ ✨ แต่เรายังมีห้องว่างตำแหน่งสวยในโครงการเดียวกันหรือทำเลใกล้เคียง แอดมินขอแนะนำห้องด้านล่างนี้นะคะ 👇"
        : "This property has been rented/sold! ✨ However, we have other available units in the same project/location below for you 👇";

      if (isDirectDM && senderId) {
        await sendMetaMessage(senderId, soldNotice, platform, DEFAULT_STORY_AD_BUTTONS);
        await sendAlternativePropertiesCarousel(senderId, platform, propertyData.project_id, propertyData.id);
      } else {
        await sendPrivateReply(commentId, soldNotice, platform, undefined, undefined, DEFAULT_STORY_AD_BUTTONS);
        if (senderId) {
          await sendAlternativePropertiesCarousel(senderId, platform, propertyData.project_id, propertyData.id);
        }
      }
      return true;
    }

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
        return "💰 " + (lang === "th"
          ? "ลดพิเศษ! " + price.toLocaleString() + " บาท (จาก " + original.toLocaleString() + " ฿)"
          : lang === "en"
            ? "Hot Deal! " + price.toLocaleString() + " THB (Was " + original.toLocaleString() + " ฿)"
            : lang === "ru"
              ? "Горячее предложение! " + price.toLocaleString() + " THB (Было " + original.toLocaleString() + " ฿)"
              : "特价! " + price.toLocaleString() + " 泰铢 (原价 " + original.toLocaleString() + " ฿)");
      }
      return `💰 ${tSale}: ${price.toLocaleString()} ${tBaht}`;
    };
    const formatRent = (price: number, original?: number) => {
      if (original && original > price) {
        return "💸 " + (lang === "th"
          ? "ดีลดลดดี! เช่า " + price.toLocaleString() + " บาท/เดือน (จาก " + original.toLocaleString() + " ฿)"
          : lang === "en"
            ? "Great Deal! Rent " + price.toLocaleString() + " THB/mo (Was " + original.toLocaleString() + " ฿)"
            : lang === "ru"
              ? "Отличное предложение! Аренда " + price.toLocaleString() + " THB/mo (Было " + original.toLocaleString() + " ฿)"
              : "优选! 租金 " + price.toLocaleString() + " 泰铢/月 (原价 " + original.toLocaleString() + " ฿)");
      }
      return `💸 ${tRent}: ${price.toLocaleString()} ${tBaht}${tPerMonth}`;
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
    // Fallback: Remove tags and sanitize text when no specific property is found
    dmContent = dmContent.replace(/{{[a-z_]+}}/g, "");
    dmContent = sanitizeTemplateOutput(dmContent);
    if (publicReply) {
      publicReply = publicReply.replace(/{{[a-z_]+}}/g, "");
      publicReply = sanitizeTemplateOutput(publicReply);
    }
  }

  // Parse Spintax like {option1|option2} to prevent spam filter detection
  const parseSpintax = (str: string): string => {
    return str.replace(/{([^{}]+)}/g, (match, choicesStr) => {
      const choices = choicesStr.split("|");
      return choices[Math.floor(Math.random() * choices.length)];
    });
  };

  // Final sanitation for hidden characters / broken question marks
  const finalizeSanitation = (str: string): string => {
    if (!str) return "";
    let cleaned = str.replace(/[\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, "");
    cleaned = cleaned.replace(/\?\s*([💰🔑💵💸🔥🔴🟢🔵🟡🏷️🔄📢🏠🏡✨⚡⭐🌟📌📍👇])/g, "$1");
    cleaned = cleaned.replace(/\?\s*([a-zA-Z0-9\u0e00-\u0e7f]+)\s*:/g, "$1:");
    cleaned = cleaned.replace(/\?\s*(\[.*?\])/g, "$1");
    cleaned = cleaned.replace(/\?\s*(เช่า|ขาย|Rent|Sale|เช่า\/ขาย|Rent\/Sale|Price|ราคา)/gi, "$1");
    return sanitizeTemplateOutput(cleaned);
  };

  dmContent = finalizeSanitation(parseSpintax(dmContent));
  if (publicReply) {
    publicReply = finalizeSanitation(parseSpintax(publicReply));
  }

  // Fallback to default greeting if message became empty after cleaning
  if (!dmContent.trim()) {
    dmContent = settings.story_ads_welcome_message || "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨\nยินดีให้บริการค่ะ ต้องการสอบถามข้อมูลห้อง นัดชมสถานที่จริง หรือพูดคุยกับทีมงาน เลือกรายการด้านล่างได้เลยน้าาา 💕";
  }

  // Resolve Buttons to attach
  const buttonsToAttach: SocialButton[] = (match.buttons && match.buttons.length > 0)
    ? match.buttons
    : (settings.story_ads_buttons_enabled !== false ? DEFAULT_STORY_AD_BUTTONS : []);

  // 5. Send Private Reply (DM)
  let dmRes;
  if (isDirectDM && senderId) {
    if (buttonsToAttach.length > 0) {
      dmRes = await sendMetaMessage(senderId, dmContent, platform, buttonsToAttach);
    } else if (propertyData && (platform === "INSTAGRAM" || platform === "FACEBOOK")) {
      const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
      const buttonTitle = lang === "th" ? "ดูรายละเอียด" : lang === "cn" ? "查看详情" : lang === "ru" ? "Подробнее" : "View Details";
      const contentWithLink = `${dmContent}\n\n${buttonTitle}: ${buttonUrl}`;
      dmRes = await sendMetaMessage(senderId, contentWithLink, platform);
    } else {
      dmRes = await sendMetaMessage(senderId, dmContent, platform);
    }
  } else {
    if (buttonsToAttach.length > 0) {
      dmRes = await sendPrivateReply(commentId, dmContent, platform, undefined, undefined, buttonsToAttach);
    } else if (propertyData && (platform === "INSTAGRAM" || platform === "FACEBOOK")) {
      const buttonUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/properties/${propertyData.slug || propertyData.id}`;
      const buttonTitle = lang === "th" ? "ดูรายละเอียด" : lang === "cn" ? "查看详情" : lang === "ru" ? "Подробнее" : "View Details";
      dmRes = await sendPrivateReply(commentId, dmContent, platform, buttonUrl, buttonTitle);
      
      // Fallback: If button template fails, send as plain text
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
    // 6. Media Support (Albums or Featured Properties Carousel)
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
    } else if (!propertyData && settings.auto_featured_carousel_enabled !== false) {
      // If no specific property was linked, send Featured Properties Carousel
      await sendFeaturedPropertiesCarousel(senderId, platform);
    }
  } else {
    console.error(`Failed to send private reply for ${platform}:`, dmRes.error);
  }

  // 7. Public Reply (if configured)
  if (publicReply) {
    const commentRes = await replyToMetaComment(commentId, publicReply, platform);
    if (!commentRes.success) {
      console.error(`[Meta Webhook] Failed to reply to comment ${commentId}:`, commentRes.error);
    } else {
      console.log(`[Meta Webhook] Successfully replied to comment ${commentId}`);
    }
  }

  return true;
}

/**
 * Clean up lonely emojis, empty brackets, and multiple blank lines
 */
function sanitizeTemplateOutput(text: string): string {
  if (!text) return "";
  return text
    // 1. Remove empty brackets
    .replace(/\[\s*\]/g, "")
    .replace(/\(\s*\)/g, "")
    // 2. Remove lines that only contain emojis or punctuation without text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // keep paragraph spacing
      return /[a-zA-Z0-9\u0E00-\u0E7F]/.test(trimmed);
    })
    .join("\n")
    // 3. Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Handle Story Ads & Direct Message Welcome Flow (Multi-language)
 */
async function sendStoryAdWelcomeFlow(
  senderId: string,
  platform: MetaPlatform,
  leadId?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  const settings = await getSiteSettings();
  let welcomeText = "";
  if (lang === "en") {
    welcomeText = settings.story_ads_welcome_message_en ||
      "Hello! Thank you for reaching out ✨\nWe're delighted to assist you. Would you like to schedule a viewing, check available units, or chat with our team? Please choose an option below 💕";
  } else if (lang === "cn") {
    welcomeText = settings.story_ads_welcome_message_cn ||
      "您好！感谢您的咨询 ✨\n很高兴为您服务。如果您想预约看房、查看最新房源或与客服交谈，请选择下方选项 💕";
  } else if (lang === "ru") {
    welcomeText = settings.story_ads_welcome_message_ru ||
      "Здравствуйте! Спасибо за обращение ✨\nБудем рады помочь! Выберите нужный пункт ниже: запись на просмотр, свободные варианты или связь с менеджером 💕";
  } else {
    welcomeText = settings.story_ads_welcome_message ||
      "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨\nยินดีให้บริการค่ะ ต้องการสอบถามข้อมูลห้อง นัดชมสถานที่จริง หรือพูดคุยกับทีมงาน เลือกรายการด้านล่างได้เลยน้าาา 💕";
  }

  let buttons: SocialButton[] = [];
  if (settings.story_ads_buttons_enabled !== false) {
    if (settings.story_ads_custom_buttons && settings.story_ads_custom_buttons.length > 0) {
      buttons = settings.story_ads_custom_buttons.slice(0, 3);
    } else {
      buttons = getStoryAdButtons(lang);
    }
  }

  const res = await sendMetaMessage(senderId, welcomeText, platform, buttons.length > 0 ? buttons : undefined);

  if (res.success && settings.auto_featured_carousel_enabled !== false) {
    await sendFeaturedPropertiesCarousel(senderId, platform, lang);
  }
}

/**
 * Send Featured Properties Carousel Card to FB / Instagram DM (Multi-language)
 */
async function sendFeaturedPropertiesCarousel(
  senderId: string,
  platform: MetaPlatform,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  try {
    const supabase = createAdminClient() as any;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    const { data: properties, error } = await supabase
      .from("properties")
      .select(`
        id,
        slug,
        title,
        price,
        rental_price,
        listing_type,
        images,
        bedrooms,
        bathrooms,
        size_sqm,
        address_info,
        project:projects(name)
      `)
      .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"])
      .order("is_featured", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !properties || properties.length === 0) {
      console.warn("[Meta Webhook] No active properties found for featured carousel:", error);
      return;
    }

    const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : lang === "ru" ? "Продажа" : "售";
    const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : lang === "ru" ? "Аренда" : "租";
    const tBed = lang === "th" ? "นอน" : lang === "en" ? "bed" : lang === "ru" ? "спальни" : "卧";
    const tSqm = lang === "th" ? "ตร.ม." : "sqm";
    const tViewBtn = lang === "th" ? "ดูรายละเอียดห้อง" : lang === "en" ? "View Details" : lang === "cn" ? "查看详情" : "Подробнее";
    const tBookBtn = lang === "th" ? "นัดดูห้องนี้" : lang === "en" ? "Book Viewing" : lang === "cn" ? "预约看房" : "На просмотр";

    const carouselElements = properties.map((prop: any) => {
      const images = Array.isArray(prop.images) ? prop.images : [];
      const imageUrl = images[0] || `${siteUrl}/images/property-placeholder.jpg`;

      let priceSubtitle = "";
      if (prop.listing_type === "SALE_AND_RENT") {
        const parts = [];
        if (prop.price) parts.push(`${tSale} ฿${prop.price.toLocaleString()}`);
        if (prop.rental_price) parts.push(`${tRent} ฿${prop.rental_price.toLocaleString()}/mo`);
        priceSubtitle = parts.join(" | ");
      } else if (prop.listing_type === "RENT") {
        priceSubtitle = prop.rental_price ? `${tRent} ฿${prop.rental_price.toLocaleString()}/mo` : `${tRent} (Inquire)`;
      } else {
        priceSubtitle = prop.price ? `${tSale} ฿${prop.price.toLocaleString()}` : `${tSale} (Inquire)`;
      }

      const projectName = prop.project?.name || prop.address_info?.th || "";
      const sizeInfo = prop.size_sqm ? ` • ${prop.size_sqm} ${tSqm}` : "";
      const bedInfo = prop.bedrooms ? ` • ${prop.bedrooms} ${tBed}` : "";
      const subtitle = `${priceSubtitle}\n${projectName}${bedInfo}${sizeInfo}`.trim();
      const propUrl = `${siteUrl}/properties/${prop.slug || prop.id}`;

      return {
        title: (prop.title || "Featured Unit").substring(0, 80),
        subtitle: subtitle.substring(0, 80),
        image_url: imageUrl,
        default_action: {
          type: "web_url",
          url: propUrl,
        },
        buttons: [
          {
            type: "web_url",
            url: propUrl,
            title: tViewBtn,
          },
          {
            type: "postback",
            title: tBookBtn,
            payload: `ACTION_BOOK_PROPERTY_${prop.id}`,
          }
        ],
      };
    });

    await sendMetaCarousel(senderId, carouselElements, platform);
  } catch (err) {
    console.error("[Meta Webhook] Error sending featured properties carousel:", err);
  }
}

/**
 * Handle Postback Actions (Button clicks in Messenger / Instagram DM)
 */
async function handleMetaPostback(
  payload: string,
  senderId: string,
  source: MetaPlatform,
  leadId?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const contactPhone = settings.contact_phone || "02-xxx-xxxx";
  const lineId = settings.line_id || "vccasset";

  if (payload === "ACTION_BOOK_VIEWING" || payload.startsWith("ACTION_BOOK_PROPERTY_")) {
    const propertyId = payload.startsWith("ACTION_BOOK_PROPERTY_") ? payload.replace("ACTION_BOOK_PROPERTY_", "") : null;
    const bookingUrl = propertyId ? `${siteUrl}/properties/${propertyId}?book=true` : `${siteUrl}/contact?purpose=viewing`;

    let replyText = "ยินดีเลยค่ะ! 📅 สามารถเลือกวันและเวลาที่สะดวกนัดชมห้องจริงได้ผ่านลิงก์ด้านล่างนี้ หรือแจ้งวัน/เวลาที่สะดวกไว้ในแชทนี้ได้เลยนะคะ เดี๋ยวแอดมินประสานงานเตรียมเปิดห้องให้ทันทีค่ะ ✨";
    let btnBookTitle = "📅 นัดวัน-เวลาดูห้อง";
    let btnAdminTitle = "💬 คุยกับแอดมิน";

    if (lang === "en") {
      replyText = "We'd love to show you the property! 📅 Please pick your preferred date and time via the link below, or let us know your availability here in the chat ✨";
      btnBookTitle = "📅 Pick Date & Time";
      btnAdminTitle = "💬 Chat with Staff";
    } else if (lang === "cn") {
      replyText = "很高兴为您安排看房！📅 您可以通过下方链接选择方便的时间，或直接在聊天中告诉我们您的空闲时间 ✨";
      btnBookTitle = "📅 选择看房时间";
      btnAdminTitle = "💬 联系客服";
    }

    await sendMetaMessage(senderId, replyText, source, [
      {
        title: btnBookTitle,
        type: "web_url",
        url: bookingUrl,
      },
      {
        title: btnAdminTitle,
        type: "postback",
        payload: "ACTION_TALK_ADMIN",
      }
    ]);

    // Send Telegram Notification to agents
    try {
      await sendAdminNotification(
        `📅 <b>[Lead Alert] ลูกค้าขอนัดดูห้องจริง (${source})</b>\n\n` +
        `👤 Lead ID: <code>${leadId || "New"}</code>\n` +
        `📱 แพลตฟอร์ม: ${source}\n` +
        (propertyId ? `🏠 ทรัพย์ที่สนใจ: <code>${propertyId}</code>\n` : "") +
        `👉 กรุณาติดตามและติดต่อกลับโดยเร็วที่สุด`
      );
    } catch (e) {
      console.error("[Meta Webhook] Error sending telegram notification:", e);
    }
  } else if (payload === "ACTION_BROWSE_ROOMS") {
    let browseText = "แอดมินรวบรวมรายการห้องว่างและดีลสุดพิเศษมาให้ชมด้านล่างนี้ค่ะ 👇 สนใจห้องไหนคลิกดูรูปและรายละเอียดเพิ่มเติมได้เลยนะคะ ✨";
    if (lang === "en") {
      browseText = "Here are our featured available properties and special deals 👇 Click to view photos and full details ✨";
    } else if (lang === "cn") {
      browseText = "这里是我们的精选房源与最新优惠 👇 点击查看照片与详细信息 ✨";
    }
    await sendMetaMessage(senderId, browseText, source);
    await sendFeaturedPropertiesCarousel(senderId, source, lang);
  } else if (payload === "ACTION_TALK_ADMIN") {
    let contactText = `รับทราบเลยค่ะ! 😊 แอดมินและเจ้าหน้าที่กำลังเตรียมข้อมูลเพื่อดูแลคุณโดยตรงนะคะ\n\n💬 ช่องทางติดต่อด่วน:\n📱 โทร: ${contactPhone}\n🟢 LINE: @${lineId.replace(/^@/, "")}\n\nหรือพิมพ์ข้อความทิ้งไว้ในแชทนี้ได้เลยนะคะ ✨`;
    let btnLineTitle = "🟢 แอด LINE สอบถาม";

    if (lang === "en") {
      contactText = `Got it! 😊 Our property consultant is getting ready to assist you.\n\n💬 Direct Contacts:\n📱 Phone: ${contactPhone}\n🟢 LINE: @${lineId.replace(/^@/, "")}\n\nOr simply leave your message right here! ✨`;
      btnLineTitle = "🟢 Chat on LINE";
    } else if (lang === "cn") {
      contactText = `收到！😊 我们的专业客服正在为您准备资料。\n\n💬 快捷联系方式：\n📱 电话：${contactPhone}\n🟢 LINE：@${lineId.replace(/^@/, "")}\n\n您也可以直接在此留言！✨`;
      btnLineTitle = "🟢 添加 LINE 咨询";
    }
    
    // Pause bot for 24h so human staff can talk without bot interruptions
    if (leadId) {
      const supabase = createAdminClient() as any;
      const { data: leadRow } = await supabase
        .from("crm_leads_v3")
        .select("utm_data")
        .eq("id", leadId)
        .single();
      const currentUtmData = (leadRow?.utm_data as Record<string, any>) || {};
      const currentPrefs = (currentUtmData.preferences as Record<string, any>) || {};
      await supabase
        .from("crm_leads_v3")
        .update({
          utm_data: {
            ...currentUtmData,
            preferences: {
              ...currentPrefs,
              bot_paused: true,
              bot_paused_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", leadId);
    }

    const buttons: SocialButton[] = [];
    if (settings.line_url || lineId) {
      buttons.push({
        title: btnLineTitle,
        type: "web_url",
        url: settings.line_url || `https://line.me/R/ti/p/@${lineId.replace(/^@/, "")}`,
      });
    }

    await sendMetaMessage(senderId, contactText, source, buttons.length > 0 ? buttons : undefined);

    // Send Urgent Telegram Notification to agents
    try {
      await sendAdminNotification(
        `🚨 <b>[CRM Urgent] ลูกค้าต้องการคุยกับแอดมิน/เจ้าหน้าที่</b>\n\n` +
        `👤 Lead ID: <code>${leadId || "New"}</code>\n` +
        `📱 แพลตฟอร์ม: ${source}\n` +
        `👉 เข้าตรวจสอบกล่องข้อความ ${source} และดูแลลูกค้าได้ทันที!`
      );
    } catch (e) {
      console.error("[Meta Webhook] Error sending telegram notification:", e);
    }
  } else if (payload.startsWith("PROP_LANG_")) {
    // Handling language selection for Ad Referral Card: PROP_LANG_<LANG>_<PROPERTY_REF>
    // Example: PROP_LANG_en_prop-1 or PROP_LANG_th_chalong-villa
    const parts = payload.replace("PROP_LANG_", "").split("_");
    const selectedLang = (parts[0] || "th") as "th" | "en" | "cn" | "ru";
    const propertyRef = parts.slice(1).join("_"); // handle refs that may contain underscores
    await handlePropertyLanguageSelection(senderId, source, leadId, selectedLang, propertyRef);
  } else if (payload.startsWith("START_QUESTIONNAIRE_") || payload.startsWith("Q_ANS_")) {
    await handleSmartMatchQuestionnaire(senderId, source, leadId, payload);
  }
}

/**
 * Smart Match Questionnaire: Interactive 3-step requirement intake
 * State stored in Redis with 15-minute TTL.
 * Budget answers stored separately in client_budget_range (never overwriting ad click price).
 * HOT Lead Alert bypasses any previous sender cooldowns.
 * Relaxed search fallback ensures carousel is never empty.
 */
async function handleSmartMatchQuestionnaire(
  senderId: string,
  source: MetaPlatform,
  leadId: string | undefined,
  payload: string,
) {
  const stateKey = `questionnaire_state:${senderId}`;

  // Parse action from payload
  if (payload.startsWith("START_QUESTIONNAIRE_")) {
    const lang = (payload.replace("START_QUESTIONNAIRE_", "") || "th") as "th" | "en" | "cn" | "ru";
    // Initialize state (15 min TTL)
    await safeRedisSet(
      stateKey,
      JSON.stringify({ step: "budget", lang, answers: {} }),
      900 // 15 mins
    );

    // Question 1: Budget
    const settings = await getSiteSettings();
    const q1Text =
      lang === "en"
        ? "To help us find your ideal home, what is your preferred monthly budget? 💰"
        : lang === "cn"
        ? "为了帮您找到最合适的房源，请问您的月预算大概是多少？💰"
        : lang === "ru"
        ? "Чтобы подобрать идеальный вариант, укажите ваш примерный бюджет в месяц: 💰"
        : "เพื่อให้ทีมงานคัดสรรวิลล่าที่ตรงใจที่สุด รบกวนแจ้งงบประมาณต่อเดือนที่ต้องการค่ะ 💰";

    // Dynamic budget options from Site Settings (or safe defaults)
    const customBudgetOpts = settings.questionnaire_budget_options;
    const defaultBudgetReplies = [
      { content_type: "text" as const, title: "< ฿100k/mo", payload: `Q_ANS_BUDGET_idx_0` },
      { content_type: "text" as const, title: "฿100k - ฿200k", payload: `Q_ANS_BUDGET_idx_1` },
      { content_type: "text" as const, title: "฿200k - ฿350k", payload: `Q_ANS_BUDGET_idx_2` },
      { content_type: "text" as const, title: "> ฿350k/mo", payload: `Q_ANS_BUDGET_idx_3` },
    ];

    const budgetReplies = customBudgetOpts && customBudgetOpts.length > 0
      ? customBudgetOpts.slice(0, 8).map((opt, idx) => ({
          content_type: "text" as const,
          title: opt.label.substring(0, 20),
          payload: `Q_ANS_BUDGET_idx_${idx}`,
        }))
      : defaultBudgetReplies;

    await sendMetaQuickReplies(senderId, q1Text, budgetReplies, source);
    return;
  }

  // Retrieve existing state
  const rawState = await safeRedisGet(stateKey);
  let state: { step: string; lang: "th" | "en" | "cn" | "ru"; answers: Record<string, string> } = {
    step: "budget",
    lang: "th",
    answers: {},
  };

  if (rawState) {
    try {
      state = JSON.parse(rawState);
    } catch (e) {
      // fallback
    }
  }

  const lang = state.lang || "th";
  const settings = await getSiteSettings();

  // Answer 1 -> Proceed to Question 2 (Location / Zone)
  if (payload.startsWith("Q_ANS_BUDGET_")) {
    const budgetVal = payload.replace("Q_ANS_BUDGET_", "");
    state.answers.budget = budgetVal;
    state.step = "zone";
    await safeRedisSet(stateKey, JSON.stringify(state), 900);

    const q2Text =
      lang === "en"
        ? "Great! Which location in Phuket do you prefer? 📍"
        : lang === "cn"
        ? "很好！请问您喜欢普吉岛的哪个区域呢？📍"
        : lang === "ru"
        ? "Отлично! В каком районе Пхукета вы предпочитаете жить? 📍"
        : "รับทราบค่ะ! ชอบทำเลโซนไหนในภูเก็ตเป็นพิเศษคะ? 📍";

    // Dynamic zone options from Site Settings (or safe defaults)
    const customZoneOpts = settings.questionnaire_zone_options;
    const defaultZoneReplies = [
      { content_type: "text" as const, title: "ฉลอง / ราไวย์ (Chalong)", payload: `Q_ANS_ZONE_idx_0` },
      { content_type: "text" as const, title: "บางเทา (Bangtao)", payload: `Q_ANS_ZONE_idx_1` },
      { content_type: "text" as const, title: "กะทู้ (Kathu)", payload: `Q_ANS_ZONE_idx_2` },
      { content_type: "text" as const, title: "โซนไหนก็ได้ (Any)", payload: `Q_ANS_ZONE_idx_any` },
    ];

    const zoneReplies = customZoneOpts && customZoneOpts.length > 0
      ? [
          ...customZoneOpts.slice(0, 7).map((z, idx) => ({
            content_type: "text" as const,
            title: z.label.substring(0, 20),
            payload: `Q_ANS_ZONE_idx_${idx}`,
          })),
          { content_type: "text" as const, title: "ทุกโซน (Any Zone)", payload: `Q_ANS_ZONE_idx_any` },
        ]
      : defaultZoneReplies;

    await sendMetaQuickReplies(senderId, q2Text, zoneReplies, source);
    return;
  }

  // Answer 2 -> Proceed to Question 3 (Bedrooms)
  if (payload.startsWith("Q_ANS_ZONE_")) {
    const zoneVal = payload.replace("Q_ANS_ZONE_", "");
    state.answers.zone = zoneVal;
    state.step = "bedrooms";
    await safeRedisSet(stateKey, JSON.stringify(state), 900);

    const q3Text =
      lang === "en"
        ? "Almost done! How many bedrooms are you looking for? 🛏️"
        : lang === "cn"
        ? "最后一步！请问您需要几间卧室？🛏️"
        : lang === "ru"
        ? "И последнее! Сколько спален вам необходимо? 🛏️"
        : "ข้อสุดท้ายค่ะ ต้องการวิลล่าขนาดกี่ห้องนอนดีคะ? 🛏️";

    const bedReplies = [
      { content_type: "text" as const, title: "1 - 2 ห้องนอน (Beds)", payload: `Q_ANS_BEDS_1-2` },
      { content_type: "text" as const, title: "3 ห้องนอน (Beds)", payload: `Q_ANS_BEDS_3` },
      { content_type: "text" as const, title: "4+ ห้องนอน (Beds)", payload: `Q_ANS_BEDS_4+` },
    ];

    await sendMetaQuickReplies(senderId, q3Text, bedReplies, source);
    return;
  }

  // Answer 3 -> Finish questionnaire & Deliver results + HOT Alert
  if (payload.startsWith("Q_ANS_BEDS_")) {
    const bedsVal = payload.replace("Q_ANS_BEDS_", "");
    state.answers.bedrooms = bedsVal;

    // Resolve labels and min/max values from Site Settings or defaults
    const customBudgetOpts = settings.questionnaire_budget_options || [];
    const customZoneOpts = settings.questionnaire_zone_options || [];

    let displayBudgetLabel = state.answers.budget || "N/A";
    let minBudget: number | null = null;
    let maxBudget: number | null = null;

    if (state.answers.budget && state.answers.budget.startsWith("idx_")) {
      const bIdx = parseInt(state.answers.budget.replace("idx_", ""), 10);
      if (customBudgetOpts[bIdx]) {
        displayBudgetLabel = customBudgetOpts[bIdx].label;
        minBudget = customBudgetOpts[bIdx].min_price ?? null;
        maxBudget = customBudgetOpts[bIdx].max_price ?? null;
      } else {
        // Fallback default mapping
        const defaultMap = [
          { label: "< ฿100k/mo", max: 100000 },
          { label: "฿100k - ฿200k", min: 100000, max: 200000 },
          { label: "฿200k - ฿350k", min: 200000, max: 350000 },
          { label: "> ฿350k/mo", min: 350000 },
        ];
        if (defaultMap[bIdx]) {
          displayBudgetLabel = defaultMap[bIdx].label;
          minBudget = (defaultMap[bIdx] as any).min ?? null;
          maxBudget = (defaultMap[bIdx] as any).max ?? null;
        }
      }
    }

    let displayZoneLabel = "Any Zone";
    let targetZoneKeywords: string[] = [];

    if (!state.answers.zone || state.answers.zone === "idx_any" || state.answers.zone === "Any") {
      displayZoneLabel = "Any Zone (ทุกโซน)";
      targetZoneKeywords = [];
    } else if (state.answers.zone.startsWith("idx_")) {
      const zIdx = parseInt(state.answers.zone.replace("idx_", ""), 10);
      if (customZoneOpts[zIdx]) {
        displayZoneLabel = customZoneOpts[zIdx].label;
        targetZoneKeywords = customZoneOpts[zIdx].keywords || [customZoneOpts[zIdx].label];
      } else {
        // Fallback default zones
        const defaultZones = [
          { label: "ฉลอง / ราไวย์ (Chalong)", kws: ["Chalong", "Rawai", "ฉลอง", "ราไวย์"] },
          { label: "บางเทา (Bangtao)", kws: ["Bangtao", "Cherngtalay", "บางเทา", "เชิงทะเล"] },
          { label: "กะทู้ (Kathu)", kws: ["Kathu", "Phuket Town", "กะทู้", "เมืองภูเก็ต"] },
        ];
        if (defaultZones[zIdx]) {
          displayZoneLabel = defaultZones[zIdx].label;
          targetZoneKeywords = defaultZones[zIdx].kws;
        }
      }
    }

    // 1. Data Separation: Save actual client requirements in Lead profile
    const supabase = createAdminClient() as any;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    if (leadId) {
      try {
        const { data: leadRow } = await supabase
          .from("crm_leads_v3")
          .select("utm_data")
          .eq("id", leadId)
          .single();

        const currentUtm = (leadRow?.utm_data as Record<string, any>) || {};
        const currentPrefs = (currentUtm.preferences as Record<string, any>) || {};

        await supabase
          .from("crm_leads_v3")
          .update({
            utm_data: {
              ...currentUtm,
              preferences: {
                ...currentPrefs,
                client_budget_range: displayBudgetLabel,
                preferred_zone: displayZoneLabel,
                preferred_bedrooms: state.answers.bedrooms,
                requirements_captured_at: new Date().toISOString(),
                requirements_source: "Smart Match Questionnaire",
              },
            },
          })
          .eq("id", leadId);
      } catch (err) {
        console.warn("[Meta Webhook] Error updating questionnaire preferences in Lead:", err);
      }
    }

    // 2. Clear questionnaire state
    if (redis) {
      try {
        await redis.del(stateKey);
      } catch (e) {
        // fail-open
      }
    }

    // 3. HOT Lead Alert (BYPASS per-sender cooldown! Sent immediately to Telegram)
    const leadCrmUrl = `${siteUrl}/protected/admin/leads`;
    try {
      await sendAdminNotification(
        `🔥 <b>[HOT LEAD ALERT] ลูกค้าตอบ Requirement ครบแล้ว!</b>\n\n` +
        `👤 Lead ID: <code>${leadId || "New"}</code>\n` +
        `📱 แพลตฟอร์ม: ${source}\n` +
        `🌐 ภาษา: <b>${lang.toUpperCase()}</b>\n` +
        `💰 <b>งบประมาณที่ลูกค้าแจ้งจริง:</b> <code>${displayBudgetLabel}</code>\n` +
        `📍 <b>โซนที่สนใจ:</b> <code>${displayZoneLabel}</code>\n` +
        `🛏️ <b>จำนวนห้องนอน:</b> <code>${state.answers.bedrooms}</code>\n\n` +
        `👉 <a href="${leadCrmUrl}">กดเปิดจัดการ Lead ในระบบ CRM ทันที</a>`
      );
    } catch (e) {
      console.error("[Meta Webhook] Error sending HOT Lead Telegram Alert:", e);
    }

    // 4. Multi-tier Query with Budget preservation (Never send mismatched budget or empty carousel)
    // Tier 1 Query: Filter by Status + Budget Range + Specific Zone
    let tier1Query = supabase
      .from("properties")
      .select(`
        id,
        slug,
        title,
        title_en,
        title_cn,
        title_ru,
        price,
        original_price,
        rental_price,
        original_rental_price,
        listing_type,
        images,
        bedrooms,
        bathrooms,
        size_sqm,
        status,
        address_info,
        project:projects(name)
      `)
      .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"]);

    // Budget filter: check rental_price -> original_rental_price (rent) and price -> original_price (sale)
    // Uses AND-grouped ranges inside OR to prevent cross-column false matches
    // Pattern matches the proven export-action.ts price filter
    const budgetOrParts: string[] = [];
    if (minBudget !== null || maxBudget !== null) {
      const min = minBudget ?? 0;
      // Rental price columns
      if (maxBudget !== null) {
        budgetOrParts.push(`and(rental_price.gte.${min},rental_price.lte.${maxBudget})`);
        budgetOrParts.push(`and(rental_price.is.null,original_rental_price.gte.${min},original_rental_price.lte.${maxBudget})`);
        // Sale price columns
        budgetOrParts.push(`and(price.gte.${min},price.lte.${maxBudget})`);
        budgetOrParts.push(`and(price.is.null,original_price.gte.${min},original_price.lte.${maxBudget})`);
      } else {
        // No max — open-ended
        budgetOrParts.push(`rental_price.gte.${min}`);
        budgetOrParts.push(`and(rental_price.is.null,original_rental_price.gte.${min})`);
        budgetOrParts.push(`price.gte.${min}`);
        budgetOrParts.push(`and(price.is.null,original_price.gte.${min})`);
      }
    }

    // Bedrooms filter: map questionnaire answer to query condition
    const bedsAnswer = state.answers.bedrooms;
    if (bedsAnswer === "1-2") {
      tier1Query = tier1Query.gte("bedrooms", 1).lte("bedrooms", 2);
    } else if (bedsAnswer === "3") {
      tier1Query = tier1Query.eq("bedrooms", 3);
    } else if (bedsAnswer === "4+") {
      tier1Query = tier1Query.gte("bedrooms", 4);
    }

    // Zone keyword filter for address_info JSONB
    const zoneOrParts: string[] = [];
    if (targetZoneKeywords.length > 0) {
      targetZoneKeywords.forEach((kw) => {
        // Sanitize: strip PostgREST reserved chars that break .or() syntax
        const safeKw = kw.replace(/[(),."\\]/g, "").trim();
        if (safeKw) {
          zoneOrParts.push(`address_info->>th.ilike.%${safeKw}%`);
          zoneOrParts.push(`address_info->>en.ilike.%${safeKw}%`);
        }
      });
    }

    // Apply budget + zone as a single .or() call to avoid Supabase double-.or() overwrite
    // Logic: (any budget match) AND (any zone match) — combined via nested and()
    if (budgetOrParts.length > 0 && zoneOrParts.length > 0) {
      // Wrap each group: and(or(budget_conditions),or(zone_conditions))
      tier1Query = tier1Query.or(
        `and(or(${budgetOrParts.join(",")}),or(${zoneOrParts.join(",")}))`
      );
    } else if (budgetOrParts.length > 0) {
      tier1Query = tier1Query.or(budgetOrParts.join(","));
    } else if (zoneOrParts.length > 0) {
      tier1Query = tier1Query.or(zoneOrParts.join(","));
    }

    let { data: matchedProps } = await tier1Query.limit(5);
    let matchType: "exact" | "relaxed_zone" | "featured_fallback" = "exact";

    // Tier 2 Fallback: If no units in selected zone, relax zone but KEEP THE BUDGET FILTER!
    if (!matchedProps || matchedProps.length === 0) {
      if (targetZoneKeywords.length > 0) {
        console.log(`[Meta Webhook] No units found in selected zone ${state.answers.zone} within budget. Relaxing zone while preserving budget.`);
        let tier2Query = supabase
          .from("properties")
          .select(`
            id,
            slug,
            title,
            title_en,
            title_cn,
            title_ru,
            price,
            original_price,
            rental_price,
            original_rental_price,
            listing_type,
            images,
            bedrooms,
            bathrooms,
            size_sqm,
            status,
            address_info,
            project:projects(name)
          `)
          .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"]);

        if (budgetOrParts.length > 0) {
          tier2Query = tier2Query.or(budgetOrParts.join(","));
        }

        // Keep bedrooms filter in Tier 2 (only zone is relaxed)
        if (bedsAnswer === "1-2") {
          tier2Query = tier2Query.gte("bedrooms", 1).lte("bedrooms", 2);
        } else if (bedsAnswer === "3") {
          tier2Query = tier2Query.eq("bedrooms", 3);
        } else if (bedsAnswer === "4+") {
          tier2Query = tier2Query.gte("bedrooms", 4);
        }

        const { data: budgetProps } = await tier2Query.limit(5);
        if (budgetProps && budgetProps.length > 0) {
          matchedProps = budgetProps;
          matchType = "relaxed_zone";
        }
      }
    }

    // Tier 3 Ultimate Fallback: If still no units within budget, fallback to Top Featured units
    // (Be 100% honest with customer that these are top featured recommendations)
    if (!matchedProps || matchedProps.length === 0) {
      console.log(`[Meta Webhook] No units matched budget or zone. Falling back to Featured properties.`);
      const { data: featuredProps } = await supabase
        .from("properties")
        .select(`
          id,
          slug,
          title,
          title_en,
          title_cn,
          title_ru,
          price,
          original_price,
          rental_price,
          original_rental_price,
          listing_type,
          images,
          bedrooms,
          bathrooms,
          size_sqm,
          status,
          address_info,
          project:projects(name)
        `)
        .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"])
        .order("is_featured", { ascending: false, nullsFirst: false })
        .limit(5);

      matchedProps = featuredProps || [];
      matchType = "featured_fallback";
    }

    // Send context-aware completion message reflecting the ACTUAL result
    let completionMsg = "";
    if (matchType === "exact") {
      completionMsg =
        lang === "en"
          ? `Thank you! 😊 We found properties matching your budget and location preferences (${state.answers.budget}, ${state.answers.bedrooms} beds). Take a look below:`
          : lang === "cn"
          ? `非常感谢！😊 我们为您找到了符合预算与地段要求的精选房源（${state.answers.budget}，${state.answers.bedrooms}卧）。请查看下方推荐：`
          : lang === "ru"
          ? `Спасибо! 😊 Мы подобрали виллы по вашему бюджету и району (${state.answers.budget}, ${state.answers.bedrooms} сп.). Посмотрите варианты ниже:`
          : `ขอบคุณสำหรับข้อมูลค่ะ! 😊 ระบบคัดสรรวิลล่าที่ตรงกับงบประมาณและทำเลที่คุณเลือกมาให้ชมด้านล่างนี้นะคะ 👇`;
    } else if (matchType === "relaxed_zone") {
      completionMsg =
        lang === "en"
          ? `Thank you! 😊 Currently there are no available units in your chosen zone within ${state.answers.budget}. However, here are great options in other prime areas fitting your budget:`
          : lang === "cn"
          ? `非常感谢！😊 您所选区域当前在 ${state.answers.budget} 预算内暂无空房。为您推荐其他优质地段、符合该预算的房源：`
          : lang === "ru"
          ? `Спасибо! 😊 В выбранном районе сейчас нет свободных вилл в бюджете ${state.answers.budget}. Предлагаем отличные варианты в других популярных районах в вашем бюджете:`
          : `ขอบคุณค่ะ! 😊 ในโซนที่คุณเลือกขณะนี้ยังไม่มีห้องว่างในช่วงงบ ${state.answers.budget} พอดี แอดมินจึงคัดสรรวิลล่าในทำเลเด่นอื่นที่อยู่ในงบของคุณมาให้ชมแทนนะคะ 👇`;
    } else {
      completionMsg =
        lang === "en"
          ? `Thank you! 😊 Our property consultant has received your specific requirements (${state.answers.budget}, ${state.answers.zone}) and will search our offline network for you shortly.\n\nMeanwhile, here are our most popular featured villas in Phuket:`
          : lang === "cn"
          ? `非常感谢！😊 我们的专业顾问已收到您的定制找房要求（${state.answers.budget}，${state.answers.zone}），并将尽快为您跟进。\n\n在此期间，为您推荐普吉岛目前最受欢迎的精选房源：`
          : lang === "ru"
          ? `Спасибо! 😊 Наш консультант получил ваши параметры (${state.answers.budget}, ${state.answers.zone}) и скоро свяжется с вами.\n\nА пока предлагаем взглянуть на самые популярные виллы на Пхукете:`
          : `ขอบคุณสำหรับข้อมูลค่ะ! 😊 ทีมงานได้รับเงื่อนไขเฉพาะของคุณลูกค้าเรียบร้อยแล้วค่ะ และกำลังประสานงานค้นหาห้องที่ตรงใจให้อย่างเร่งด่วนนะคะ\n\nระหว่างนี้ขอแนะนำวิลล่าไฮไลท์ยอดนิยมของภูเก็ตมาให้ชมด้านล่างนี้ค่ะ 👇`;
    }

    await sendMetaMessage(senderId, completionMsg, source);

    if (matchedProps && matchedProps.length > 0) {
      const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : lang === "ru" ? "Продажа" : "售";
      const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : lang === "ru" ? "Аренда" : "租";
      const tBed = lang === "th" ? "นอน" : lang === "en" ? "bed" : lang === "ru" ? "спальни" : "卧";
      const tSqm = lang === "th" ? "ตร.ม." : "sqm";
      const tViewBtn = lang === "th" ? "ดูรายละเอียด" : lang === "en" ? "View Details" : lang === "cn" ? "查看详情" : "Подробнее";
      const tBookBtn = lang === "th" ? "นัดดูหลังนี้" : lang === "en" ? "Book Viewing" : lang === "cn" ? "预约看房" : "На просмотр";

      const carouselCards = matchedProps.map((p: any) => {
        const images = Array.isArray(p.images) ? p.images : [];
        const imageUrl = images[0] || `${siteUrl}/images/property-placeholder.jpg`;
        const propUrl = `${siteUrl}/properties/${p.slug || p.id}`;

        const rPrice = p.rental_price || p.original_rental_price;
        const sPrice = p.price || p.original_price;
        let priceText = rPrice ? `${tRent} ฿${rPrice.toLocaleString()}/mo` : sPrice ? `${tSale} ฿${sPrice.toLocaleString()}` : "";
        const bedText = p.bedrooms ? ` • ${p.bedrooms} ${tBed}` : "";
        const sizeText = p.size_sqm ? ` • ${p.size_sqm} ${tSqm}` : "";

        let pTitle = p.title || "Featured Unit";
        if (lang === "en" && p.title_en) pTitle = p.title_en;
        else if (lang === "cn" && (p.title_cn || p.title_en)) pTitle = p.title_cn || p.title_en;
        else if (lang === "ru" && (p.title_ru || p.title_en)) pTitle = p.title_ru || p.title_en;

        return {
          title: pTitle.substring(0, 80),
          subtitle: `${priceText}${bedText}${sizeText}`.substring(0, 80),
          image_url: imageUrl,
          default_action: { type: "web_url", url: propUrl },
          buttons: [
            { type: "web_url", url: propUrl, title: tViewBtn },
            { type: "postback", title: tBookBtn, payload: `ACTION_BOOK_PROPERTY_${p.id}` },
          ],
        };
      });

      await sendMetaCarousel(senderId, carouselCards, source);
    }
  }
}

/**
 * Handle Property Language Selection: saves preference, loads property, and delivers the card
 */
async function handlePropertyLanguageSelection(
  senderId: string,
  source: MetaPlatform,
  leadId: string | undefined,
  lang: "th" | "en" | "cn" | "ru",
  propertyRef?: string,
) {
  const supabase = createAdminClient() as any;

  // 1. Save language preference permanently in Identity
  if (leadId) {
    try {
      const { data: leadRow } = await supabase
        .from("crm_leads_v3")
        .select("identity_id")
        .eq("id", leadId)
        .single();

      if (leadRow?.identity_id) {
        const { data: idRow } = await supabase
          .from("identities_v3")
          .select("social_links")
          .eq("id", leadRow.identity_id)
          .single();

        const currentLinks = (idRow?.social_links as Record<string, any>) || {};
        await supabase
          .from("identities_v3")
          .update({
            social_links: {
              ...currentLinks,
              preferred_lang: lang,
            },
          })
          .eq("id", leadRow.identity_id);
      }
    } catch (e) {
      console.warn("[Meta Webhook] Error updating language preference:", e);
    }
  }

  // 2. Resolve Property Ref (from argument or Redis fallback)
  let refCode = propertyRef;
  if (!refCode) {
    const cachedRef = await safeRedisGet(`lead_ad_ref:${senderId}`);
    if (cachedRef) {
      try {
        const parsed = JSON.parse(cachedRef);
        refCode = parsed.ref;
      } catch (e) {
        refCode = cachedRef;
      }
    }
  }

  if (!refCode) {
    // TTL Expired or missing ref -> Send friendly welcome fallback + featured carousel
    const fallbackText =
      lang === "en"
        ? "Welcome! 😊 Are you interested in any particular villa or location? Here are some of our popular options:"
        : lang === "cn"
        ? "欢迎！😊 请问您对哪栋别墅或地段感兴趣呢？以下是我们的热门房源推荐："
        : lang === "ru"
        ? "Добро пожаловать! 😊 Вас интересует конкретная вилла или локация? Вот наши популярные варианты:"
        : "ยินดีต้อนรับค่ะ 😊 สนใจวิลล่าโซนไหนหรือหลังใดเป็นพิเศษไหมคะ? แอดมินรวบรวมทรัพย์ยอดนิยมมาให้ชมด้านล่างนี้ค่ะ:";

    await sendMetaMessage(senderId, fallbackText, source);
    await sendFeaturedPropertiesCarousel(senderId, source, lang);
    return;
  }

  // 3. Deliver the requested property card
  await sendSinglePropertyCard(senderId, source, refCode, lang);
}

/**
 * Handle Inbound Property Referral Flow (Triggered by ad m.me/?ref=... click)
 */
async function handlePropertyReferralFlow(
  senderId: string,
  source: MetaPlatform,
  leadId: string,
  rawRef: string,
  adId?: string,
  traceId?: string,
) {
  // Validate ref format: alphanumeric, underscore, hyphen, dot up to 250 chars
  const sanitizedRef = rawRef.trim().substring(0, 250);
  if (!/^[a-zA-Z0-9_\-\.]{1,250}$/.test(sanitizedRef)) {
    console.warn(`[Meta Webhook] [${traceId}] Invalid ref parameter format: "${rawRef}"`);
    return;
  }

  // Store in Redis with TTL 2 Hours (Overwrite any older ref)
  const statePayload = JSON.stringify({
    ref: sanitizedRef,
    adId: adId || null,
    timestamp: Date.now(),
  });
  await safeRedisSet(`lead_ad_ref:${senderId}`, statePayload, 7200);

  const supabase = createAdminClient() as any;

  // Multi-touch Analytics Logging: Cap ad_click_history to 20 items in lead utm_data
  try {
    const { data: leadRow } = await supabase
      .from("crm_leads_v3")
      .select("utm_data")
      .eq("id", leadId)
      .single();

    const currentUtmData = (leadRow?.utm_data as Record<string, any>) || {};
    const existingHistory = Array.isArray(currentUtmData.ad_click_history)
      ? currentUtmData.ad_click_history
      : [];

    const newHistory = [
      {
        ref: sanitizedRef,
        ad_id: adId || null,
        source,
        clicked_at: new Date().toISOString(),
      },
      ...existingHistory,
    ].slice(0, 20); // Cap at 20 items

    await supabase
      .from("crm_leads_v3")
      .update({
        utm_data: {
          ...currentUtmData,
          ref: sanitizedRef,
          ad_id: adId || currentUtmData.ad_id,
          ad_click_history: newHistory,
        },
      })
      .eq("id", leadId);
  } catch (err) {
    console.warn(`[Meta Webhook] [${traceId}] Failed to update ad_click_history:`, err);
  }

  // Check if User already has a preferred language remembered
  let rememberedLang: "th" | "en" | "cn" | "ru" | null = null;
  try {
    const { data: leadRow } = await supabase
      .from("crm_leads_v3")
      .select("identity_id")
      .eq("id", leadId)
      .single();

    if (leadRow?.identity_id) {
      const { data: idRow } = await supabase
        .from("identities_v3")
        .select("social_links")
        .eq("id", leadRow.identity_id)
        .single();

      const pref = idRow?.social_links?.preferred_lang;
      if (pref === "th" || pref === "en" || pref === "cn" || pref === "ru") {
        rememberedLang = pref;
      }
    }
  } catch (e) {
    // Non-blocking
  }

  // If language is already known, immediately send the property card in that language!
  if (rememberedLang) {
    console.log(`[Meta Webhook] [${traceId}] User ${senderId} has remembered language "${rememberedLang}". Sending card directly.`);
    await sendSinglePropertyCard(senderId, source, sanitizedRef, rememberedLang);
    return;
  }

  // Otherwise, prompt user with Language Selection Quick Replies
  const promptText =
    "Welcome to VC Connect Asset! ✨\nยินดีต้อนรับค่ะ กรุณาเลือกภาษาที่ต้องการรับข้อมูล / Please select your preferred language:";

  const quickReplies = [
    {
      content_type: "text" as const,
      title: "🇹🇭 ภาษาไทย",
      payload: `PROP_LANG_th_${sanitizedRef}`,
    },
    {
      content_type: "text" as const,
      title: "🇬🇧 English",
      payload: `PROP_LANG_en_${sanitizedRef}`,
    },
    {
      content_type: "text" as const,
      title: "🇷🇺 Русский",
      payload: `PROP_LANG_ru_${sanitizedRef}`,
    },
    {
      content_type: "text" as const,
      title: "🇨🇳 中文",
      payload: `PROP_LANG_cn_${sanitizedRef}`,
    },
  ];

  await sendMetaQuickReplies(senderId, promptText, quickReplies, source);
}

/**
 * Fetch and send a single property card with Lean Select, Transient 503 Retry,
 * Typo Normalization, and 2-Tier Language Fallback (Target -> English -> Thai)
 */
async function sendSinglePropertyCard(
  senderId: string,
  platform: MetaPlatform,
  rawRef: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  const supabase = createAdminClient() as any;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Normalization candidates (e.g. "prop_1" vs "prop-1")
  const candidates = [
    rawRef,
    rawRef.replace(/_/g, "-"),
    rawRef.replace(/-/g, "_"),
    rawRef.toLowerCase(),
  ];
  const uniqueCandidates = Array.from(new Set(candidates));

  // Query property with retry logic for transient 503 / network errors
  let property: any = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Try matching slug or id with candidates
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          slug,
          title,
          price,
          rental_price,
          listing_type,
          images,
          bedrooms,
          bathrooms,
          size_sqm,
          status,
          address_info,
          project:projects(name)
        `)
        .or(uniqueCandidates.map((c) => `slug.eq.${c},id.eq.${c}`).join(","))
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        property = data;
        break;
      }
      if (error && attempt < maxRetries) {
        console.warn(`[Meta Webhook] PostgREST query retry attempt ${attempt}:`, error.message);
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
    }
  }

  // 1. Fallback Case: Property Not Found (Possible Admin Typo in Ads Manager)
  if (!property) {
    console.warn(`[Meta Webhook Warning] Property ref "${rawRef}" not found in database! Checked: ${uniqueCandidates.join(", ")}`);
    const notFoundText =
      lang === "en"
        ? "Thank you for your interest! ✨ The specific unit you clicked seems to be updating. Here are our top featured properties:"
        : lang === "cn"
        ? "感谢您的咨询！✨ 您所点击的房源信息正在更新中。以下是我们的精选推荐："
        : lang === "ru"
        ? "Спасибо за интерес! ✨ Информация по этой вилле обновляется. Предлагаем посмотреть наши популярные варианты:"
        : "ขอบคุณที่สนใจนะคะ ✨ ทรัพย์ที่คุณลูกค้ากดเข้ามา ระบบกำลังอัปเดตข้อมูลพอดีค่ะ แอดมินขอแนะนำรายการทรัพย์ยอดนิยมด้านล่างนี้นะคะ:";

    await sendMetaMessage(senderId, notFoundText, platform);
    await sendFeaturedPropertiesCarousel(senderId, platform, lang);
    return;
  }

  // 2. Fallback Case: Property Found but Sold/Rented or Inactive
  const isActive = ["AVAILABLE", "ACTIVE", "PUBLISHED"].includes(property.status);
  if (!isActive) {
    const soldText =
      lang === "en"
        ? "Thank you for your interest! 🏡 This particular villa has recently been booked. However, we have very similar options nearby you might love:"
        : lang === "cn"
        ? "感谢您的咨询！🏡 这套房源近期已被预订。不过我们在附近有非常相似的优质房源推荐："
        : lang === "ru"
        ? "Спасибо за интерес! 🏡 Эта вилла недавно была забронирована. Но у нас есть очень похожие отличные варианты поблизости:"
        : "ขอบคุณที่สนใจนะคะ 🏡 ทรัพย์หลังนี้เพิ่งมีผู้เช่า/ผู้จองไปเมื่อเร็วๆ นี้ค่ะ แต่เรายังมีตัวเลือกทำเลใกล้เคียงที่สวยและคุ้มค่าแนะนำดังนี้ค่ะ:";

    await sendMetaMessage(senderId, soldText, platform);
    await sendAlternativePropertiesCarousel(senderId, platform, property.project_id, property.id, lang);
    return;
  }

  // 3. Success Case: Format Single Property Card
  const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : lang === "ru" ? "Продажа" : "售";
  const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : lang === "ru" ? "Аренда" : "租";
  const tBed = lang === "th" ? "นอน" : lang === "en" ? "bed" : lang === "ru" ? "спальни" : "卧";
  const tSqm = lang === "th" ? "ตร.ม." : "sqm";
  const tViewBtn = lang === "th" ? "ดูรายละเอียดห้อง" : lang === "en" ? "View Details" : lang === "cn" ? "查看详情" : "Подробнее";
  const tBookBtn = lang === "th" ? "นัดดูห้องนี้" : lang === "en" ? "Book Viewing" : lang === "cn" ? "预约看房" : "На просмотр";

  // Lean Image Resolution (Use Direct CDN URL)
  const images = Array.isArray(property.images) ? property.images : [];
  const imageUrl = images[0] || `${siteUrl}/images/property-placeholder.jpg`;

  let priceSubtitle = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.price) parts.push(`${tSale} ฿${property.price.toLocaleString()}`);
    if (property.rental_price) parts.push(`${tRent} ฿${property.rental_price.toLocaleString()}/mo`);
    priceSubtitle = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    priceSubtitle = property.rental_price ? `${tRent} ฿${property.rental_price.toLocaleString()}/mo` : `${tRent} (Inquire)`;
  } else {
    priceSubtitle = property.price ? `${tSale} ฿${property.price.toLocaleString()}` : `${tSale} (Inquire)`;
  }

  // 2-Tier Language Fallback for Title
  // 1) Target Lang -> 2) English -> 3) Default (Thai)
  let title = property.title || "Featured Property";
  if (lang === "en" && property.title_en) {
    title = property.title_en;
  } else if (lang === "cn" && (property.title_cn || property.title_en)) {
    title = property.title_cn || property.title_en;
  } else if (lang === "ru" && (property.title_ru || property.title_en)) {
    title = property.title_ru || property.title_en;
  }

  const projectName = property.project?.name || property.address_info?.th || "";
  const sizeInfo = property.size_sqm ? ` • ${property.size_sqm} ${tSqm}` : "";
  const bedInfo = property.bedrooms ? ` • ${property.bedrooms} ${tBed}` : "";
  const subtitle = `${priceSubtitle}\n${projectName}${bedInfo}${sizeInfo}`.trim();
  const propUrl = `${siteUrl}/properties/${property.slug || property.id}`;

  const greetingIntro =
    lang === "en"
      ? "Here is the property you requested! 🏡 Click below to view full photos or schedule a viewing:"
      : lang === "cn"
      ? "这是您所咨询的房源详情！🏡 点击下方可查看完整图片或预约看房："
      : lang === "ru"
      ? "Вот вилла, которой вы интересовались! 🏡 Нажмите ниже, чтобы посмотреть фото или записаться на просмотр:"
      : "นี่คือข้อมูลทรัพย์ที่คุณลูกค้าสนใจค่ะ 🏡 สามารถคลิกดูรูปภาพทั้งหมดหรือกดนัดชมห้องจริงได้เลยนะคะ:";

  await sendMetaMessage(senderId, greetingIntro, platform);

  const cardElement = [
    {
      title: title.substring(0, 80),
      subtitle: subtitle.substring(0, 80),
      image_url: imageUrl,
      default_action: {
        type: "web_url",
        url: propUrl,
      },
      buttons: [
        {
          type: "web_url",
          url: propUrl,
          title: tViewBtn,
        },
        {
          type: "postback",
          title: tBookBtn,
          payload: `ACTION_BOOK_PROPERTY_${property.id}`,
        },
        {
          type: "postback",
          title: lang === "en" ? "🔍 Find Other Properties" : lang === "cn" ? "🔍 寻找其他房源" : lang === "ru" ? "🔍 Другие варианты" : "🔍 ให้ช่วยหาทรัพย์อื่น",
          payload: `START_QUESTIONNAIRE_${lang}`,
        },
      ],
    },
  ];

  await sendMetaCarousel(senderId, cardElement, platform);

  // Per-Lead Telegram Alert (Cooldown 10 mins per senderId to avoid duplicate spam from same user)
  const priceDisplay = property.price 
    ? `฿${property.price.toLocaleString()}` 
    : property.rental_price 
    ? `฿${property.rental_price.toLocaleString()}/mo` 
    : "N/A";

  const leadCrmLink = `${siteUrl}/protected/admin/leads`;

  await sendDebouncedTelegramAlert(
    `🎯 <b>[Ad Lead Alert] ลูกค้าสนใจทรัพย์จาก Carousel Ads</b>\n\n` +
    `📱 แพลตฟอร์ม: ${platform}\n` +
    `🌐 ภาษาที่เลือก: <b>${lang.toUpperCase()}</b>\n` +
    `🏡 ทรัพย์ที่คลิก: <b>${title}</b>\n` +
    `💰 ราคาทรัพย์ที่คลิก: <b>${priceDisplay}</b> (<i>*ราคาทรัพย์ที่กดดู ยังไม่ใช่งบจริงของลูกค้า</i>)\n` +
    `🔗 รหัส/Slug: <code>${property.slug || property.id}</code>\n\n` +
    `👉 <a href="${leadCrmLink}">เปิดดูข้อมูล Lead ใน CRM</a>`,
    `ad_click_lead_${senderId}`,
    600 // 10 minutes cooldown per sender
  );
}

/**
 * Send Alternative Properties Carousel Card when a unit is Sold/Rented (Multi-language)
 */
async function sendAlternativePropertiesCarousel(
  senderId: string,
  platform: MetaPlatform,
  projectId?: string,
  excludePropertyId?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
) {
  try {
    const supabase = createAdminClient() as any;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    let query = supabase
      .from("properties")
      .select(`
        id,
        slug,
        title,
        price,
        rental_price,
        listing_type,
        images,
        bedrooms,
        bathrooms,
        size_sqm,
        address_info,
        project:projects(name)
      `)
      .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"]);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (excludePropertyId) {
      query = query.neq("id", excludePropertyId);
    }

    let { data: properties } = await query
      .order("created_at", { ascending: false })
      .limit(5);

    // Fallback: If no other units in same project, query top active properties
    if (!properties || properties.length === 0) {
      const { data: fallbackProps } = await supabase
        .from("properties")
        .select(`
          id,
          slug,
          title,
          price,
          rental_price,
          listing_type,
          images,
          bedrooms,
          bathrooms,
          size_sqm,
          address_info,
          project:projects(name)
        `)
        .in("status", ["AVAILABLE", "ACTIVE", "PUBLISHED"])
        .order("is_featured", { ascending: false, nullsFirst: false })
        .limit(5);
      properties = fallbackProps;
    }

    if (!properties || properties.length === 0) return;

    const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : lang === "ru" ? "Продажа" : "售";
    const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : lang === "ru" ? "Аренда" : "租";
    const tBed = lang === "th" ? "นอน" : lang === "en" ? "bed" : lang === "ru" ? "спальни" : "卧";
    const tSqm = lang === "th" ? "ตร.ม." : "sqm";
    const tViewBtn = lang === "th" ? "ดูรายละเอียดห้อง" : lang === "en" ? "View Details" : lang === "cn" ? "查看详情" : "Подробнее";
    const tBookBtn = lang === "th" ? "นัดดูห้องนี้" : lang === "en" ? "Book Viewing" : lang === "cn" ? "预约看房" : "На просмотр";

    const carouselElements = properties.map((prop: any) => {
      const images = Array.isArray(prop.images) ? prop.images : [];
      const imageUrl = images[0] || `${siteUrl}/images/property-placeholder.jpg`;

      let priceSubtitle = "";
      if (prop.listing_type === "SALE_AND_RENT") {
        const parts = [];
        if (prop.price) parts.push(`${tSale} ฿${prop.price.toLocaleString()}`);
        if (prop.rental_price) parts.push(`${tRent} ฿${prop.rental_price.toLocaleString()}/mo`);
        priceSubtitle = parts.join(" | ");
      } else if (prop.listing_type === "RENT") {
        priceSubtitle = prop.rental_price ? `${tRent} ฿${prop.rental_price.toLocaleString()}/mo` : `${tRent} (Inquire)`;
      } else {
        priceSubtitle = prop.price ? `${tSale} ฿${prop.price.toLocaleString()}` : `${tSale} (Inquire)`;
      }

      const projectName = prop.project?.name || prop.address_info?.th || "";
      const sizeInfo = prop.size_sqm ? ` • ${prop.size_sqm} ${tSqm}` : "";
      const bedInfo = prop.bedrooms ? ` • ${prop.bedrooms} ${tBed}` : "";
      const subtitle = `${priceSubtitle}\n${projectName}${bedInfo}${sizeInfo}`.trim();
      const propUrl = `${siteUrl}/properties/${prop.slug || prop.id}`;

      return {
        title: (prop.title || "Alternative Unit").substring(0, 80),
        subtitle: subtitle.substring(0, 80),
        image_url: imageUrl,
        default_action: {
          type: "web_url",
          url: propUrl,
        },
        buttons: [
          {
            type: "web_url",
            url: propUrl,
            title: tViewBtn,
          },
          {
            type: "postback",
            title: tBookBtn,
            payload: `ACTION_BOOK_PROPERTY_${prop.id}`,
          }
        ],
      };
    });

    await sendMetaCarousel(senderId, carouselElements, platform);
  } catch (err) {
    console.error("[Meta Webhook] Error sending alternative carousel:", err);
  }
}

/**
 * Handle AI Smart Real Estate Assistant for conversational questions (Multi-language)
 */
async function handleAiPropertyAssistant(
  text: string,
  senderId: string,
  platform: MetaPlatform,
  propertyData?: any,
  leadId?: string,
  lang: "th" | "en" | "cn" | "ru" = "th",
): Promise<boolean> {
  try {
    const { generateText } = await import("@/lib/ai/gemini");
    const settings = await getSiteSettings();

    let contextStr = `Agency: ${settings.company_name || "Real Estate Agency"}\nPhone: ${settings.contact_phone || ""}\nLINE ID: ${settings.line_id || ""}\n`;
    if (propertyData) {
      contextStr += `Property: ${propertyData.title}\nPrice: ${propertyData.price || propertyData.rental_price}\nType: ${propertyData.listing_type}\nLocation: ${propertyData.address_info?.th || ""}\nBedrooms: ${propertyData.bedrooms || "-"}\nSize: ${propertyData.size_sqm || "-"} sqm\nStatus: ${propertyData.status}\n`;
    }

    const languageInstruction =
      lang === "en" ? "Answer in English." :
      lang === "cn" ? "Answer in Simplified Chinese." :
      lang === "ru" ? "Answer in Russian." :
      "Answer in Thai.";

    const systemInstruction = `You are a polite, helpful, and professional real estate AI assistant for Facebook & Instagram chat.
${languageInstruction} Answer the customer's question concisely (within 2-3 friendly sentences). Use warm emojis (✨, 🏡, 😊).
If the question is about viewing, booking, or price negotiation, invite them to book a viewing or chat with staff.
Never make up facts not provided in context.`;

    const aiRes = await generateText(
      `Context Information:\n${contextStr}\n\nCustomer Inquiry: "${text}"\n\nAssistant Response:`,
      "gemini-1.5-flash",
      0,
      { systemInstruction, maxOutputTokens: 250, temperature: 0.3 }
    );

    if (!aiRes?.text) return false;

    const answer = aiRes.text.trim();
    const btnBook = lang === "en" ? "📅 Book Viewing" : lang === "cn" ? "📅 预约看房" : lang === "ru" ? "📅 На просмотр" : "📅 นัดดูห้องจริง";
    const btnAdmin = lang === "en" ? "💬 Chat with Staff" : lang === "cn" ? "💬 联系客服" : lang === "ru" ? "💬 Менеджер" : "💬 คุยกับแอดมิน";
    const btnLine = lang === "en" ? "🟢 Chat on LINE" : lang === "cn" ? "🟢 LINE 咨询" : "🟢 คุยต่อใน LINE";

    const buttons: SocialButton[] = [
      {
        title: btnBook,
        type: "postback",
        payload: propertyData?.id ? `ACTION_BOOK_PROPERTY_${propertyData.id}` : "ACTION_BOOK_VIEWING",
      },
      {
        title: btnAdmin,
        type: "postback",
        payload: "ACTION_TALK_ADMIN",
      }
    ];

    if (settings.line_url || settings.line_id) {
      buttons.push({
        title: btnLine,
        type: "web_url",
        url: settings.line_url || `https://line.me/R/ti/p/@${(settings.line_id || "").replace(/^@/, "")}`,
      });
    }

    await sendMetaMessage(senderId, answer, platform, buttons);
    return true;
  } catch (err) {
    console.error("[Meta Webhook] AI Assistant error:", err);
    return false;
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
