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

    console.log("🔍 Debug - Query params:", { todayStr, thirtyDaysStr });

    const { data: expiringContracts, error } = await supabase
      .from("rental_contracts")
      .select(
        "id, deal_id, end_date, start_date, rent_price, deals(property_id, properties(title))",
      )
      .eq("status", "ACTIVE")
      .not("end_date", "is", null)
      .gte("end_date", todayStr)
      .lte("end_date", thirtyDaysStr)
      .order("end_date", { ascending: true });

    console.log("🔍 Debug - Query result:", {
      count: expiringContracts?.length || 0,
      error,
      firstContract: expiringContracts?.[0],
    });

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
        const propertyTitle =
          (contract.deals as any)?.properties?.title || "ทรัพย์สิน";

        // Determine alert level
        let emoji = "ℹ️";
        let urgency = "";
        if (daysUntilExpiry <= 1) {
          emoji = "🚨🚨🚨";
          urgency = " [URGENT]";
        } else if (daysUntilExpiry <= 7) {
          emoji = "🚨";
          urgency = " [สำคัญ]";
        } else if (daysUntilExpiry <= 14) {
          emoji = "⚠️";
        }

        const message =
          `${emoji} แจ้งเตือน: สัญญาใกล้หมดอายุ${urgency}\n\n` +
          `🏢 ทรัพย์สิน: ${propertyTitle}\n` +
          `📅 วันที่หมดสัญญา: ${new Date(contract.end_date).toLocaleDateString(
            "th-TH",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          )}\n` +
          `⏰ เหลืออีก: ${daysUntilExpiry} วัน\n` +
          `💰 ค่าเช่า: ฿${(contract.rent_price || 0).toLocaleString()}/เดือน\n\n` +
          `📞 กรุณาติดต่อลูกค้าเพื่อต่ออายุสัญญา`;

        try {
          await sendLineNotification(message);
          notifications.push({
            contract_id: contract.id,
            property: propertyTitle,
            days_remaining: daysUntilExpiry,
            notification_type:
              daysUntilExpiry <= 1
                ? "critical"
                : daysUntilExpiry <= 7
                  ? "urgent"
                  : daysUntilExpiry <= 14
                    ? "warning"
                    : "info",
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
