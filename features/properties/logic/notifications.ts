import { siteConfig } from "@/lib/site-config";
import { sendLineNotification } from "@/lib/line";
import type { PropertyRow } from "../types";
import { after } from "next/server";
import { sendAdminNotification } from "@/lib/telegram";
import { 
  formatPriceDropNotification, 
} from "@/lib/telegram-formatters";
import { FlexBubble } from "@/types/line";

export async function sendStatusUpdateNotification(
  existing: Partial<PropertyRow> & { title: string; id: string },
  newStatus: string,
) {
  const dealType = newStatus === "SOLD" ? "ขายแล้ว" : "เช่าแล้ว";
  const dealIcon = newStatus === "SOLD" ? "💰" : "📝";
  const headerColor = newStatus === "SOLD" ? "#2E7D32" : "#1976D2";

  await sendLineNotification({
    type: "flex",
    altText: `🎊 ${dealIcon} ปิดดีลแล้ว! ${existing.title}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: headerColor,
        contents: [
          {
            type: "text",
            text: `🎊 ${dealIcon} ปิดดีลเรียบร้อย! (${dealType})`,
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
            text: existing.title,
            weight: "bold",
            size: "sm",
            wrap: true,
          },
          {
            type: "text",
            text: `สถานะใหม่: ${newStatus}`,
            size: "xs",
            color: "#666666",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: headerColor,
            action: {
              type: "uri",
              label: "ดูในระบบ CRM",
              uri: `${siteConfig.url}/protected/properties/${existing.id}`,
            },
          },
        ],
      },
    },
  });

  // 🛡️ Telegram Admin Bridge Notification
  after(async () => {
    const message = `🎊 <b>ปิดดีลเรียบร้อย! (${dealType})</b>\n━━━━━━━━━━━━━━━━━━\n\n<b>🏢 ทรัพย์:</b> ${existing.title}\n<b>🔍 รหัส:</b> <code>${existing.id}</code>\n\n<i>ยินดีด้วยกับเอเยนต์ผู้ดูแลเคสนี้ครับ! 🎉</i>`;
    await sendAdminNotification(message);
  });
}

export async function sendPriceDropNotification(
  existing: Partial<PropertyRow> & { 
    id: string; 
    title: string; 
    property_images?: { image_url: string; is_cover?: boolean }[] 
  },
  oldPrice: number,
  newPrice: number,
  dropType: "SALE" | "RENT",
) {
  const diff = oldPrice - newPrice;
  const percent = ((diff / oldPrice) * 100).toFixed(1);
  const typeLabel = dropType === "SALE" ? "ราคาขาย" : "ค่าเช่า";

  // Fetch image for notification
  const images = existing.property_images || [];
  const coverImageUrl =
    images.find((img) => img.is_cover)?.image_url || images[0]?.image_url;

  const flexContents: FlexBubble = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#E53935",
      contents: [
        {
          type: "text",
          text: "📉 " + (dropType === "SALE" ? "ลดราคาขาย!" : "ลดค่าเช่า!"),
          weight: "bold",
          color: "#ffffff",
          size: "lg",
        },
      ],
    },
  };

  if (coverImageUrl) {
    flexContents.hero = {
      type: "image",
      url: coverImageUrl,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
      gravity: "top",
    };
  }

  flexContents.body = {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: existing.title,
        weight: "bold",
        size: "md",
        wrap: true,
      },
      {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: `เดิม: ฿${oldPrice.toLocaleString()}`,
            size: "sm",
            color: "#999999",
            decoration: "line-through",
          },
          {
            type: "text",
            text: `เหลือ: ฿${newPrice.toLocaleString()}`,
            size: "xl",
            weight: "bold",
            color: "#E53935",
          },
          {
            type: "text",
            text: `ประหยัดถึง ${percent}% (ลดลง ฿${diff.toLocaleString()})`,
            size: "xs",
            color: "#E53935",
            weight: "bold",
          },
        ],
      },
    ],
  };

  flexContents.footer = {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        style: "primary",
        color: "#E53935",
        action: {
          type: "uri",
          uri: `${siteConfig.url}/protected/properties/${existing.id}`,
        },
      },
    ],
  };

  await sendLineNotification({
    type: "flex",
    altText: `📉 ลดราคา${typeLabel}! ${existing.title}`,
    contents: flexContents,
  });

  // 🔥 Telegram Price Drop Notification
  after(async () => {
    const tgMessage = formatPriceDropNotification(existing as any, oldPrice, newPrice, dropType);
    await sendAdminNotification(tgMessage);
  });
}
