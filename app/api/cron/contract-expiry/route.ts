import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLineNotification } from "@/lib/line";

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();

    // Check for expiring contracts (30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Format dates as YYYY-MM-DD for DATE columns
    const todayStr = now.toISOString().split("T")[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];

    const { data: expiringContracts, error } = await supabase
      .from("rental_contracts")
      .select(
        "id, deal_id, end_date, start_date, rent_price, deals(property_id, properties(id, title, property_images(image_url, is_cover)))",
      )
      .eq("status", "ACTIVE")
      .not("end_date", "is", null)
      .gte("end_date", todayStr)
      .lte("end_date", thirtyDaysStr)
      .order("end_date", { ascending: true });

    if (error) {
      console.error("Error fetching expiring contracts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!expiringContracts || expiringContracts.length === 0) {
      return NextResponse.json({
        message: "No expiring contracts found",
        count: 0,
      });
    }

    // Send LINE notifications with smart scheduling
    const notifications = [];

    for (const contract of expiringContracts) {
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Smart notification schedule:
      // - 30 days before (first alert)
      // - 21 days before (1 week later)
      // - 14 days before (1 week later)
      // - 7 days before (1 week later)
      // - 3 days before (final warning)
      // - 1 day before (critical alert)
      const notificationDays = [30, 21, 14, 7, 3, 1];

      // Check if today is a notification day (within ±1 day tolerance)
      const shouldNotify = notificationDays.some(
        (day) => Math.abs(daysUntilExpiry - day) <= 1,
      );

      if (shouldNotify) {
        const property = (contract.deals as any)?.properties;
        const propertyTitle = property?.title || "ทรัพย์สิน";
        const propertyId = property?.id;

        // Get cover image
        const images = property?.property_images || [];
        const coverImageUrl =
          images.find((img: any) => img.is_cover)?.image_url ||
          images[0]?.image_url;

        // Determine alert level
        let color = "#1E88E5"; // Blue for Info
        let urgencyText = "แจ้งเตือน";
        if (daysUntilExpiry <= 1) {
          color = "#D32F2F"; // Red for Critical
          urgencyText = "ด่วนที่สุด!";
        } else if (daysUntilExpiry <= 7) {
          color = "#F57C00"; // Orange for Urgent
          urgencyText = "สำคัญ";
        } else if (daysUntilExpiry <= 14) {
          color = "#FBC02D"; // Yellow for Warning
          urgencyText = "แจ้งเตือน";
        }

        const flexMessage: any = {
          type: "flex",
          altText: `🚨 สัญญาใกล้หมดอายุ: ${propertyTitle}`,
          contents: {
            type: "bubble",
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
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
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
                      ? `https://oma-asset.com/protected/properties/${propertyId}?tab=contracts`
                      : `https://oma-asset.com/protected/dashboard`,
                  },
                },
              ],
            },
          },
        };

        // Add hero image if available
        if (coverImageUrl) {
          flexMessage.contents.hero = {
            type: "image",
            url: coverImageUrl,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
            action: {
              type: "uri",
              uri: propertyId
                ? `https://oma-asset.com/protected/properties/${propertyId}`
                : `https://oma-asset.com/protected/dashboard`,
            },
          };
        }

        try {
          await sendLineNotification(flexMessage);
          notifications.push({
            contract_id: contract.id,
            property: propertyTitle,
            days_remaining: daysUntilExpiry,
            notification_type: "flex", // Updated type
            status: "sent",
          });
        } catch (lineError) {
          console.error(
            `Failed to send LINE notification for contract ${contract.id}:`,
            lineError,
          );
          notifications.push({
            contract_id: contract.id,
            property: propertyTitle,
            days_remaining: daysUntilExpiry,
            status: "failed",
            error:
              lineError instanceof Error ? lineError.message : "Unknown error",
          });
        }
      } else {
        // Skip notification - not a scheduled day
        notifications.push({
          contract_id: contract.id,
          property: (contract.deals as any)?.properties?.title || "ทรัพย์สิน",
          days_remaining: daysUntilExpiry,
          status: "skipped",
          reason: `Not a notification day (next at: ${notificationDays.find((d) => d < daysUntilExpiry) || 0} days)`,
        });
      }
    }

    const sentCount = notifications.filter((n) => n.status === "sent").length;

    return NextResponse.json({
      message:
        sentCount > 0
          ? "Contract expiry notifications sent"
          : "No notifications sent today",
      total_contracts: expiringContracts.length,
      notifications_sent: sentCount,
      notifications,
    });
  } catch (error) {
    console.error("Error in contract expiry notification:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
