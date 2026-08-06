import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { LINE_MESSAGING_API, lineConfig } from "../../../lib/line-config";
import {
  searchPropertiesForBot,
  getDistinctAreasForType,
  searchByTypeAndArea,
  getHotProperties,
  getActivePropertyTypes,
  getPopularAreaTranslations,
} from "@/features/properties/queries.public";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt, generateBlindIndex } from "@/lib/crypto";
import { getLineProfile, saveOmniMessage, sendLineNotification } from "@/lib/line";
import { siteConfig } from "@/lib/site-config";
import { chatWithAI } from "@/features/chatbot/actions";
import { redis } from "@/lib/redis";
import { sendAdminNotification } from "@/lib/telegram";
import { formatLeadNotification, buildLeadActionKeyboard } from "@/lib/telegram-formatters";
import {
  buildWelcomeFlex,
  buildPropertyTypeQuickReply,
  buildAreaQuickReply,
  buildPropertyCarousel,
  buildContactInfoMessage,
  buildDepositFlex,
  buildNoResultsMessage,
  buildLanguageSelection,
  buildSearchResultText,
  buildHandoverConfirmFlex,
  buildDepositTransactionTypeQuickReply,
  buildDepositPropertyTypeQuickReply,
  buildDepositSummaryMessage,
  type AreaTranslations,
  type PropertyForFlex,
  t,
} from "@/lib/line-flex-builders";
import {
  type FlexMessage,
  type QuickReply,
  type BotLang,
  type FlexCarousel,
} from "@/types/line";

// ============================
// Language Preference Storage
// (In-memory cache with TTL — resets on server restart)
// ============================
const userLangMap = new Map<string, { lang: BotLang; ts: number }>();
const LANG_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

function getUserLang(userId: string): BotLang {
  const entry = userLangMap.get(userId);
  if (entry && Date.now() - entry.ts < LANG_TTL) return entry.lang;
  return "th"; // default
}

function setUserLang(userId: string, lang: BotLang): void {
  userLangMap.set(userId, { lang, ts: Date.now() });
}

// ============================
// Event Deduplication (REMOVED: Moved to Redis)
// ============================

// ============================
// Types
// ============================
type LineEvent = {
  type: string;
  replyToken: string;
  source: {
    userId?: string;
    groupId?: string;
    roomId?: string;
    type: string;
  };
  message?: {
    type: string;
    text: string;
    id: string;
  };
  joined?: {
    members: { userId: string }[];
  };
  left?: {
    members: { userId: string }[];
  };
  follow?: {
    isUnblocked: boolean;
  };
  postback?: {
    data: string;
    params?: Record<string, string>;
  };
  webhookEventId?: string;
};

