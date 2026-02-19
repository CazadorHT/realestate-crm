import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLineNotification } from "@/lib/line";

// CRON JOB Should be called daily
// e.g. /api/cron/rent-notifications?secret=YOUR_CRON_SECRET

export async function GET(req: NextRequest) {
  // 1. Verify Secret
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date();
    const currentDay = today.getDate();

    // 2. Fetch Rules that match today's day
    // Edge case: if currentDay is 28, 29, 30, we might want to include rules for 31 etc if it's end of month?
    // For MVP: Strict match

    // Using 'any' cast because types are not yet generated
    // 2. Fetch Rules that match today's day
    const { data: rules, error } = await (supabase as any)
      .from("rent_notification_rules")
      .select(
        `
        *,
        properties (
          id, title, title_en, title_cn, rental_price, currency,
          bedrooms, bathrooms, size_sqm,
          property_images (image_url, is_cover, sort_order)
        ),
        line_groups (group_id, group_name)
      `,
      )
      .eq("notification_day", currentDay)
      .eq("is_active", true);

    if (error) throw error;

    if (!rules || rules.length === 0) {
      return NextResponse.json({ message: "No notifications to sent today." });
    }

    const results = [];

    // 3. Send Notifications
    for (const rule of rules) {
      try {
        // ... (Contract check logic remains the same) ...
        const { data: activeContract, error: contractError } = await (
          supabase as any
        )
          .from("rental_contracts")
          .select("*, deal:deals!inner(property_id)")
          .eq("deal.property_id", rule.property_id)
          .eq("status", "ACTIVE")
          .gte("end_date", new Date().toISOString().split("T")[0])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractError) {
          console.error(
            `Error checking contract for rule ${rule.id}:`,
            contractError,
          );
          results.push({
            ruleId: rule.id,
            status: "skipped_error",
            error: contractError.message,
          });
          continue;
        }

        if (!activeContract) {
          console.log(
            `Skipping rule ${rule.id} (Property: ${rule.properties?.title}): No active contract found.`,
          );
          results.push({
            ruleId: rule.id,
            status: "skipped_no_active_contract",
          });
          continue;
        }

        const property = rule.properties;
        const propertyName =
          (rule.language === "en"
            ? property?.title_en
            : rule.language === "cn"
              ? property?.title_cn
              : property?.title) ||
          property?.title ||
          "Property";

        const price = property?.rental_price
          ? `${property.rental_price.toLocaleString()} ${property?.currency || "THB"}`
          : "-";

        // Image logic matching Inquiry notifications
        const images = property?.property_images || [];
        const coverImageUrl =
          images.find((img: any) => img.is_cover)?.image_url ||
          images[0]?.image_url ||
          "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";

        // Localization Dictionary
        const t = {
          th: {
            alertTitle: "🔔 แจ้งเตือนชำระค่าเช่า",
            amountDue: "ยอดที่ต้องชำระ:",
            forMonth: "ประจำเดือน:",
            contractEnds: "สิ้นสุดสัญญา:",
            footer: "กรุณาส่งสลิปการโอนเงินในกลุ่มนี้ได้เลยครับ 🙏",
            dateFormat: "th-TH",
            specs: {
              bed: "ห้องนอน",
              bath: "ห้องน้ำ",
              sqm: "ตร.ม.",
            },
          },
          en: {
            alertTitle: "🔔 Rent Payment Reminder",
            amountDue: "Amount Owed:",
            forMonth: "For Month:",
            contractEnds: "Contract Ends:",
            footer: "Please send the transfer slip in this group. Thank you 🙏",
            dateFormat: "en-US",
            specs: {
              bed: "Beds",
              bath: "Baths",
              sqm: "sqm",
            },
          },
          cn: {
            alertTitle: "🔔 租金支付提醒",
            amountDue: "应付金额:",
            forMonth: "对应月份:",
            contractEnds: "合同结束:",
            footer: "请在此群发送转账凭证，谢谢 🙏",
            dateFormat: "zh-CN",
            specs: {
              bed: "卧室",
              bath: "浴室",
              sqm: "平方米",
            },
          },
        };

        const lang = (rule.language as "th" | "en" | "cn") || "th";
        const content = t[lang];

        // Format Date based on locale
        const monthYear = today.toLocaleDateString(content.dateFormat, {
          month: "long",
          year: "numeric",
        });

        const contractEndDate = new Date(
          activeContract.end_date,
        ).toLocaleDateString(content.dateFormat, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const message = {
          type: "flex",
          altText: `${content.alertTitle}: ${propertyName}`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#2E7D32", // Green for real notifications
              paddingAll: "lg",
              contents: [
                {
                  type: "text",
                  text: content.alertTitle,
                  weight: "bold",
                  color: "#FFFFFF",
                  size: "md",
                },
              ],
            },
            hero: {
              type: "image",
              url: coverImageUrl,
              size: "full",
              aspectRatio: "20:13",
              aspectMode: "cover",
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: propertyName,
                  weight: "bold",
                  size: "md",
                  wrap: true,
                  color: "#333333",
                },
                // Property Specs
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "sm",
                  contents: [
                    {
                      type: "text",
                      text: `🛏️ ${property?.bedrooms || "-"}`,
                      size: "xs",
                      color: "#888888",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: `🚿 ${property?.bathrooms || "-"}`,
                      size: "xs",
                      color: "#888888",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: `📏 ${property?.size_sqm || "-"} ${content.specs.sqm}`,
                      size: "xs",
                      color: "#888888",
                      flex: 2,
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "md",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: content.amountDue,
                          color: "#888888",
                          size: "sm",
                          flex: 2,
                        },
                        {
                          type: "text",
                          text: price,
                          weight: "bold",
                          color: "#E53935",
                          size: "xl",
                          flex: 4,
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: content.forMonth,
                          color: "#888888",
                          size: "sm",
                          flex: 2,
                        },
                        {
                          type: "text",
                          text: monthYear,
                          color: "#333333",
                          size: "sm",
                          flex: 4,
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: content.contractEnds,
                          color: "#888888",
                          size: "sm",
                          flex: 2,
                        },
                        {
                          type: "text",
                          text: contractEndDate,
                          color: "#333333",
                          size: "sm",
                          flex: 4,
                          align: "end",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "md",
                },
                {
                  type: "text",
                  text: content.footer,
                  size: "xs",
                  color: "#999999",
                  wrap: true,
                  margin: "md",
                },
              ],
            },
          },
        };

        // Send to specific Group ID using existing helper logic?
        // existing `sendLineNotification` uses `push` API but default to admin or env.
        // We need to support sending to specific target.
        // Let's check `lib/line.ts` capabilities.
        // It seems `lib/line.ts` `sendLineNotification` takes `message` but internally expects ENV or single user.
        // I should probably duplicate the fetch logic here for simplicity or update lib.
        // For safety I will implement direct fetch here using the group_id from rule.

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) throw new Error("Missing LINE Token");

        await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: rule.line_group_id,
            messages: [message],
          }),
        });

        // Update last_sent_at
        await (supabase as any)
          .from("rent_notification_rules")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", rule.id);

        results.push({
          ruleId: rule.id,
          status: "sent",
          group: rule.line_group_id,
        });
      } catch (err: any) {
        console.error(`Error processing rule ${rule.id}:`, err);
        results.push({ ruleId: rule.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status.startsWith("skipped")).length,
      details: results,
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
