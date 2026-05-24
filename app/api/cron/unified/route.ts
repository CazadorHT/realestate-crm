import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLineNotification } from "@/lib/line";
import { siteConfig } from "@/lib/site-config";
import {
  generateRentNotificationFlex,
  getLocaleDateFormat,
  getPropertyDisplayInfo,
} from "@/features/rent-notifications/utils";
import type { CronContract, CronRule } from "@/lib/supabase/types-helper";

import { FlexMessage, FlexBubble } from "@line/bot-sdk";

// EXTENDED TYPES FOR LINE SDK
interface ExtendedFlexMessage extends FlexMessage {
  contents: FlexBubble;
}

// PERFORMANCE CONFIG
const BATCH_SIZE = 5;
const MAX_RUNTIME_MS = 50000; // 50s (Vercel Pro = 60s, Hobby = 60s for cron)

export async function GET(req: NextRequest) {
  const startTime = performance.now();

  // 1. Verify Secret
  const secret = req.nextUrl.searchParams.get("secret");
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;

  const isValid =
    !expectedSecret ||
    secret === expectedSecret ||
    authHeader === `Bearer ${expectedSecret}`;

  if (!isValid) {
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
      results,
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
// TASK 1: Contract Expiry
// ─────────────────────────────────────────────────────
async function runContractExpiryCheck() {
  try {
    const supabase = createAdminClient();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const todayStr = now.toISOString().split("T")[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

    const { data: expiringContracts, error } = await supabase
      .from("rental_contracts")
      .select(
        "id, deal_id, end_date, start_date, rent_price, deals(property_id, properties(id, title, images))",
      )
      .eq("status", "ACTIVE")
      .not("end_date", "is", null)
      .gte("end_date", todayStr)
      .lte("end_date", thirtyDaysStr)
      .order("end_date", { ascending: true });

    if (error) throw error;
    if (!expiringContracts || expiringContracts.length === 0) {
      return { message: "No expiring contracts", count: 0 };
    }

    const notifications = [];

    for (const contract of expiringContracts) {
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const notificationDays = [30, 21, 14, 7, 3, 1];
      const shouldNotify = notificationDays.some(
        (day) => Math.abs(daysUntilExpiry - day) <= 1,
      );

      if (shouldNotify) {
        const property = (contract.deals as unknown as { properties: { id: string; title: string | null; images: any[] } | null })?.properties;
        const propertyTitle = property?.title || "ทรัพย์สิน";
        const propertyId = property?.id;

        const images = (property?.images as any[]) || [];
        const coverImageUrl =
          images.find((img) => img.is_cover)?.url ||
          images.find((img) => img.is_cover)?.image_url ||
          images[0]?.url ||
          images[0]?.image_url;

        let color = "#1E88E5";
        let urgencyText = "แจ้งเตือน";
        if (daysUntilExpiry <= 1) {
          color = "#D32F2F";
          urgencyText = "ด่วนที่สุด!";
        } else if (daysUntilExpiry <= 7) {
          color = "#F57C00";
          urgencyText = "สำคัญ";
        } else if (daysUntilExpiry <= 14) {
          color = "#FBC02D";
          urgencyText = "แจ้งเตือน";
        }

        const flexMessage: ExtendedFlexMessage = {
          type: "flex" as const,
          altText: `🚨 สัญญาใกล้หมดอายุ: ${propertyTitle}`,
          contents: {
            type: "bubble" as const,
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: color,
              contents: [
                {
                  type: "text",
                  text: `⏳ สัญญาใกล้หมดอายุ (${urgencyText})`,
                  weight: "bold",
                  color: "#FFFFFF",
                  size: "md",
                },
              ],
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: propertyTitle,
                  weight: "bold",
                  size: "md",
                  wrap: true,
                },
                {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "📅 หมดสัญญา:",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 3,
                        },
                        {
                          type: "text",
                          text: new Date(contract.end_date).toLocaleDateString(
                            "th-TH",
                            { year: "numeric", month: "long", day: "numeric" },
                          ),
                          wrap: true,
                          color: "#666666",
                          size: "sm",
                          flex: 5,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "⏰ เหลืออีก:",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 3,
                        },
                        {
                          type: "text",
                          text: `${daysUntilExpiry} วัน`,
                          wrap: true,
                          color: color,
                          weight: "bold",
                          size: "sm",
                          flex: 5,
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "💰 ค่าเช่า:",
                          color: "#aaaaaa",
                          size: "sm",
                          flex: 3,
                        },
                        {
                          type: "text",
                          text: `฿${(contract.rent_price || 0).toLocaleString()}/เดือน`,
                          wrap: true,
                          color: "#666666",
                          size: "sm",
                          flex: 5,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: color,
                  action: {
                    type: "uri",
                    label: "ดูสัญญา/ต่อสัญญา",
                    uri: propertyId
                      ? `${siteConfig.url}/protected/properties/${propertyId}?tab=contracts`
                      : `${siteConfig.url}/protected/dashboard`,
                  },
                },
              ],
            },
          },
        };

        if (coverImageUrl) {
          flexMessage.contents.hero = {
            type: "image",
            url: coverImageUrl,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
            action: {
              type: "uri",
              label: "ดูประกาศ",
              uri: propertyId
                ? `${siteConfig.url}/protected/properties/${propertyId}`
                : `${siteConfig.url}/protected/dashboard`,
            },
          };
        }

        try {
          await sendLineNotification(flexMessage as any);
          notifications.push({
            contract_id: contract.id,
            property: propertyTitle,
            days_remaining: daysUntilExpiry,
            status: "sent",
          });
        } catch (lineError) {
          console.error(`Contract ${contract.id} LINE error:`, lineError);
          notifications.push({
            contract_id: contract.id,
            status: "failed",
            error: lineError instanceof Error ? lineError.message : "Unknown",
          });
        }
      }
    }

    return {
      total_contracts: expiringContracts.length,
      notifications_sent: notifications.filter((n) => n.status === "sent")
        .length,
      notifications,
    };
  } catch (error: unknown) {
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

    const { data: toDelete, error: fetchError } = await supabase
      .from("properties")
      .select("id, title, deleted_at")
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgoStr);

    if (fetchError) throw fetchError;
    if (!toDelete || toDelete.length === 0) {
      return { message: "No trash to clean", count: 0 };
    }

    const idsToDelete = (toDelete || [])
      .map((p) => p.id)
      .filter((id): id is string => !!id);

    const { error: deleteError } = await supabase
      .from("properties_core")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) throw deleteError;

    return { deleted_count: idsToDelete.length, deleted_ids: idsToDelete };
  } catch (error: unknown) {
    console.error("Trash cleanup error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─────────────────────────────────────────────────────
// TASK 3: Rent Notifications
// ─────────────────────────────────────────────────────
async function runRentNotifications(startTime: number) {
  try {
    const supabase = createAdminClient();
    const today = new Date();
    const currentDay = today.getDate();
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isLastDayOfMonth = tomorrow.getDate() === 1;

    let query = supabase
      .from("rent_notification_rules")
      .select(
        `
        id, property_id, line_group_id, notification_day, notification_hour, language, is_active, last_sent_at, created_at, tenant_id,
        properties (id, title, property_type, listing_type, status, price, rental_price, bedrooms, bathrooms, size_sqm),
        line_groups (group_id, group_name),
        rent_notification_history (status, created_at, retry_count)
      `,
      )
      // Unified cron runs once daily — fetch ALL active rules for today's date
      // regardless of notification_hour (since we only invoke once at 9am)
      .eq("is_active", true);

    if (isLastDayOfMonth) {
      query = query.gte("notification_day", currentDay);
    } else {
      query = query.eq("notification_day", currentDay);
    }

    const { data: rules, error } = await query;
    if (error) throw error;
    if (!rules || rules.length === 0) {
      return { message: "No rent notifications for this slot" };
    }

    // Filter rules: no SUCCESS today, retry < 3
    const pendingRules = (rules as CronRule[] || []).filter((rule: CronRule) => {
      const todayHistory = rule.rent_notification_history?.filter((h) =>
        h.created_at.startsWith(todayStr),
      );
      const hasSuccess = todayHistory?.some((h) => h.status === "SUCCESS");
      if (hasSuccess) return false;

      const latestError = todayHistory
        ?.filter((h) => h.status === "ERROR")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

      if (!latestError) return true;
      return (latestError.retry_count || 0) < 3;
    });

    if (pendingRules.length === 0) {
      return { message: "No pending rent notifications" };
    }

    const results = [];
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error("Missing LINE Token");

    for (let i = 0; i < pendingRules.length; i += BATCH_SIZE) {
      if (performance.now() - startTime > MAX_RUNTIME_MS) {
        console.warn(
          `[Cron] Exiting early. Remaining: ${pendingRules.length - i}`,
        );
        break;
      }

      const chunk = pendingRules.slice(i, i + BATCH_SIZE);

      const chunkPromises = chunk.map(async (rule) => {
        try {
          if (!rule.property_id) {
            return { ruleId: rule.id, status: "skipped_no_property_id" };
          }

          const { data: activeContract } = await supabase
            .from("rental_contracts")
            .select("id, deal_id, tenant_id, start_date, end_date, rent_price, status, created_at, deal:deals!inner(property_id)")
            .eq("deal.property_id", rule.property_id)
            .eq("status", "ACTIVE")
            .gte("end_date", todayStr)
            .maybeSingle();

          if (!activeContract)
            return { ruleId: rule.id, status: "skipped_no_active_contract" };

          const {
            propertyName,
            price,
            coverImageUrl,
            bedrooms,
            bathrooms,
            sizeSqm,
          } = getPropertyDisplayInfo(rule);
          const lang = (rule.language as "th" | "en" | "cn" | "ru") || "th";
          const dateFormat = getLocaleDateFormat(lang);

          const message = generateRentNotificationFlex({
            propertyName,
            price,
            coverImageUrl,
            bedrooms,
            bathrooms,
            sizeSqm,
            monthYear: today.toLocaleDateString(dateFormat, {
              month: "long",
              year: "numeric",
            }),
            contractEndDate: activeContract.end_date
              ? new Date(activeContract.end_date).toLocaleDateString(
                  dateFormat,
                  { day: "numeric", month: "short", year: "numeric" },
                )
              : "-",
            language: lang,
            isTest: false,
          });

          const response = await fetch(
            "https://api.line.me/v2/bot/message/push",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                to: rule.line_group_id,
                messages: [message],
              }),
            },
          );

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`LINE API: ${response.status} - ${errText}`);
          }

          await supabase.from("rent_notification_history").insert({
            rule_id: rule.id,
            tenant_id: rule.tenant_id,
            property_id: rule.property_id,
            line_group_id: rule.line_group_id,
            status: "SUCCESS",
          });

          await supabase
            .from("rent_notification_rules")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("id", rule.id);
          return { ruleId: rule.id, status: "sent" };
        } catch (err: unknown) {
          const errorMessage = (err as Error).message;
          console.error(`[Cron] Rule ${rule.id} failed:`, errorMessage);

          const todayHistory = rule.rent_notification_history?.filter(
            (h) => h.created_at.startsWith(todayStr),
          );
          const latestCount =
            todayHistory?.reduce(
              (max: number, h) => Math.max(max, h.retry_count || 0),
              0,
            ) || 0;

          await supabase.from("rent_notification_history").insert({
            rule_id: rule.id,
            tenant_id: rule.tenant_id,
            property_id: rule.property_id,
            line_group_id: rule.line_group_id,
            status: "ERROR",
            error_message: (err as Error).message || "Unknown error",
            retry_count: latestCount + 1,
          });

          return { ruleId: rule.id, status: "error", error: errorMessage };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return {
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      error: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status?.startsWith("skipped")).length,
    };
  } catch (error: unknown) {
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

    if (propertiesError) throw propertiesError;
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

    if (dealsError) throw dealsError;

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

    const alertsGenerated = [];

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
          alertsGenerated.push({
            property_id: property.id,
            title: property.title,
            diff_percent: Math.round(diffPercent),
          });

          // Log to system_audit_logs_v3
          await supabase.from("system_audit_logs_v3").insert({
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

    return {
      success: true,
      alerts_count: alertsGenerated.length,
      alerts: alertsGenerated,
    };
  } catch (error: unknown) {
    console.error("Market alerts error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