// ============================
// Push Helper (for debug)
// ============================
async function pushText(userId: string, text: string) {
  try {
    await fetch(`${LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: text }],
      }),
    });
  } catch (e) {
    console.error("Push failed:", e);
  }
}

// ============================
// Main Webhook Handler
// ============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const hash = crypto
      .createHmac("sha256", lineConfig.channelSecret)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const events: LineEvent[] = JSON.parse(body).events;
    console.log(`[BOT] Received ${events.length} events`);

    const areaTranslations = await prepareAreaTranslations();

    for (const event of events) {
      const eventId = event.webhookEventId;
      
      // 🛡️ 1. Deduplication Check (Hardened Redis Implementation)
      if (eventId) {
        try {
          if (redis) {
            const lockKey = `webhook:line:${eventId}`;
            // Atomic Set if Not Exists (NX) with 24h Expiry (EX)
            const isNew = await redis.set(lockKey, Date.now().toString(), { 
              nx: true, 
              ex: 86400 
            });

            if (!isNew) {
              console.log(`[BOT] Duplicate event skipped: ${eventId} at ${new Date().toISOString()}`);
              continue; // Skip processing for duplicate
            }
          }
        } catch (redisError) {
          console.error("[BOT] Redis Idempotency Error (Fail-Open):", redisError);
        }
      }

      try {
        if (event.type === "join" || event.type === "memberJoined") {
          await handleJoinEvent(event);
        }

        if (event.type === "leave") {
          await handleLeaveEvent(event);
        }

        if (event.type === "follow") {
          await handleFollowEvent(event);
        }

        if (event.type === "message" && event.message?.type === "text") {
          await handleIncomingChannelMessage(event, areaTranslations);
        }

        if (event.type === "postback") {
          await handlePostbackEvent(event, areaTranslations);
        }
      } catch (err: unknown) {
        console.error("Event error:", err);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[BOT] Webhook Global Error:", err);
    return NextResponse.json({ error: err.message }, { status: 200 });
  }
}

// ============================
// Event Handlers
// ============================

async function handleJoinEvent(event: LineEvent) {
  const groupId = event.source.groupId || event.source.roomId;
  if (!groupId) return;

  let groupName = "Unknown Group";
  let pictureUrl = "";

  try {
    const res = await fetch(`${LINE_MESSAGING_API}/group/${groupId}/summary`, {
      headers: {
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      groupName = data.groupName;
      pictureUrl = data.pictureUrl;
    } else {
      groupName = `Group ${groupId.slice(0, 6)}...`;
    }
  } catch (e) {
    console.error("Error fetching group summary:", e);
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("line_groups").upsert({
    group_id: groupId,
    group_name: groupName,
    picture_url: pictureUrl,
    is_active: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error upserting line group:", error);
  }

  if (event.type === "join") {
    await replyText(
      event.replyToken,
      `สวัสดีครับ! ผมคือบอทแจ้งเตือนค่าเช่า\nผมได้บันทึกกลุ่ม "${groupName}" เข้าระบบแล้วครับ\nคุณสามารถไปตั้งค่าการแจ้งเตือนในระบบ CRM ได้เลยครับ`,
    );
  }
}

async function handleLeaveEvent(event: LineEvent) {
  const groupId = event.source.groupId || event.source.roomId;
  if (!groupId) return;

  const supabase = await createAdminClient();
  await supabase
    .from("line_groups")
    .update({ is_active: false })
    .eq("group_id", groupId);
}

async function handleFollowEvent(event: LineEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  const supabase = createAdminClient();

  try {
    const profile = await getLineProfile(userId);
    const lineIdHash = generateBlindIndex(userId);
    if (!lineIdHash) return;

    const { data: identity } = await supabase
      .from("identities_v3")
      .select("id, crm_leads_v3(id)")
      .eq("social_links->>line_id_hash", lineIdHash)
      .maybeSingle();

    const lead = identity?.crm_leads_v3?.[0] as { id: string } | undefined;

    if (!lead) {
      const displayName = profile?.displayName || "LINE Contact";
      const encryptedDisplayName = encrypt(displayName);
      const encryptedLineId = encrypt(userId);

      const { data: tenant } = await supabase
        .from("tenants_v3")
        .select("id")
        .limit(1)
        .single();
      const tenantId = tenant?.id || null;

      const { data: newIdentity, error: identityErr } = await supabase
        .from("identities_v3")
        .insert({
          tenant_id: tenantId,
          category: 2, // External
          role: "LEAD",
          display_name: encryptedDisplayName,
          line_id: encryptedLineId,
          social_links: {
            line_id_hash: lineIdHash,
            full_name_hash: generateBlindIndex(displayName),
          },
          is_active: true,
        })
        .select("id")
        .single();

      if (identityErr || !newIdentity) {
        console.error("Error creating follow identity:", identityErr);
        return;
      }

      await supabase.from("identity_secrets_v3").insert({
        identity_id: newIdentity.id,
        full_name_encrypted: encryptedDisplayName,
        updated_at: new Date().toISOString()
      });

      await supabase.from("crm_leads_v3").insert({
        tenant_id: tenantId,
        identity_id: newIdentity.id,
        status: "ACTIVE",
        stage: "NEW",
        source: "LINE",
        utm_data: {
          preferences: {
            note: "Captured from follow event. Subscribe via LINE OA."
          }
        }
      });
    }
  } catch (err) {
    console.error("Error in follow logic:", err);
  }

  try {
    const langMsg = buildLanguageSelection();
    await replyMessage(event.replyToken, [langMsg]);
  } catch (err) {
    console.error("Error sending language selection:", err);
  }
}

async function prepareAreaTranslations(): Promise<AreaTranslations> {
  const list = await getPopularAreaTranslations();
  const map: AreaTranslations = {};
  for (const item of list) {
    if (item.name) {
      map[item.name] = { 
        en: item.name_en, 
        cn: item.name_cn, 
        ru: item.name_ru 
      };
    }
  }
  return map;
}

async function handlePostbackEvent(
  event: LineEvent,
  areaTranslations: AreaTranslations,
) {
  const userId = event.source.userId;
  if (!userId) return;

  const data = event.postback?.data || "";
  const params = new URLSearchParams(data);
  const action = params.get("action");

  if (action === "lang") {
    const selectedLang = params.get("value") as BotLang;
    if (["th", "en", "cn", "ru"].includes(selectedLang)) {
      setUserLang(userId, selectedLang);
      const confirmTexts: Record<BotLang, string> = {
        th: "เปลี่ยนเป็นภาษาไทยแล้วค่ะ 🇹🇭",
        en: "Language changed to English 🇬🇧",
        cn: "已切换为中文 🇨🇳",
        ru: "Язык изменен на русский 🇷🇺",
      };
      const { messages } = buildWelcomeFlex(selectedLang);
      await replyMessage(event.replyToken, [
        { type: "text", text: confirmTexts[selectedLang] },
        ...messages,
      ]);
    }
    return;
  }

  const lang = getUserLang(userId);

  if (action === "search") {
    const activeTypes = await getActivePropertyTypes();
    const msg = buildPropertyTypeQuickReply(lang, activeTypes);
    await replyMessage(event.replyToken, [msg]);
    return;
  }

  if (action === "change_lang") {
    const msg = buildLanguageSelection();
    await replyMessage(event.replyToken, [msg]);
    return;
  }

  if (action === "contact") {
    // 1. ตอบกลับการ์ด Flex Message ตกลงจะติดต่อกลับอย่างสวยงาม
    const confirmCard = buildHandoverConfirmFlex(lang);
    await replyMessage(event.replyToken, [confirmCard]);

    // 2. ดึง/สร้าง Lead เพื่อทำการ Pause Bot
    const supabase = createAdminClient();
    const lineIdHash = generateBlindIndex(userId);
    let activeLeadId: string | undefined;

    if (lineIdHash) {
      const { data: leadRow } = await supabase
        .from("crm_leads_v3")
        .select("id, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name)")
        .eq("identity.social_links->>line_id_hash", lineIdHash)
        .maybeSingle();

      if (leadRow) {
        activeLeadId = leadRow.id;
        const currentUtmData = (leadRow.utm_data as Record<string, any>) || {};
        const currentPrefs = currentUtmData.preferences || {};

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
          .eq("id", leadRow.id);
      }
    }

    // 3. ดึงโปรไฟล์ผู้ใช้งานสำหรับแจ้งเตือน
    let displayName = "ลูกค้า LINE";
    try {
      const profile = await getLineProfile(userId);
      if (profile?.displayName) {
        displayName = profile.displayName;
      }
    } catch (pErr) {
      console.warn("[HANDOVER] Could not fetch LINE profile on postback:", pErr);
    }

    // 4. แจ้งเตือน LINE Admin
    try {
      const adminAlert = `🚨 [ลูกค้ากดปุ่มขอคุยกับแอดมิน]\n\nผู้ติดต่อ: ${displayName}\n(ระบบหยุดการตอบของบอทให้อัตโนมัติแล้ว กรุณาเข้าตอบแชทครับ)`;
      await sendLineNotification(adminAlert);
    } catch (lineErr) {
      console.error("[HANDOVER] LINE Notification failed:", lineErr);
    }

    // 5. แจ้งเตือน Telegram Admin
    try {
      const safeDisplayName = displayName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const tgMessage = `🚨 <b>ลูกค้ากดปุ่มขอติดต่อเจ้าหน้าที่!</b>\n\n<b>ผู้ติดต่อ:</b> ${safeDisplayName}\n\n<i>(ระบบหยุดบอทตอบให้อัตโนมัติแล้ว)</i>`;
      const tgKeyboard = buildLeadActionKeyboard(activeLeadId || "", null);

      await sendAdminNotification(tgMessage, {
        parseMode: "HTML",
        replyMarkup: tgKeyboard,
      });
    } catch (tgErr) {
      console.error("[HANDOVER] Telegram Notification failed:", tgErr);
    }

    return;
  }

  if (action === "deposit") {
    const msg = buildDepositFlex(lang);
    await replyMessage(event.replyToken, [msg]);
    return;
  }

  if (action === "select_type") {
    const type = params.get("type") || "";
    const areas = await getDistinctAreasForType(type);
    if (areas.length === 0) {
      const msg = buildNoResultsMessage(type, lang);
      await replyMessage(event.replyToken, [msg]);
      return;
    }
    const msg = buildAreaQuickReply(type, areas, lang, areaTranslations);
    await replyMessage(event.replyToken, [msg]);
    return;
  }

  if (action === "select_area") {
    const type = (params.get("type") || "").trim();
    const area = (params.get("area") || "").trim();

    const properties = await searchByTypeAndArea(type, area);
    if (properties.length === 0) {
      const msg = buildNoResultsMessage(area, lang);
      await replyMessage(event.replyToken, [msg]);
      return;
    }

    const headerTexts: Record<BotLang, string> = {
      th: `พบ ${properties.length} ทรัพย์ใน ${area}`,
      en: `Found ${properties.length} properties in ${area}`,
      cn: `在${area}找到${properties.length}个房产`,
      ru: `Найдено объектов в ${area}: ${properties.length}`,
    };

    const flex = buildPropertyCarousel(
      properties as PropertyForFlex[],
      headerTexts[lang],
      lang,
      areaTranslations,
    );

    const carousel = flex.contents as FlexCarousel;
    if (!carousel.contents || carousel.contents.length === 0) {
      await replyText(
        event.replyToken,
        `พบ ${properties.length} ทรัพย์ แต่ไม่สามารถสร้าง Carousel ได้`,
      );
      return;
    }

    const res = await replyMessage(event.replyToken, [flex]);
    if (!res.success) {
      await pushText(
        userId,
        `ขออภัยค่ะ ไม่สามารถแสดงผลรูปภาพได้ในขณะนี้ (${res.error || "Unknown Error"})\n\nทำเล: ${area}`,
      );
      await pushText(
        userId,
        properties
          .slice(0, 5)
          .map((p) => `- ${(p as PropertyForFlex).title}`)
          .join("\n"),
      );
    }
    return;
  }
}

async function handleIncomingChannelMessage(
  event: LineEvent,
  areaTranslations: AreaTranslations,
) {
  const userId = event.source.userId;
  const groupId = event.source.groupId || event.source.roomId;
  const text = event.message?.text || "";

  if (!text) return;

  const cleanText = text.toLowerCase().trim();
  if (cleanText === "/id" || cleanText === "/groupid") {
    if (groupId) {
      await handleJoinEvent(event);
      await replyText(event.replyToken, `Group ID ของกลุ่มนี้คือ:\n${groupId}`);
    } else if (userId) {
      await replyText(event.replyToken, `User ID ของคุณคือ:\n${userId}`);
    }
    return;
  }

  if (text.startsWith("/setname ")) {
    if (!groupId) {
      await replyText(event.replyToken, "คำสั่งนี้ใช้ได้เฉพาะในกลุ่มไลน์ครับ");
      return;
    }
    const newName = text.replace("/setname ", "").trim();
    if (newName) {
      const supabase = await createAdminClient();
      await supabase
        .from("line_groups")
        .update({ group_name: newName })
        .eq("group_id", groupId);

      await replyText(
        event.replyToken,
        `เปลี่ยนชื่อกลุ่มในระบบเป็น: "${newName}" เรียบร้อยครับ ✅\n(กด Refresh หน้าเว็บเพื่อดูผลลัพธ์)`,
      );
    }
    return;
  }

  if (text.startsWith("/check ")) {
    const checkArea = text.replace("/check ", "").trim();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, property_type, status")
      .eq("status", "ACTIVE")
      .ilike("popular_area", `%${checkArea}%`);

    if (error) {
      await replyText(event.replyToken, `DB Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      await replyText(
        event.replyToken,
        `ไม่พบทรัพย์ในทำเล "${checkArea}" เลยค่ะ`,
      );
      return;
    }

    const list = data
      .map((p) => `[${(p as any).property_type}] ${(p as any).title} (ID: ${(p as any).id})`)
      .join("\n");
    await replyText(
      event.replyToken,
      `พบ ${data.length} ทรัพย์ใน "${checkArea}":\n\n${list.slice(0, 1000)}`,
    );
    return;
  }

  if (!userId) return;

  const supabase = createAdminClient();
  const lineIdHash = generateBlindIndex(userId);
  if (!lineIdHash) return;

  const { data: leadRow } = await supabase
    .from("crm_leads_v3")
    .select("id, tenant_id, utm_data, ai_summary, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name)")
    .eq("identity.social_links->>line_id_hash", lineIdHash)
    .maybeSingle();

  let activeLeadId = leadRow?.id;
  const currentUtmData = (leadRow?.utm_data as Record<string, any>) || {};
  const currentPrefs = currentUtmData.preferences || {};
  const currentNote = currentPrefs.note || leadRow?.ai_summary || "";

  if (!leadRow) {
    const profile = await getLineProfile(userId);
    const displayName = profile?.displayName || "LINE Contact";
    const encryptedDisplayName = encrypt(displayName);
    const encryptedLineId = encrypt(userId);

    const { data: tenant } = await supabase
      .from("tenants_v3")
      .select("id")
      .limit(1)
      .single();
    const tenantId = tenant?.id || null;

    // Create Identity
    const { data: newIdentity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        tenant_id: tenantId,
        category: 2, // External
        role: "LEAD",
        display_name: encryptedDisplayName,
        line_id: encryptedLineId,
        social_links: {
          line_id_hash: lineIdHash,
          full_name_hash: generateBlindIndex(displayName),
        },
        is_active: true,
      })
      .select("id")
      .single();

    if (identityErr || !newIdentity) {
      console.error("Error creating auto-identity:", identityErr);
      return;
    }

    await supabase.from("identity_secrets_v3").insert({
      identity_id: newIdentity.id,
      full_name_encrypted: encryptedDisplayName,
      updated_at: new Date().toISOString()
    });

    const noteText = `Auto-captured from LINE. Profile: ${JSON.stringify(profile)}`;
    const { data: newLead, error: createError } = await supabase
      .from("crm_leads_v3")
      .insert({
        tenant_id: tenantId,
        identity_id: newIdentity.id,
        status: "ACTIVE",
        stage: "NEW",
        source: "LINE",
        utm_data: {
          preferences: {
            note: noteText
          }
        }
      })
      .select("id")
      .single();

    if (createError || !newLead) {
      console.error("Error creating auto-lead:", createError);
      return;
    }
    activeLeadId = newLead.id;
  }

  // Log Message
  if (activeLeadId) {
    let profile = null;
    try {
      profile = await getLineProfile(userId);
      // 🔥 Update Lead Photo correctly
      if (profile?.pictureUrl) {
        const updatedPrefs = {
          ...currentPrefs,
          note: `Photo: ${profile.pictureUrl}\n\n${currentNote}`
        };
        await supabase
          .from("crm_leads_v3")
          .update({
            utm_data: {
              ...currentUtmData,
              preferences: updatedPrefs
            }
          })
          .eq("id", activeLeadId);
      }
    } catch (e) {}

    let activeTenantId = leadRow?.tenant_id;

    await saveOmniMessage({
      lead_id: activeLeadId!,
      source: "LINE",
      external_message_id: event.message?.id,
      content: text,
      payload: { ...event, profile },
      direction: "INCOMING",
      tenant_id: (activeTenantId as string) || undefined,
    });
  }

  // Interactive Commands
  const trimmedText = text.trim();
  await handleInteractiveCommand(
    event,
    trimmedText,
    userId,
    areaTranslations,
    activeLeadId,
    currentUtmData,
    currentPrefs
  );
}

