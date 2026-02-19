import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { LINE_MESSAGING_API, lineConfig } from "../../../lib/line-config";
import {
  searchPropertiesForBot,
  getDistinctAreasForType,
  searchByTypeAndArea,
  getHotProperties,
} from "@/features/properties/queries.public";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLineProfile, saveOmniMessage } from "@/lib/line";
import { siteConfig } from "@/lib/site-config";
import {
  buildWelcomeFlex,
  buildPropertyTypeQuickReply,
  buildAreaQuickReply,
  buildPropertyCarousel,
  buildContactInfoMessage,
  buildDepositMessage,
  buildNoResultsMessage,
  buildLanguageSelection,
  type BotLang,
} from "@/lib/line-flex-builders";

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
};

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

    console.log("LINE Webhook Received:", JSON.stringify(events, null, 2));

    for (const event of events) {
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
        await handleIncomingChannelMessage(event);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 200 });
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

  const supabase = createAdminClient();
  const { error } = await (supabase as any).from("line_groups").upsert({
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

  const supabase = createAdminClient();
  await (supabase as any)
    .from("line_groups")
    .update({ is_active: false })
    .eq("group_id", groupId);
}

async function handleFollowEvent(event: LineEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  const supabase = createAdminClient();

  // Legacy: Link LINE ID to Admin or First User
  try {
    let { data: admin } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    if (!admin) {
      const { data: firstUser } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();
      admin = firstUser;
    }

    if (admin) {
      await supabase
        .from("profiles")
        .update({ line_id: userId })
        .eq("id", admin.id);
    }
  } catch (err) {
    console.error("Error in legacy follow logic:", err);
  }

  // Send Language Selection first, then Welcome will follow after language is chosen
  try {
    const langMsg = buildLanguageSelection();
    await replyMessage(event.replyToken, [langMsg]);
  } catch (err) {
    console.error("Error sending language selection:", err);
  }
}

async function handleIncomingChannelMessage(event: LineEvent) {
  const userId = event.source.userId;
  const groupId = event.source.groupId || event.source.roomId;
  const text = event.message?.text || "";

  if (!text) return;

  // === SPECIAL COMMANDS ===
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
      const supabase = createAdminClient();
      await (supabase as any)
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

  if (groupId) {
    return; // Silent for group chat
  }

  if (!userId) return;

  const supabase = createAdminClient();

  // Find or Create Lead
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("line_id", userId)
    .single();

  if (!lead) {
    const profile = await getLineProfile(userId);
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        full_name: profile?.displayName || "LINE Contact",
        line_id: userId,
        source: "LINE",
        stage: "NEW",
        note: `Auto-captured from LINE. Profile: ${JSON.stringify(profile)}`,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating auto-lead:", createError);
      return;
    }
    lead = newLead;
  }

  // Log Message
  if (lead) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: "LINE",
      external_message_id: event.message?.id,
      content: text,
      payload: event,
      direction: "INCOMING",
    });
  }

  // Interactive Commands
  const trimmedText = text.trim();
  await handleInteractiveCommand(event, trimmedText, userId);
}

