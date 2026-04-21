import { NextRequest, NextResponse ,after} from "next/server";
import { Bot, webhookCallback } from "grammy";
import { redis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { 
  formatPropertyDetail, 
  buildPropertyKeyboard, 
  formatDailyReport 
} from "@/lib/telegram-formatters";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { logAudit, type MinimalAuditContext } from "@/lib/audit";

// ⚡ Enable Vercel Edge Runtime for Low Latency (No Cold Starts)
export const runtime = "edge";

// 🌐 1. Types & Context Definition
// Using Supabase generated types for maximum precision
type AdminClient = ReturnType<typeof createAdminClient>;

interface BotContextFlavor {
  userProfile?: {
    id: string;
    role: string;
    full_name: string | null;
  };
  adminSupabase?: AdminClient;
}

import { Context } from "grammy";
type MyContext = Context & BotContextFlavor;

// 🌐 2. Global Instance Sharing
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing");

const bot = new Bot<MyContext>(token);

// Shared Supabase Admin (Singleton-like pattern for Edge)
let globalAdminClient: AdminClient | null = null;

const getAdminClient = async (): Promise<AdminClient> => {
  if (!globalAdminClient) {
    globalAdminClient = createAdminClient();
  }
  return globalAdminClient;
};

// 🛡️ Middleware 1: Idempotency (Deduplication)
bot.use(async (ctx, next) => {
  const updateId = ctx.update.update_id.toString();
  const lockKey = `webhook:tg:${updateId}`;
  
  if (redis) {
    try {
      const isNew = await redis.set(lockKey, "1", { nx: true, ex: 86400 });
      if (!isNew) {
        console.log(`[TG-BOT] Duplicate event skipped: ${updateId}`);
        return;
      }
    } catch (e) {
      console.error("[TG-BOT] Redis Error (Fail-Open):", e);
    }
  }
  await next();
});

// 🛡️ Middleware 2: Back-office Authorization (Staff Only)
bot.use(async (ctx, next) => {
  const tgId = ctx.from?.id.toString();
  if (!tgId) return;

  const supabase = await getAdminClient();
  
  // Check if this Telegram ID belongs to a staff member
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("telegram_id", tgId)
    .maybeSingle();

  if (error) {
    console.error("[TG-BOT] Auth Check Error:", error);
    return;
  }

  // Define allowed roles for Back-office access
  const ALLOWED_ROLES = ["ADMIN", "AGENT", "STAFF", "MANAGER"];
  const isAuthorized = profile && ALLOWED_ROLES.includes(profile.role);

  if (!isAuthorized && ctx.chat?.type === "private") {
    return ctx.reply(
      "❌ <b>ขออภัย คุณไม่มีสิทธิ์เข้าถึงระบบ Back-office</b>\n\nหากคุณเป็นเจ้าหน้าที่ กรุณาแจ้ง Admin เพื่อลงทะเบียน Telegram ID ของคุณในระบบ CRM ครับ", 
      { parse_mode: "HTML" }
    );
  }

  if (!isAuthorized) return; // Ignore in groups/channels if not authorized
 
  // 🛡️ Elite Pattern: Strictly Typed Context (No more 'any')
  ctx.userProfile = profile;
  ctx.adminSupabase = supabase; 
  await next();
});

// 🚀 Start Command
bot.command("start", (ctx) => {
  return ctx.reply(
    `📟 <b>ยินดีต้อนรับสู่ VCC Back-office</b>\n\nระบบจัดการหลังบ้านผ่าน Telegram พร้อมใช้งานแล้วครับ\n\n<b>คำสั่งแนะนำ:</b>\n/check [ID] - ตรวจสอบข้อมูลทรัพย์สิน\n/report - สรุปรายงานประจำวัน\n/me - ดูสถานะบัญชีของคุณ\n/help - ดูวิธีใช้งานทั้งหมด`,
    { parse_mode: "HTML" }
  );
});

// ❓ Help Command
bot.command("help", (ctx) => {
  return ctx.reply(
    `📖 <b>คู่มือการใช้งาน VCC Back-office Bot</b>\n━━━━━━━━━━━━━━━━━━\n\n<b>คำสั่งทั่วไป:</b>\n• /check [ID] - ดูข้อมูลทรัพย์สินเชิงลึก\n• /report - สรุปยอด Lead และทรัพย์สินรายวัน\n• /me - ตรวจสอบข้อมูลสิทธิ์ของคุณ\n\n<b>การจัดการงาน:</b>\n• กดปุ่ม <b>"รับงาน (Claim)"</b> ในกลุ่มเพื่อแจ้งทีมงานว่าคุณดูแลเคสนี้แล้ว\n• กดปุ่ม <b>"ปิดการขาย (Sold)"</b> เพื่ออัปเดตสถานะทรัพย์สินทันที\n\n<b>สำหรับ ADMIN:</b>\n• /broadcast [ข้อความ] - ส่งประกาศหาเจ้าหน้าที่ทุกคนผ่านแชทส่วนตัว`,
    { parse_mode: "HTML" }
  );
});

// 👤 Me Command
bot.command("me", (ctx) => {
  const profile = ctx.userProfile;
  const isGroup = ctx.chat?.type !== "private";
  
  if (!profile) return;

  return ctx.reply(
    `👤 <b>ข้อมูลบัญชีและแชท</b>\n\n<b>ชื่อ:</b> ${profile.full_name || "ไม่ระบุ"}\n<b>บทบาท:</b> <code>${profile.role}</code>\n<b>Telegram ID:</b> <code>${ctx.from?.id}</code>\n\n<b>ที่อยู่แชทนี้ (Chat ID):</b> <code>${ctx.chat.id}</code>\n${isGroup ? "<i>(คัดลอก ID นี้ไปอัปเดตที่ <b>Vercel Dashboard</b> ตัวแปร <code>TELEGRAM_ADMIN_GROUP_ID</code> เพื่อย้ายกลุ่มแจ้งเตือน)</i>" : ""}\n\n✅ เชื่อมต่อระบบ Back-office เรียบร้อยแล้ว`,
    { parse_mode: "HTML" }
  );
});

// 🔍 Check Property Command
bot.command("check", async (ctx) => {
  const propertyId = ctx.match?.trim();
  if (!propertyId) return ctx.reply("💡 กรุณาระบุรหัสทรัพย์ เช่น <code>/check 123</code>", { parse_mode: "HTML" });

  const supabase = ctx.adminSupabase;
  if (!supabase) return;
  
  // Fetch property including images
  const { data: prop, error } = await supabase
    .from("properties")
    .select(`
      *,
      property_images (
        image_url,
        is_cover,
        sort_order
      )
    `)
    .eq("id", propertyId)
    .maybeSingle();

  if (error) return ctx.reply(`❌ เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
  if (!prop) return ctx.reply(`🔍 ไม่พบทรัพย์รหัส <b>${propertyId}</b> ในระบบครับ`, { parse_mode: "HTML" });

  const message = formatPropertyDetail(prop);
  const keyboard = buildPropertyKeyboard(prop.id);

  // 🖼️ Handle Property Image (Cover or First one)
  const rawImageUrl = prop.property_images?.find((img: any) => img.is_cover)?.image_url 
                 || prop.property_images?.[0]?.image_url;
  
  if (rawImageUrl) {
    // 🖼️ Optimized for Telegram: 800px width for faster loading (Edge Transformation)
    const imageUrl = getPublicImageUrl(rawImageUrl, "property-images", { width: 800, quality: 80 });
    return ctx.replyWithPhoto(imageUrl, {
      caption: message,
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  }

  return ctx.reply(message, { 
    parse_mode: "HTML",
    reply_markup: keyboard
  });
});

// 📊 Daily Report Command
bot.command("report", async (ctx) => {
  const supabase = ctx.adminSupabase;
  if (!supabase) return;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  // 🚀 Robust Parallel Execution: Fetch all counts simultaneously with independent error handling
  const [newLeadsResult, activePropsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")
  ]);

  // Check errors independently to provide a robust response
  if (newLeadsResult.error) console.error("[TG-BOT] Report: Leads fetch error:", newLeadsResult.error);
  if (activePropsResult.error) console.error("[TG-BOT] Report: Properties fetch error:", activePropsResult.error);

  const reportData = {
    newLeads: newLeadsResult.count || 0,
    newBookings: 0, // Placeholder
    activeProperties: activePropsResult.count || 0,
    totalTeamActions: 0, // Placeholder
  };

  const message = formatDailyReport(reportData);
  return ctx.reply(message, { parse_mode: "HTML" });
});

// 📢 Broadcast Command (Admin Only)
bot.command("broadcast", async (ctx) => {
  const profile = ctx.userProfile;
  const supabase = ctx.adminSupabase;
  
  if (!profile || !supabase) return;
  if (profile.role !== "ADMIN") return;

  const msg = ctx.match?.trim();
  if (!msg) return ctx.reply("💡 กรุณาพิมพ์ข้อความที่ต้องการประกาศ เช่น <code>/broadcast แจ้งประชุมด่วนครับ</code>", { parse_mode: "HTML" });

  // ⚡ Lightweight Select: Only fetch IDs needed for broadcasting
  const { data: staff, error } = await supabase
    .from("profiles")
    .select("telegram_id, full_name")
    .not("telegram_id", "is", null);

  if (error) return ctx.reply("❌ ไม่สามารถดึงข้อมูลพนักงานได้");

  let successCount = 0;
  for (const s of staff || []) {
    try {
      if (s.telegram_id) {
        await ctx.api.sendMessage(s.telegram_id, `📢 <b>ประกาศจาก Admin (${profile.full_name}):</b>\n\n${msg}`, { parse_mode: "HTML" });
        successCount++;
      }
    } catch (e) {
      console.warn(`[BROADCAST] Failed to send to ${s.full_name} (${s.telegram_id})`);
    }
  }

  return ctx.reply(`✅ ส่งประกาศถึงเจ้าหน้าที่เรียบร้อยแล้ว (${successCount}/${staff?.length} ท่าน)`);
});

// 🖱️ Callback Query Handlers (Claim, Sold, Confirm)
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const profile = ctx.userProfile;
  const supabase = ctx.adminSupabase;
  
  if (!profile || !supabase) return;

  const adminName = profile.full_name || "Agent";

  // Explicit Audit Context Type: Strongly Typed & No more 'any'
  const auditCtx: MinimalAuditContext = { 
    supabase, 
    user: { id: profile.id } 
  };

  // 🙋‍♂️ Case: Claim Lead
  if (data.startsWith("claim_lead:")) {
    const leadId = data.split(":")[1];

    // Double-claim prevention: only update if currently unassigned
    const { data: updatedLead, error } = await supabase
      .from("leads")
      .update({ assigned_to: profile.id, stage: "CONTACTED" })
      .eq("id", leadId)
      .is("assigned_to", null) 
      .select("full_name")
      .maybeSingle();

    if (error) return ctx.answerCallbackQuery("❌ เกิดข้อผิดพลาดในการรับงาน");
    
    if (!updatedLead) {
      return ctx.answerCallbackQuery("⚠️ มีคนตัดหน้าคุณไปแล้วครับ! เคสนี้มีคนดูแลแล้ว");
    }

    // 🛡️ Edge Safe: Ensure background logging finishes via unstable_after
    after(() => {
      logAudit(auditCtx, {
        action: "lead.update",
        entity: "leads",
        entityId: leadId,
        summary: `เจ้าหน้าที่ ${adminName} รับงาน Lead: ${updatedLead?.full_name || leadId} ผ่าน Telegram`
      });
    });

    // Update message to notify everyone in group
    await ctx.editMessageText(`✅ <b>คุณ ${adminName} รับงานนี้ไปดูแลแล้วครับ</b>\n━━━━━━━━━━━━━━━━━━\n\n<i>ลุยเลยทีมงาน! VCC Asset สู้ๆ 🚀</i>`, { parse_mode: "HTML" });
    return ctx.answerCallbackQuery("รับงานเรียบร้อย! ลุยเลยครับ 🚀");
  }

  // ❌ Case: Sold Property
  if (data.startsWith("sold_prop:")) {
    const propId = data.split(":")[1];

    const { error } = await supabase
      .from("properties")
      .update({ status: "SOLD" })
      .eq("id", propId);

    if (error) return ctx.answerCallbackQuery("❌ ไม่สามารถอัปเดตสถานะทรัพย์ได้");

    // 🛡️ Edge Safe: Background Audit Logging
    after(() => {
      logAudit(auditCtx, {
        action: "property.status.update",
        entity: "properties",
        entityId: propId,
        summary: `เจ้าหน้าที่ ${adminName} ปิดการขายทรัพย์รหัส ${propId} ผ่าน Telegram`
      });
    });

    await ctx.editMessageText(`🎉 <b>ปิดการขายได้สำเร็จ!</b>\nทรัพย์รหัส: <code>${propId}</code>\nโดย: ${adminName}\n\n<i>ยินดีด้วยกับความสำเร็จครั้งนี้ครับ! 🎊</i>`, { parse_mode: "HTML" });
    return ctx.answerCallbackQuery(`ปิดการขายเรียบร้อย! 🎉`);
  }

  // ✅ Case: Confirm/Verify Property
  if (data.startsWith("confirm_prop:")) {
    const propId = data.split(":")[1];

    // 🛡️ Edge Safe: Background Audit Logging
    after(() => {
      logAudit(auditCtx, {
        action: "property.update",
        entity: "properties",
        entityId: propId,
        summary: `เจ้าหน้าที่ ${adminName} ยืนยันข้อมูลทรัพย์สินถูกต้อง (Verified) ผ่าน Telegram`
      });
    });

    return ctx.answerCallbackQuery("ยืนยันข้อมูลเรียบร้อย ขอบคุณครับ 🙏");
  }
});

// 🛠️ Webhook Export
export async function POST(req: NextRequest) {
  // Security: Check for secret token in URL
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn("[TG-BOT] Unauthorized webhook attempt (invalid secret)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await webhookCallback(bot, "std/http")(req);
  } catch (err) {
    console.error("[TG-BOT] Webhook Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