// ============================
// Interactive Command Handler
// ============================
async function handleInteractiveCommand(
  event: LineEvent,
  text: string,
  userId: string,
  areaTranslations?: AreaTranslations,
  activeLeadId?: string,
  currentUtmData?: Record<string, any>,
  currentPrefs?: Record<string, any>,
) {
  const { replyToken } = event;
  const lang = getUserLang(userId);
  const supabase = createAdminClient();

  // --- 🛡️ 0. Check if Bot is Paused for this Lead (Human Handover Mode) ---
  if (currentPrefs?.bot_paused === true) {
    // Command to re-enable bot
    if (text === "/bot on" || text === "/startbot" || text === "เปิดบอท") {
      if (activeLeadId) {
        const updatedPrefs = {
          ...currentPrefs,
          bot_paused: false,
        };
        await supabase
          .from("crm_leads_v3")
          .update({
            utm_data: {
              ...currentUtmData,
              preferences: updatedPrefs,
            },
          })
          .eq("id", activeLeadId);
      }
      await replyText(replyToken, "เปิดการทำงานของ AI Bot เรียบร้อยครับ 🤖");
      return;
    }

    // If bot is paused, stay silent so human admin can chat
    console.log(`[BOT] Bot is currently PAUSED for lead ${activeLeadId}. Ignoring automatic response.`);
    return;
  }

  // --- เปลี่ยนภาษา ---
  if (
    text === "เปลี่ยนภาษา" ||
    text === "🌐 เปลี่ยนภาษา" ||
    text.toLowerCase() === "language" ||
    text.toLowerCase() === "lang"
  ) {
    const msg = buildLanguageSelection();
    await replyMessage(replyToken, [msg]);
    return;
  }

  // --- สนใจทรัพย์ ---
  if (text.startsWith("สนใจทรัพย์:")) {
    // 1. ตอบกลับผู้ใช้ทันที
    const replyMsg = t("interested_reply", lang);
    await replyMessage(replyToken, [{ type: "text", text: replyMsg }]);

    // 2. ดึงข้อมูล Property ID และ Title สำหรับแจ้งเตือน
    const idMatch =
      text.match(/\(รหัส: (.*?)\)/) ||
      text.match(/\(ID: (.*?)\)/) ||
      text.match(/\(编号: (.*?)\)/);
    const propertyId = idMatch ? idMatch[1].slice(0, 6) : "";
    const propertyTitle = text
      .replace("สนใจทรัพย์:", "")
      .replace(/\(รหัส:.*?\)/, "")
      .replace(/\(ID:.*?\)/, "")
      .replace(/\(编号:.*?\)/, "")
      .trim();

    // 3. ดึงข้อมูลผู้ใช้ (Lead) และโปรไฟล์ LINE
    const supabase = createAdminClient();
    const profile = await getLineProfile(userId);
    const lineIdHash = generateBlindIndex(userId);
    if (!lineIdHash) return;

    const { data: leadRow } = await supabase
      .from("crm_leads_v3")
      .select("id, tenant_id, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, phone)")
      .eq("identity.social_links->>line_id_hash", lineIdHash)
      .maybeSingle();

    const utmData = (leadRow?.utm_data as Record<string, any>) || {};
    const prefs = utmData.preferences || {};
    const currentNote = prefs.note || "";
    const { decrypt } = await import("@/lib/crypto");
    
    const lead = leadRow ? {
      id: leadRow.id,
      tenant_id: leadRow.tenant_id,
      full_name: decrypt(leadRow.identity?.display_name) || "Unknown",
      phone: decrypt(leadRow.identity?.phone) || null,
      note: currentNote,
    } : null;

    // 4. แจ้งเตือนแอดมินทันที
    const adminAlert = `🔔 มีคนสนใจทรัพย์สิน!\n\nผู้สนใจ: ${profile?.displayName || lead?.full_name || "ลูกค้า LINE"}\nทรัพย์สิน: ${propertyTitle}\nรหัส: ${propertyId || "-"}\n\nกรุณาติดต่อกลับโดยด่วนครับ`;
    await sendLineNotification(adminAlert);

    // 🚀 Bridge to Telegram
    try {
      const tgMessage = formatLeadNotification(
        {
          ...lead,
          full_name: profile?.displayName || lead?.full_name || "ลูกค้า LINE",
        }, 
        {
          lastMessage: text,
          customPropertyTitle: `${propertyTitle} (ID: ${propertyId})`
        }
      );
      
      const tgKeyboard = buildLeadActionKeyboard(lead?.id || "", lead?.phone || null);
      
      await sendAdminNotification(tgMessage, { 
        parseMode: "HTML",
        replyMarkup: tgKeyboard
      });
    } catch (tgErr) {
      console.error("[BRIDGE] Telegram notification failed:", tgErr);
    }

    // 5. บันทึกข้อมูลเพิ่มลงในโน้ตของ Lead (ถ้ามี)
    if (lead && lead.id) {
      const newNote = `[${new Date().toLocaleString("th-TH")}] สนใจทรัพย์: ${propertyTitle} (ID: ${propertyId})\n${lead.note || ""}`;
      const updatedPrefs = {
        ...prefs,
        note: newNote
      };
      await supabase
        .from("crm_leads_v3")
        .update({
          utm_data: {
            ...utmData,
            preferences: updatedPrefs
          }
        })
        .eq("id", lead.id!);
    }
    return;
  }

  // --- ภาษา:xx → Set language + send welcome ---
  if (text.startsWith("ภาษา:")) {
    const selectedLang = text.replace("ภาษา:", "").trim() as BotLang;
    if (["th", "en", "cn", "ru"].includes(selectedLang)) {
      setUserLang(userId, selectedLang);

      // Confirm + show welcome in new language
      const confirmTexts: Record<BotLang, string> = {
        th: "เปลี่ยนเป็นภาษาไทยแล้วค่ะ 🇹🇭",
        en: "Language changed to English 🇬🇧",
        cn: "已切换为中文 🇨🇳",
        ru: "Язык изменен на русский 🇷🇺",
      };

      const { messages } = buildWelcomeFlex(selectedLang);
      await replyMessage(replyToken, [
        { type: "text", text: confirmTexts[selectedLang] },
        ...messages,
      ]);
    }
    return;
  }

  // --- ค้นหาทรัพย์ ---
  if (
    text === "ค้นหาทรัพย์" ||
    text === "🏠 ค้นหาทรัพย์" ||
    text === "ค้นหา" ||
    text.toLowerCase() === "search"
  ) {
    const activeTypes = await getActivePropertyTypes();
    const msg = buildPropertyTypeQuickReply(lang, activeTypes);
    await replyMessage(replyToken, [msg]);
    return;
  }

  // --- ประเภท:TYPE → เลือกทำเล ---
  if (text.startsWith("ประเภท:")) {
    const propertyType = text.replace("ประเภท:", "").trim();
    const areas = await getDistinctAreasForType(propertyType);

    if (areas.length === 0) {
      const msg = buildNoResultsMessage("ประเภทนี้", lang);
      await replyMessage(replyToken, [msg]);
      return;
    }

    const msg = buildAreaQuickReply(
      propertyType,
      areas,
      lang,
      areaTranslations,
    );
    await replyMessage(replyToken, [msg]);
    return;
  }

  // --- ทำเล:TYPE:AREA → แสดง Carousel ---
  if (text.startsWith("ทำเล:")) {
    const parts = text.replace("ทำเล:", "").split(":");
    const propertyType = parts[0]?.trim();
    const area = parts[1]?.trim();

    if (!propertyType || !area) {
      await replyText(replyToken, "กรุณาเลือกทำเลจากเมนูอีกครั้งค่ะ");
      return;
    }

    const properties = await searchByTypeAndArea(propertyType, area);

    if (properties.length === 0) {
      const msg = buildNoResultsMessage(` ${area}`, lang);
      await replyMessage(replyToken, [msg]);
      return;
    }

    const headerTexts: Record<BotLang, string> = {
      th: `พบ ${properties.length} ทรัพย์ใน ${area}`,
      en: `Found ${properties.length} properties in ${area}`,
      cn: `在${area}找到${properties.length}个房产`,
      ru: `Найдено объектов в ${area}: ${properties.length}`,
    };

    const flex = buildPropertyCarousel(
      properties as unknown as PropertyForFlex[],
      headerTexts[lang],
      lang,
      areaTranslations,
    );
    await replyMessage(replyToken, [flex]);
    return;
  }

  // --- ติดต่อเจ้าหน้าที่ / ขอคุยกับ Admin ---
  const lowerText = text.toLowerCase();
  const isContactAdminTrigger =
    text === "ติดต่อเจ้าหน้าที่" ||
    text === "📞 ติดต่อเจ้าหน้าที่" ||
    text === "ติดต่อ" ||
    lowerText === "contact" ||
    lowerText === "admin" ||
    lowerText.includes("แอดมิน") ||
    lowerText.includes("เจ้าหน้าที่") ||
    lowerText.includes("คุยกับคน") ||
    lowerText.includes("ติดต่อคน");

  if (isContactAdminTrigger) {
    // 1. ตอบกลับการ์ด Flex Message ตกลงจะติดต่อกลับอย่างสวยงาม
    const confirmCard = buildHandoverConfirmFlex(lang);
    await replyMessage(event.replyToken, [confirmCard]);

    // 2. หยุดบอทตอบกลับสำหรับลูกค้ารายนี้ (bot_paused = true)
    if (activeLeadId) {
      const updatedPrefs = {
        ...currentPrefs,
        bot_paused: true,
        bot_paused_at: new Date().toISOString(),
      };
      await supabase
        .from("crm_leads_v3")
        .update({
          utm_data: {
            ...currentUtmData,
            preferences: updatedPrefs,
          },
        })
        .eq("id", activeLeadId);
    }

    // 3. ดึงโปรไฟล์ผู้ใช้งานสำหรับแจ้งเตือน
    let displayName = "ลูกค้า LINE";
    try {
      const profile = await getLineProfile(userId);
      if (profile?.displayName) {
        displayName = profile.displayName;
      }
    } catch (pErr) {
      console.warn("[HANDOVER] Could not fetch LINE profile:", pErr);
    }

    // 4. แจ้งเตือน LINE Admin (แยก try/catch เพื่อความเสถียร)
    try {
      const adminAlert = `🚨 [ลูกค้าขอคุยกับแอดมิน]\n\nผู้ติดต่อ: ${displayName}\nข้อความ: ${text}\n(ระบบหยุดการตอบของบอทให้อัตโนมัติแล้ว กรุณาเข้าตอบแชทครับ)`;
      await sendLineNotification(adminAlert);
    } catch (lineErr) {
      console.error("[HANDOVER] LINE Notification failed:", lineErr);
    }

    // 5. แจ้งเตือน Telegram Admin (แยก try/catch + Escape HTML)
    try {
      const safeDisplayName = displayName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const tgMessage = `🚨 <b>ลูกค้าขอติดต่อเจ้าหน้าที่!</b>\n\n<b>ผู้ติดต่อ:</b> ${safeDisplayName}\n<b>ข้อความ:</b> ${safeText}\n\n<i>(ระบบหยุดบอทตอบให้อัตโนมัติแล้ว)</i>`;
      const tgKeyboard = buildLeadActionKeyboard(activeLeadId || "", null);
      
      await sendAdminNotification(tgMessage, {
        parseMode: "HTML",
        replyMarkup: tgKeyboard,
      });
    } catch (tgErr) {
      console.error("[HANDOVER] Telegram Notification failed:", tgErr);
    }

    return;
  }

  // --- ฝากขาย/เช่า (Interactive 2-Step Flow) ---
  if (
    text === "ฝากขาย/เช่า" ||
    text === "📝 ฝากขาย/เช่า" ||
    text === "ฝากทรัพย์" ||
    text.toLowerCase() === "deposit" ||
    text.toLowerCase() === "list"
  ) {
    const msg = buildDepositTransactionTypeQuickReply(lang);
    await replyMessage(replyToken, [msg]);
    return;
  }

  if (text === "ฝากเช่า" || text === "ฝากขาย") {
    const txType = text === "ฝากเช่า" ? "เช่า" : "ขาย";
    const msg = buildDepositPropertyTypeQuickReply(txType, lang);
    await replyMessage(replyToken, [msg]);
    return;
  }

  if (text.startsWith("ฝากเช่า:") || text.startsWith("ฝากขาย:") || text.startsWith("ฝากขาย/เช่า:")) {
    const parts = text.split(":");
    const txType = parts[0].replace("ฝาก", "").trim();
    const propType = parts[1]?.trim() || "ทรัพย์สิน";

    // 1. ตอบกลับข้อความสรุปพร้อมปุ่มติดต่อเจ้าหน้าที่
    const msg = buildDepositSummaryMessage(txType, propType, lang);
    await replyMessage(replyToken, [msg]);

    // 2. บันทึกข้อมูลฝากทรัพย์เบื้องต้นลง CRM Lead Note
    if (activeLeadId) {
      const depositNote = `[ฝากทรัพย์] สนใจฝาก ${txType} - ประเภท: ${propType}`;
      const updatedPrefs = {
        ...currentPrefs,
        deposit_request: {
          transaction_type: txType,
          property_type: propType,
          created_at: new Date().toISOString(),
        },
        note: `[${new Date().toLocaleString("th-TH")}] ${depositNote}\n${currentPrefs?.note || ""}`,
      };

      await supabase
        .from("crm_leads_v3")
        .update({
          utm_data: {
            ...currentUtmData,
            preferences: updatedPrefs,
          },
        })
        .eq("id", activeLeadId);
    }

    // 3. แจ้งเตือน Admin (LINE & Telegram)
    let displayName = "ลูกค้า LINE";
    try {
      const profile = await getLineProfile(userId);
      if (profile?.displayName) displayName = profile.displayName;
    } catch (e) {}

    try {
      const adminAlert = `📝 [มีลูกค้าลงทะเบียนฝากทรัพย์]\n\nผู้ฝาก: ${displayName}\nความต้องการ: ฝาก${txType} (${propType})\n\n(ระบบได้ขอข้อมูลรูปและทำเลแล้ว หากลูกค้าระบุข้อมูลเพิ่มจะถูกบันทึกในระบบครับ)`;
      await sendLineNotification(adminAlert);
    } catch (lineErr) {}

    try {
      const safeName = displayName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const tgMessage = `📝 <b>มีลูกค้าลงทะเบียนฝากทรัพย์!</b>\n\n<b>ผู้ฝาก:</b> ${safeName}\n<b>ประเภท:</b> ฝาก${txType} (${propType})`;
      const tgKeyboard = buildLeadActionKeyboard(activeLeadId || "", null);
      await sendAdminNotification(tgMessage, { parseMode: "HTML", replyMarkup: tgKeyboard });
    } catch (tgErr) {}

    return;
  }

  // --- เมนู / Menu ---
  if (
    text === "เมนู" ||
    text.toLowerCase() === "menu" ||
    text === "สวัสดี" ||
    text.toLowerCase() === "hello" ||
    text.toLowerCase() === "hi" ||
    text === "你好"
  ) {
    const { messages } = buildWelcomeFlex(lang);
    await replyMessage(replyToken, messages);
    return;
  }

  // --- Fallback: AI Search ---
  await handleAIResponse(event, text, lang, areaTranslations);
}

