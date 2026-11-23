import { createAdminClient } from "@/lib/supabase/admin";
import { sendLineNotification } from "@/lib/line";
import { sendAdminNotification } from "@/lib/telegram";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import {
  generateRentNotificationFlex,
  generateContractRenewalFlex,
  generateContractExpiryCarouselFlex,
  getLocaleDateFormat,
  type ContractExpiryBubbleItem,
} from "@/features/rent-notifications/utils";
import { NextRequest, NextResponse } from "next/server";

// PERFORMANCE CONFIG
export const maxDuration = 60; // Max allowed execution duration for Vercel Hobby/Pro
const BATCH_SIZE = 5;
const MAX_RUNTIME_MS = 50000; // 50s safety buffer within the 60s window
const DEFAULT_COVER_IMG =
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";

function getBangkokDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

async function pushLineMessageToGroup(groupId: string, flexMessage: Record<string, any>) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [flexMessage],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LINE API ${res.status}: ${errText}`);
  }
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const startTime = performance.now();

  const authHeader = req.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results: Record<string, unknown> = {};

  try {
    // ═══════════════════════════════════════════════
    // TASK 1: Contract Expiry Notifications
    // ═══════════════════════════════════════════════
    results.contractExpiry = await runContractExpiryCheck();

    // ═══════════════════════════════════════════════
    // TASK 2: Trash Cleanup (30+ day old soft-deletes)
    // ═══════════════════════════════════════════════
    results.trashCleanup = await runTrashCleanup();

    // ═══════════════════════════════════════════════
    // TASK 3: Rent Notifications (daily at 9am)
    // ═══════════════════════════════════════════════
    results.rentNotifications = await runRentNotifications(startTime);

    // ═══════════════════════════════════════════════
    // TASK 4: Market Alerts (AVM analysis)
    // ═══════════════════════════════════════════════
    results.marketAlerts = await runMarketAlerts();

    const duration = performance.now() - startTime;
    return NextResponse.json({
      success: true,
      duration_ms: Math.round(duration),
      summary: {
        contractExpiry: results.contractExpiry ? { count: (results.contractExpiry as any).notifications_sent } : null,
        trashCleanup: results.trashCleanup ? { deleted: (results.trashCleanup as any).deleted_count } : null,
        rentNotifications: results.rentNotifications ? { sent: (results.rentNotifications as any).sent } : null,
        marketAlerts: results.marketAlerts ? { alerts: (results.marketAlerts as any).alerts_count } : null,
      }
    });
  } catch (error: unknown) {
    console.error("Unified Cron Job Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        partial_results: results,
      },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────
// TASK 1: Contract Expiry (v3: crm_deals_v3 | 60/30/7d | Telegram + LINE Renewal Funnel)
// ─────────────────────────────────────────────────────
async function runContractExpiryCheck() {
  try {
    const supabase = createAdminClient();
    const bkkNow = getBangkokDate();
    const todayStr = bkkNow.toISOString().split("T")[0];

    const sixtyOneDaysLater = new Date(bkkNow);
    sixtyOneDaysLater.setUTCDate(bkkNow.getUTCDate() + 61);
    const maxDateStr = sixtyOneDaysLater.toISOString().split("T")[0];

    const { data: deals, error } = await (supabase as any)
      .from("crm_deals_v3")
      .select(`
        id, title, property_id, deal_type, status, total_amount, currency, transaction_end_date,
        property:properties_core (
          id, rent_price, currency,
          details:properties_details (title, title_en, title_cn, title_ru),
          media:property_media_v3 (url, is_cover)
        )
      `)
      .not("transaction_end_date", "is", null)
      .gte("transaction_end_date", todayStr)
      .lte("transaction_end_date", maxDateStr)
      .in("status", ["CLOSED_WIN", "ACTIVE", "SIGNED", "WON"])
      .order("transaction_end_date", { ascending: true });

    if (error) {
      if ((error as any).code === "PGRST205") {
        console.warn("[Cron Contract Expiry] Table crm_deals_v3 not found, skipping.");
        return { message: "Table crm_deals_v3 not found, skipped", count: 0, skipped: true };
      }
      throw error;
    }

    if (!deals || deals.length === 0) {
      return { message: "No expiring contracts in 60-day window", notifications_sent: 0 };
    }

    // Only alert on 3 high-value milestones: 60d (renewal check), 30d (confirm/relist), 7d (handover)
    const SMART_MILESTONES = [60, 30, 7];
    const todayMs = Date.UTC(bkkNow.getUTCFullYear(), bkkNow.getUTCMonth(), bkkNow.getUTCDate());

    const matchedDeals = deals
      .map((deal: any) => {
        const [y, m, d] = String(deal.transaction_end_date).split("-").map(Number);
        const endMs = Date.UTC(y, (m || 1) - 1, d || 1);
        const daysUntilExpiry = Math.round((endMs - todayMs) / (1000 * 60 * 60 * 24));
        return { ...deal, daysUntilExpiry };
      })
      .filter((d: any) => SMART_MILESTONES.includes(d.daysUntilExpiry));

    if (matchedDeals.length === 0) {
      return { message: "No contracts hitting 60/30/7-day milestones today", notifications_sent: 0 };
    }

    // Lookup linked LINE groups from rent_notification_rules_v3 for 60-day 1-click renewal cards
    const propIds = matchedDeals.map((d: any) => d.property_id).filter(Boolean);
    const propChannelMap = new Map<string, { groupId: string; language: "th" | "en" | "cn" | "ru" }>();

    if (propIds.length > 0) {
      const { data: linkedRules } = await (supabase as any)
        .from("rent_notification_rules_v3")
        .select("property_id, language, channel:notification_channels_v3(external_channel_id, platform, is_active)")
        .in("property_id", propIds)
        .eq("is_active", true);

      for (const r of linkedRules || []) {
        const ch = Array.isArray(r.channel) ? r.channel[0] : r.channel;
        if (ch?.is_active && ch?.platform === "LINE" && ch?.external_channel_id) {
          propChannelMap.set(r.property_id, {
            groupId: ch.external_channel_id,
            language: (r.language as "th" | "en" | "cn" | "ru") || "th",
          });
        }
      }
    }

    const carouselItems: ContractExpiryBubbleItem[] = [];
    const telegramLines: string[] = [
      `<b>📋 สรุปสัญญาเช่าใกล้ครบกำหนด (${matchedDeals.length} รายการ)</b>`,
      `วันที่: ${todayStr}`,
      "",
    ];

    let tenantRenewalSent = 0;

    for (const deal of matchedDeals) {
      const prop = Array.isArray(deal.property) ? deal.property[0] : deal.property;
      const details = Array.isArray(prop?.details) ? prop.details[0] : prop?.details;
      const media = Array.isArray(prop?.media) ? prop.media : [];
      const rawCover = media.find((m: any) => m.is_cover)?.url || media[0]?.url;
      const coverImageUrl = rawCover ? (getPublicImageUrl(rawCover) || DEFAULT_COVER_IMG) : DEFAULT_COVER_IMG;

      const linked = deal.property_id ? propChannelMap.get(deal.property_id) : undefined;
      const lang = linked?.language || "th";
      const propName =
        (lang === "en" ? details?.title_en : lang === "cn" ? details?.title_cn : lang === "ru" ? details?.title_ru : details?.title) ||
        details?.title ||
        deal.title ||
        "ทรัพย์สิน";

      const rentAmount = prop?.rent_price || deal.total_amount;
      const rentStr = rentAmount ? `฿${Number(rentAmount).toLocaleString()}/เดือน` : "-";
      const badge = deal.daysUntilExpiry <= 7 ? "🔴 7 วัน" : deal.daysUntilExpiry <= 30 ? "🟠 30 วัน" : "🔵 60 วัน";

      telegramLines.push(
        `${badge} | <b>${propName}</b>`,
        `   • หมดสัญญา: <code>${deal.transaction_end_date}</code> | ค่าเช่า: ${rentStr}`,
      );

      const bubbleItem: ContractExpiryBubbleItem = {
        dealId: deal.id,
        propertyName: propName,
        coverImageUrl,
        endDate: deal.transaction_end_date,
        daysUntilExpiry: deal.daysUntilExpiry,
        rentPrice: rentStr,
        language: lang,
      };
      carouselItems.push(bubbleItem);

      // Feature #7: On 60-day milestone, push 1-click Renewal Funnel Flex to tenant LINE group
      if (deal.daysUntilExpiry === 60 && linked?.groupId) {
        try {
          const renewalFlex = generateContractRenewalFlex(bubbleItem);
          await pushLineMessageToGroup(linked.groupId, renewalFlex);
          tenantRenewalSent += 1;
        } catch (lineErr) {
          console.error(`[Cron Contract 60d] Failed LINE push for deal ${deal.id}:`, lineErr);
        }
      }
    }

    // Feature #1 & #2: Internal Team alert via FREE Telegram (0 LINE quota); fallback to 1 bundled LINE Carousel
    let adminNotifiedVia = "none";
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_GROUP_ID) {
      await sendAdminNotification(telegramLines.join("\n"), { parseMode: "HTML" });
      adminNotifiedVia = "telegram";
    } else if (carouselItems.length > 0) {
      const carouselFlex = generateContractExpiryCarouselFlex(carouselItems);
      await sendLineNotification(carouselFlex as any);
      adminNotifiedVia = "line_carousel";
    }

    return {
      total_contracts: matchedDeals.length,
      notifications_sent: tenantRenewalSent + (adminNotifiedVia !== "none" ? 1 : 0),
      tenant_renewal_cards_sent: tenantRenewalSent,
      admin_channel: adminNotifiedVia,
    };
  } catch (error: any) {
    if (error?.code === "PGRST205") {
      console.warn("[Cron Contract Expiry] Table not in database, skipping gracefully.");
      return { skipped: true, reason: "table_not_found" };
    }
    console.error("Contract expiry error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─────────────────────────────────────────────────────
// TASK 2: Trash Cleanup
// ─────────────────────────────────────────────────────
async function runTrashCleanup() {
  try {
    const supabase = createAdminClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // Direct delete in properties_core without fetching thousands of records into memory first
    const { data: deleted, error: deleteError } = await supabase
      .from("properties_core")
      .delete()
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgoStr)
      .select("id");

    if (deleteError) throw deleteError;

    const count = deleted?.length || 0;
    return { deleted_count: count, message: count === 0 ? "No trash to clean" : `Deleted ${count} properties` };
  } catch (error: unknown) {
    console.error("Trash cleanup error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─────────────────────────────────────────────────────
// TASK 3: Rent Notifications (v3: rent_notification_rules_v3 | Paid-Stop | Day+3 Escalation | Multi-Lang | Idempotency)
// ─────────────────────────────────────────────────────
async function runRentNotifications(startTime: number) {
  try {
    const supabase = createAdminClient();
    const bkkNow = getBangkokDate();
    const currentDay = bkkNow.getUTCDate();
    const currentYearMonth = bkkNow.toISOString().slice(0, 7); // YYYY-MM in Bangkok time
    const monthStartIso = `${currentYearMonth}-01T00:00:00+07:00`;

    const tomorrow = new Date(bkkNow);
    tomorrow.setUTCDate(bkkNow.getUTCDate() + 1);
    const isLastDayOfMonth = tomorrow.getUTCDate() === 1;

    // Day +3 overdue check (3 days ago in Bangkok time)
    const threeDaysAgo = new Date(bkkNow);
    threeDaysAgo.setUTCDate(bkkNow.getUTCDate() - 3);
    const overdueDay = threeDaysAgo.getUTCDate();
    const overdueYearMonth = threeDaysAgo.toISOString().slice(0, 7);

    // 1. Fetch all active v3 rules with channel + property + deal details in 1 query
    const { data: allActiveRules, error } = await (supabase as any)
      .from("rent_notification_rules_v3")
      .select(`
        id, property_id, channel_id, notification_day, notification_hour, language, is_active, last_sent_at, tenant_id,
        channel:notification_channels_v3!inner (id, platform, external_channel_id, channel_name, is_active),
        property:properties_core!inner (
          id, rent_price, currency, bedrooms, bathrooms, floor_area,
          details:properties_details (title, title_en, title_cn, title_ru),
          media:property_media_v3 (url, is_cover),
          deals:crm_deals_v3 (transaction_end_date, status)
        )
      `)
      .eq("is_active", true);

    if (error) {
      if ((error as any).code === "PGRST205") {
        console.warn("[Cron Rent Notifications] Table rent_notification_rules_v3 not found, skipping.");
        return { message: "Table rent_notification_rules_v3 not found, skipped", sent: 0, skipped: true };
      }
      throw error;
    }

    if (!allActiveRules || allActiveRules.length === 0) {
      return { message: "No active v3 rent notification rules", sent: 0 };
    }

    // 2. Fetch this month history logs for Smart Paid-Stop + Idempotency + Overdue check
    const { data: monthHistory } = await (supabase as any)
      .from("rent_notification_history_v3")
      .select("rule_id, status, sent_at, created_at")
      .gte("created_at", monthStartIso);

    const historyByRule = new Map<string, Array<{ status: string | null; sent_at: string | null }>>();
    for (const h of monthHistory || []) {
      if (!h.rule_id) continue;
      const list = historyByRule.get(h.rule_id) || [];
      list.push(h);
      historyByRule.set(h.rule_id, list);
    }

    const dueTodayRules: any[] = [];
    const overdueForAdmin: Array<{ propName: string; channelName: string; rentStr: string; day: number }> = [];
    let skippedAlreadySentOrPaid = 0;

    for (const rule of allActiveRules) {
      const ch = Array.isArray(rule.channel) ? rule.channel[0] : rule.channel;
      if (!ch?.is_active || ch?.platform !== "LINE" || !ch?.external_channel_id) continue;

      const ruleLogs = historyByRule.get(rule.id) || [];
      const isPaidThisMonth = ruleLogs.some((l) => l.status === "PAID");
      const hasSuccessThisMonth = ruleLogs.some((l) => l.status === "SUCCESS");

      // Feature #9: Idempotency Guard via last_sent_at (Bangkok YYYY-MM)
      let sentThisMonthByTimestamp = false;
      if (rule.last_sent_at) {
        const sentBkk = new Date(new Date(rule.last_sent_at).getTime() + 7 * 60 * 60 * 1000);
        sentThisMonthByTimestamp = sentBkk.toISOString().slice(0, 7) === currentYearMonth;
      }

      const notifDay = Number(rule.notification_day || 1);
      const isDueToday = isLastDayOfMonth ? notifDay >= currentDay : notifDay === currentDay;

      if (isDueToday) {
        // Feature #5 (Smart Paid-Stop) + Feature #9 (Idempotency Guard)
        if (isPaidThisMonth || hasSuccessThisMonth || sentThisMonthByTimestamp) {
          skippedAlreadySentOrPaid += 1;
          continue;
        }
        dueTodayRules.push(rule);
      } else if (
        overdueYearMonth === currentYearMonth &&
        notifDay === overdueDay &&
        (hasSuccessThisMonth || sentThisMonthByTimestamp) &&
        !isPaidThisMonth
      ) {
        // Feature #6: Day +3 Overdue Auto-Escalation -> Internal Telegram (0 LINE quota!)
        const prop = Array.isArray(rule.property) ? rule.property[0] : rule.property;
        const details = Array.isArray(prop?.details) ? prop.details[0] : prop?.details;
        overdueForAdmin.push({
          propName: details?.title || "ทรัพย์สิน",
          channelName: ch.channel_name || ch.external_channel_id,
          rentStr: prop?.rent_price ? `฿${Number(prop.rent_price).toLocaleString()}` : "-",
          day: notifDay,
        });
      }
    }

    // 3. Send due today rent notifications in safe batches
    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dueTodayRules.length; i += BATCH_SIZE) {
      if (performance.now() - startTime > MAX_RUNTIME_MS) break;

      const batch = dueTodayRules.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (rule) => {
          const ch = Array.isArray(rule.channel) ? rule.channel[0] : rule.channel;
          const prop = Array.isArray(rule.property) ? rule.property[0] : rule.property;
          const details = Array.isArray(prop?.details) ? prop.details[0] : prop?.details;
          const media = Array.isArray(prop?.media) ? prop.media : [];
          const deals = Array.isArray(prop?.deals) ? prop.deals : [];

          const lang = (["th", "en", "cn", "ru"].includes(rule.language) ? rule.language : "th") as "th" | "en" | "cn" | "ru";
          const propName =
            (lang === "en" ? details?.title_en : lang === "cn" ? details?.title_cn : lang === "ru" ? details?.title_ru : details?.title) ||
            details?.title ||
            "Property";

          const rawCover = media.find((m: any) => m.is_cover)?.url || media[0]?.url;
          const coverImageUrl = rawCover ? (getPublicImageUrl(rawCover) || DEFAULT_COVER_IMG) : DEFAULT_COVER_IMG;
          const price = prop?.rent_price ? `${Number(prop.rent_price).toLocaleString()} ${prop?.currency || "THB"}` : "-";

          const locale = getLocaleDateFormat(lang);
          const monthYear = bkkNow.toLocaleDateString(locale, { month: "long", year: "numeric" });
          const activeDeal = deals.find((d: any) => d.transaction_end_date) || deals[0];
          const contractEndDate = activeDeal?.transaction_end_date
            ? new Date(activeDeal.transaction_end_date).toLocaleDateString(locale)
            : "-";

          // Feature #3 (Interactive Reply API Buttons) + Feature #8 (Multi-Language)
          const flexMsg = generateRentNotificationFlex({
            propertyName: propName,
            price,
            coverImageUrl,
            bedrooms: prop?.bedrooms ?? "-",
            bathrooms: prop?.bathrooms ?? "-",
            sizeSqm: prop?.floor_area ?? "-",
            monthYear,
            contractEndDate,
            language: lang,
            ruleId: rule.id,
          });

          try {
            await pushLineMessageToGroup(ch.external_channel_id, flexMsg);
            const sentIso = new Date().toISOString();

            await Promise.all([
              (supabase as any)
                .from("rent_notification_rules_v3")
                .update({ last_sent_at: sentIso })
                .eq("id", rule.id),
              (supabase as any)
                .from("rent_notification_history_v3")
                .insert({
                  rule_id: rule.id,
                  property_id: rule.property_id,
                  channel_id: rule.channel_id,
                  tenant_id: rule.tenant_id,
                  status: "SUCCESS",
                  sent_at: sentIso,
                }),
            ]);
            sentCount += 1;
          } catch (sendErr: any) {
            errorCount += 1;
            const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
            console.error(`[Cron Rent v3] Failed rule ${rule.id}:`, errMsg);
            await (supabase as any)
              .from("rent_notification_history_v3")
              .insert({
                rule_id: rule.id,
                property_id: rule.property_id,
                channel_id: rule.channel_id,
                tenant_id: rule.tenant_id,
                status: "FAILED",
                error_message: errMsg.slice(0, 500),
              });
          }
        }),
      );
    }

    // 4. Send consolidated Day +3 Overdue Escalation to Admin Telegram (0 LINE quota!)
    if (overdueForAdmin.length > 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_GROUP_ID) {
      const lines = [
        `<b>⏰ แจ้งเตือนค่าเช่าเกินกำหนด +3 วัน (${overdueForAdmin.length} ห้อง)</b>`,
        `<i>(ระบบไม่ทวงซ้ำใน LINE ลูกค้า เพื่อให้แอดมินติดตามอย่างสุภาพ)</i>`,
        "",
        ...overdueForAdmin.map(
          (o, idx) => `${idx + 1}. <b>${o.propName}</b> — ${o.rentStr} (ครบกำหนดวันที่ ${o.day}) | กลุ่ม: ${o.channelName}`,
        ),
      ];
      await sendAdminNotification(lines.join("\n"), { parseMode: "HTML" });
    }

    return {
      processed: dueTodayRules.length,
      sent: sentCount,
      error: errorCount,
      skipped_paid_or_sent: skippedAlreadySentOrPaid,
      overdue_escalated_telegram: overdueForAdmin.length,
    };
  } catch (error: any) {
    if (error?.code === "PGRST205") {
      console.warn("[Cron Rent Notifications] Table not in database, skipping gracefully.");
      return { skipped: true, reason: "table_not_found" };
    }
    console.error("Rent notifications error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─────────────────────────────────────────────────────
// TASK 4: Market Alerts (Analysis of High Prices)
// ─────────────────────────────────────────────────────
async function runMarketAlerts() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch currently active properties
    const { data: activeProperties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        "id, title, listing_type, original_price, size_sqm, popular_area, district, property_type, created_by",
      )
      .eq("status", "ACTIVE")
      .not("size_sqm", "is", null)
      .not("original_price", "is", null);

    if (propertiesError) {
      if ((propertiesError as any).code === "PGRST205") {
        console.warn("[Cron] View/Table 'properties' not found in schema cache, skipping market alerts.");
        return { message: "Table 'properties' not found, skipped", skipped: true };
      }
      throw propertiesError;
    }
    if (!activeProperties || activeProperties.length === 0) {
      return { message: "No active properties to analyze" };
    }

    // 2. Fetch recent closed deals
    const { data: closedDeals, error: dealsError } = await supabase
      .from("deals")
      .select(
        "property_id, status, properties(size_sqm, popular_area, district, property_type, original_price)",
      )
      .eq("status", "CLOSED_WIN")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dealsError) {
      if ((dealsError as any).code === "PGRST205") {
        console.warn("[Cron] View/Table 'deals' not found in schema cache, skipping market alerts.");
        return { message: "Table 'deals' not found, skipped", skipped: true };
      }
      throw dealsError;
    }

    // 3. Group closed deals by Area + PropertyType
    const marketAverages: Record<
      string,
      { totalValue: number; totalSqm: number; count: number }
    > = {};

    closedDeals?.forEach((deal) => {
      const prop = (
        Array.isArray(deal.properties) ? deal.properties[0] : deal.properties
      ) as { size_sqm: number | null; original_price: number | null; popular_area: string | null; district: string | null; property_type: string | null };
      if (!prop || !prop.size_sqm || !prop.original_price) return;

      const area = prop.popular_area || prop.district;
      if (!area) return;

      const key = `${area}-${prop.property_type}`;
      const dealValue = Number(prop.original_price) || 0;

      if (dealValue <= 0) return;

      if (!marketAverages[key]) {
        marketAverages[key] = { totalValue: 0, totalSqm: 0, count: 0 };
      }

      marketAverages[key].totalValue += dealValue;
      marketAverages[key].totalSqm += prop.size_sqm;
      marketAverages[key].count += 1;
    });

    const alertsToInsert: any[] = [];

    // 4. Compare vs Market Average
    for (const property of activeProperties) {
      const area = property.popular_area || property.district;
      if (!area || !property.size_sqm || !property.original_price) continue;

      const key = `${area}-${property.property_type}`;
      const marketData = marketAverages[key];

      if (marketData && marketData.count >= 2) {
        const avgMarketPricePerSqm =
          marketData.totalValue / marketData.totalSqm;
        const originalPrice = Number(property.original_price);
        const sizeSqm = Number(property.size_sqm);

        if (originalPrice <= 0 || sizeSqm <= 0 || avgMarketPricePerSqm <= 0)
          continue;

        const currentPropertyPricePerSqm = originalPrice / sizeSqm;
        const diffPercent =
          ((currentPropertyPricePerSqm - avgMarketPricePerSqm) /
            avgMarketPricePerSqm) *
          100;

        if (diffPercent > 15) {
          alertsToInsert.push({
            action: "MARKET_DROP_ALERT",
            entity_table: "properties",
            entity_id: property.id,
            actor_id: property.created_by || null,
            new_data: {
              diff_percent: diffPercent,
              current_price: property.original_price,
              market_avg_sqm: avgMarketPricePerSqm,
              prop_avg_sqm: currentPropertyPricePerSqm,
              message: `ราคาตั้งขายสูงกว่าค่าเฉลี่ยตลาด ${Math.round(diffPercent)}%`,
            },
          });
        }
      }
    }

    if (alertsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("system_audit_logs_v3")
        .insert(alertsToInsert);
      if (insertError) {
        console.error("Failed to batch insert market alerts:", insertError);
      }
    }

    return {
      success: true,
      alerts_count: alertsToInsert.length,
    };
  } catch (error: unknown) {
    console.error("Market alerts error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
