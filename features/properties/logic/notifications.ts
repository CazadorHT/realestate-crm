import { sendLineNotification } from "@/lib/line";
import type { PropertyRow } from "../types";

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
              uri: `https://oma-asset.com/protected/properties/${existing.id}`,
            },
          },
        ],
      },
    },
  });
}

export async function sendPriceDropNotification(
  existing: any,
  oldPrice: number,
  newPrice: number,
  dropType: "SALE" | "RENT",
) {
  const diff = oldPrice - newPrice;
  const percent = ((diff / oldPrice) * 100).toFixed(1);
  const typeLabel = dropType === "SALE" ? "ราคาขาย" : "ค่าเช่า";

  // Fetch image for notification
  const images = (existing as any).property_images || [];
  const coverImageUrl =
    images.find((img: any) => img.is_cover)?.image_url || images[0]?.image_url;

  const flexContents: any = {
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
          label: "ดูรายละเอียดทรัพย์",
          uri: `https://oma-asset.com/protected/properties/${existing.id}`,
        },
      },
    ],
  };

  await sendLineNotification({
    type: "flex",
    altText: `📉 ลดราคา${typeLabel}! ${existing.title}`,
    contents: flexContents,
  });
}