// ============================
// Legacy Text Search (Fallback)
// ============================
async function handleTextMessage(
  event: LineEvent,
  text: string,
  lang: BotLang = "th",
  areaTranslations?: AreaTranslations,
) {
  const { replyToken } = event;
  if (!text) return;

  console.log(`Searching for: ${text}`);
  const properties = await searchPropertiesForBot(text);

  if (properties.length === 0) {
    const failTexts: Record<BotLang, string> = {
      th: `ขออภัยค่ะ ไม่พบทรัพย์ที่ตรงกับ "${text}"\n\nลองพิมพ์ชื่อทำเล หรือประเภททรัพย์ เช่น "คอนโด บางนา"\nหรือพิมพ์ "เมนู" เพื่อดูตัวเลือกทั้งหมดค่ะ 😊`,
      en: `Sorry, no properties found matching "${text}"\n\nTry typing a location or type, e.g. "Condo Bangna"\nOr type "menu" to see all options 😊`,
      cn: `很抱歉，没有找到匹配"${text}"的房产\n\n请尝试输入地点或类型\n或输入"menu"查看所有选项 😊`,
      ru: `Извините, объекты по запросу "${text}" не найдены\n\nПопробуйте ввести район или тип недвижимости, например "Condo Bangna"\nИли введите "menu", чтобы увидеть все варианты 😊`,
    };
    await replyText(replyToken, failTexts[lang]);
    return;
  }

  const headerTexts: Record<BotLang, string> = {
    th: `พบ ${properties.length} ทรัพย์ที่ตรงกับ "${text}"`,
    en: `Found ${properties.length} matching "${text}"`,
    cn: `找到 ${properties.length} 个关于 "${text}" 的房产`,
    ru: `Найдено объектов по запросу "${text}": ${properties.length}`,
  };

  const flex = buildPropertyCarousel(
    properties as unknown as PropertyForFlex[],
    headerTexts[lang],
    lang,
    areaTranslations,
  );

  console.log(`[BOT] Replying to text search "${text}" with carousel`);
  const res = await replyMessage(replyToken, [
    {
      type: "text",
      text: `🔎 ${headerTexts[lang]}`,
    },
    flex,
  ]);
  if (!res.success) {
    await pushText(
      event.source.userId || "",
      `ขออภัยค่ะ ไม่สามารถแสดงผลรูปภาพได้ในขณะนี้ (${res.error || "Unknown"})\n\nคำค้นหา: ${text}`,
    );
  }
}

