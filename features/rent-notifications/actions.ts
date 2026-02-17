"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "./schema";

export async function createRentNotificationRule(
  data: RentNotificationRuleInput,
) {
  try {
    const parsed = rentNotificationRuleSchema.parse(data);
    const supabase = createAdminClient();

    const { error } = await (supabase as any)
      .from("rent_notification_rules")
      .insert({
        property_id: parsed.property_id,
        line_group_id: parsed.line_group_id,
        notification_day: parsed.notification_day,
        is_active: parsed.is_active,
        language: parsed.language,
      });

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateRentNotificationRule(
  id: string,
  data: Partial<RentNotificationRuleInput>,
) {
  try {
    const supabase = createAdminClient();
    const { error } = await (supabase as any)
      .from("rent_notification_rules")
      .update(data)
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteRentNotificationRule(id: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await (supabase as any)
      .from("rent_notification_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/protected/rent-notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function toggleRentNotificationRule(
  id: string,
  isActive: boolean,
) {
  return updateRentNotificationRule(id, { is_active: isActive });
}

export async function testSendRentNotification(ruleId: string) {
  // This is a manual trigger for a specific rule
  // We can reuse the logic from the cron job, or just call the LINE API directly here
  // For MVP transparency, let's implement the send logic here again or extract it to a shared lib function later.
  // For now, I will just replicate the send logic lightly.

  try {
    const supabase = createAdminClient();
    const { data: rule, error } = await (supabase as any)
      .from("rent_notification_rules")
      .select(
        `
                *,
                properties (
                  title, title_en, title_cn, rental_price, currency,
                  bedrooms, bathrooms, size_sqm,
                  property_images (image_url, is_cover, sort_order)
                ),
                line_groups (group_id)
            `,
      )
      .eq("id", ruleId)
      .single();

    if (error || !rule) throw new Error("Rule not found");

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
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600";

    // Localization similar to cron
    const t = {
      th: {
        alertTitle: "🔔 ทดสอบแจ้งเตือน (TEST)",
        testBody: "นี่คือข้อความทดสอบการตั้งค่าแจ้งเตือนค่าเช่า",
        amountDue: "ยอดที่ต้องชำระ:",
        footer: "กรุณาส่งสลิปการโอนเงินในกลุ่มนี้ได้เลยครับ 🙏",
        specs: {
          bed: "ห้องนอน",
          bath: "ห้องน้ำ",
          sqm: "ตร.ม.",
        },
      },
      en: {
        alertTitle: "🔔 Test Notification (TEST)",
        testBody: "This is a test notification for rent payment.",
        amountDue: "Amount Owed:",
        footer: "Please send the transfer slip in this group. Thank you 🙏",
        specs: {
          bed: "Beds",
          bath: "Baths",
          sqm: "sqm",
        },
      },
      cn: {
        alertTitle: "🔔 测试通知 (TEST)",
        testBody: "这是租金支付的测试通知。",
        amountDue: "应付金额:",
        footer: "请在此群发送转账凭证，谢谢 🙏",
        specs: {
          bed: "卧室",
          bath: "浴室",
          sqm: "平方米",
        },
      },
    };

    const lang = (rule.language as "th" | "en" | "cn") || "th";
    const content = t[lang];

    const message = {
      type: "flex",
      altText: `${content.alertTitle}: ${propertyName}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#1565C0", // Darker blue for premium look
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
                  type: "text",
                  text: content.testBody,
                  color: "#666666",
                  size: "xs",
                  wrap: true,
                },
                {
                  type: "box",
                  layout: "baseline",
                  margin: "md",
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
                      color: "#E53935", // Red for amount due
                      size: "xl",
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

    return { success: true };
  } catch (err: any) {
    console.error("Test send error:", err);
    return { success: false, message: err.message };
  }
}