// ============================
// Interactive Command Handler
// ============================
async function handleInteractiveCommand(
  event: LineEvent,
  text: string,
  userId: string,
) {
  const { replyToken } = event;
  const lang = getUserLang(userId);

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

  // --- ภาษา:xx → Set language + send welcome ---
  if (text.startsWith("ภาษา:")) {
    const selectedLang = text.replace("ภาษา:", "").trim() as BotLang;
    if (["th", "en", "cn"].includes(selectedLang)) {
      setUserLang(userId, selectedLang);

      // Confirm + show welcome in new language
      const confirmTexts: Record<BotLang, string> = {
        th: "เปลี่ยนเป็นภาษาไทยแล้วค่ะ 🇹🇭",
        en: "Language changed to English 🇬🇧",
        cn: "已切换为中文 🇨🇳",
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
    const msg = buildPropertyTypeQuickReply(lang);
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

    const msg = buildAreaQuickReply(propertyType, areas, lang);
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
    };

    const flex = buildPropertyCarousel(properties, headerTexts[lang], lang);
    await replyMessage(replyToken, [flex]);
    return;
  }

  // --- Hot Deals ---
  if (
    text === "Hot Deals" ||
    text === "🔥 Hot Deals" ||
    text.toLowerCase().includes("hot deal")
  ) {
    const properties = await getHotProperties();

    if (properties.length === 0) {
      const msg = buildNoResultsMessage(" Hot Deals", lang);
      await replyMessage(replyToken, [msg]);
      return;
    }

    const headerTexts: Record<BotLang, string> = {
      th: `🔥 Hot Deals ${properties.length} รายการ`,
      en: `🔥 ${properties.length} Hot Deals`,
      cn: `🔥 ${properties.length} 个热门优惠`,
    };

    const flex = buildPropertyCarousel(properties, headerTexts[lang], lang);
    await replyMessage(replyToken, [flex]);
    return;
  }

  // --- ติดต่อเจ้าหน้าที่ ---
  if (
    text === "ติดต่อเจ้าหน้าที่" ||
    text === "📞 ติดต่อเจ้าหน้าที่" ||
    text === "ติดต่อ" ||
    text.toLowerCase() === "contact"
  ) {
    const msg = buildContactInfoMessage(lang);
    await replyMessage(replyToken, [msg]);
    return;
  }

  // --- ฝากขาย/เช่า ---
  if (
    text === "ฝากขาย/เช่า" ||
    text === "📝 ฝากขาย/เช่า" ||
    text === "ฝากขาย" ||
    text === "ฝากเช่า" ||
    text === "ฝากทรัพย์" ||
    text.toLowerCase() === "deposit" ||
    text.toLowerCase() === "list"
  ) {
    const msg = buildDepositMessage(lang);
    await replyMessage(replyToken, [msg]);
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
  await handleTextMessage(event, lang);
}

// ============================
// Legacy Text Search (Fallback)
// ============================
async function handleTextMessage(event: LineEvent, lang: BotLang = "th") {
  const { replyToken, message } = event;
  const text = message?.text?.trim() || "";

  if (!text) return;

  console.log(`Searching for: ${text}`);
  const properties = await searchPropertiesForBot(text);

  if (properties.length === 0) {
    const failTexts: Record<BotLang, string> = {
      th: `ขออภัยค่ะ ไม่พบทรัพย์ที่ตรงกับ "${text}"\n\nลองพิมพ์ชื่อทำเล หรือประเภททรัพย์ เช่น "คอนโด บางนา"\nหรือพิมพ์ "เมนู" เพื่อดูตัวเลือกทั้งหมดค่ะ 😊`,
      en: `Sorry, no properties found matching "${text}"\n\nTry typing a location or type, e.g. "Condo Bangna"\nOr type "menu" to see all options 😊`,
      cn: `很抱歉，没有找到匹配"${text}"的房产\n\n请尝试输入地点或类型\n或输入"menu"查看所有选项 😊`,
    };
    await replyText(replyToken, failTexts[lang]);
    return;
  }

  const headerTexts: Record<BotLang, string> = {
    th: `พบ ${properties.length} ทรัพย์ที่เกี่ยวข้อง`,
    en: `Found ${properties.length} matching properties`,
    cn: `找到 ${properties.length} 个相关房产`,
  };

  const flex = buildPropertyCarousel(properties, headerTexts[lang], lang);
  await replyMessage(replyToken, [flex]);
}

// ============================
// Reply Helpers
// ============================
async function replyText(replyToken: string, text: string) {
  await replyMessage(replyToken, [{ type: "text", text }]);
}

async function replyMessage(replyToken: string, messages: any[]) {
  try {
    const res = await fetch(`${LINE_MESSAGING_API}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("LINE API Error:", errorText);
    }
  } catch (error) {
    console.error("Reply functionality failed:", error);
  }
}