// ============================
// AI Response Handler
// ============================
async function handleAIResponse(
  event: LineEvent,
  text: string,
  lang: BotLang = "th",
  areaTranslations?: AreaTranslations,
) {
  const { replyToken } = event;
  if (!text) return;

  try {
    console.log(`[BOT] AI Search for: ${text} (Lang: ${lang})`);

    // 1. Get AI Response
    // history is empty for now to keep it simple and stateless (stateless webhooks)
    const aiResult = await chatWithAI([], text);

    if (!aiResult) {
      await replyText(replyToken, "ขออภัยค่ะ ระบบ AI ไม่ตอบสนองในขณะนี้");
      return;
    }

    const messages: (FlexMessage | { type: "text"; text: string })[] = [];

    // 2. Add AI Text Response
    if (aiResult.text) {
      messages.push({ type: "text", text: aiResult.text });
    }

    // 3. Add Property Carousel if AI found matching properties
    if (aiResult.properties && aiResult.properties.length > 0) {
      const headerTexts: Record<BotLang, string> = {
        th: `พบ ${aiResult.properties.length} ทรัพย์ที่น่าสนใจสำหรับคุณ`,
        en: `Found ${aiResult.properties.length} matching properties for you`,
        cn: `为您找到 ${aiResult.properties.length} 个匹配的房产`,
        ru: `Найдено подходящих объектов для вас: ${aiResult.properties.length}`,
      };

      const flex = buildPropertyCarousel(
        aiResult.properties as unknown as PropertyForFlex[],
        headerTexts[lang],
        lang,
        areaTranslations,
      );
      messages.push(flex as FlexMessage);
    }

    if (messages.length > 0) {
      // Send up to 5 messages (LINE limit)
      await replyMessage(replyToken, messages.slice(0, 5));
    } else {
      await replyText(replyToken, "ขออภัยค่ะ ไม่พบข้อมูลที่ต้องการ");
    }
  } catch (error: unknown) {
    console.error("[BOT] AI Response Error:", error);
    await replyText(
      replyToken,
      "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล AI: " +
        ((error as Error).message || "Unknown Error"),
    );
  }
}

// ============================
// Reply Helpers
// ============================
async function replyText(replyToken: string, text: string) {
  await replyMessage(replyToken, [{ type: "text", text }]);
}

async function replyMessage(
  replyToken: string,
  messages: (FlexMessage | { type: "text"; text: string })[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = JSON.stringify({ replyToken, messages });
    const res = await fetch(`${LINE_MESSAGING_API}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("LINE API Error Log:");
      console.error("Status:", res.status);
      console.error("Response:", errorText);
      console.error("Payload sent:", body);

      // --- CRITICAL DEBUG ---
      // We don't have the userId here easily, but we can try to push to the user if we can find it
      // For now, most callers of replyMessage are in handle methods where userId is available.
      // Better: The caller should handle the push if replyMessage returns false.
      return { success: false, error: errorText };
    }
    return { success: true };
  } catch (error: unknown) {
    console.error("Reply failed:", error);
    return { success: false, error: (error as Error).message };
  }
}
