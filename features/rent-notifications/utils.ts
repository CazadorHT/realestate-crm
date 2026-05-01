import { FlexMessage } from "@line/bot-sdk";

export function getLocaleDateFormat(lang: "th" | "en" | "cn" | "ru") {
  switch (lang) {
    case "en": return "en-US";
    case "cn": return "zh-CN";
    case "ru": return "ru-RU";
    default: return "th-TH";
  }
}

/**
 * Extracts and localizes property information for notifications
 */
export function getPropertyDisplayInfo(rule: any) {
  const property = rule.properties;
  const lang = (rule.language as "th" | "en" | "cn" | "ru") || "th";

  const propertyName =
    (lang === "en"
      ? property?.title_en
      : lang === "cn"
        ? property?.title_cn
        : lang === "ru"
          ? property?.title_ru
          : property?.title) ||
    property?.title ||
    "Property";

  const price = property?.rental_price
    ? `${property.rental_price.toLocaleString()} ${property?.currency || "THB"}`
    : "-";

  const images = property?.property_images || [];
  const coverImageUrl =
    images.find((img: any) => img.is_cover)?.image_url ||
    images[0]?.image_url ||
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";

  return {
    propertyName,
    price,
    coverImageUrl,
    bedrooms: property?.bedrooms || "-",
    bathrooms: property?.bathrooms || "-",
    sizeSqm: property?.size_sqm || "-",
  };
}

export function generateRentNotificationFlex({
  propertyName,
  price,
  coverImageUrl,
  bedrooms,
  bathrooms,
  sizeSqm,
  monthYear,
  contractEndDate,
  language = "th",
  isTest = false,
}: {
  propertyName: string;
  price: string;
  coverImageUrl: string;
  bedrooms: string | number;
  bathrooms: string | number;
  sizeSqm: string | number;
  monthYear: string;
  contractEndDate: string;
  language?: "th" | "en" | "cn" | "ru";
  isTest?: boolean;
}): FlexMessage {
  const t = {
    th: {
      alertTitle: "🔔 แจ้งเตือนชำระค่าเช่า",
      amountDue: "ยอดที่ต้องชำระ:",
      forMonth: "ประจำเดือน:",
      contractEnds: "สิ้นสุดสัญญา:",
      footer: "กรุณาส่งสลิปการโอนเงินในกลุ่มนี้ได้เลยครับ 🙏",
      specs: { bed: "ห้องนอน", bath: "ห้องน้ำ", sqm: "ตร.ม." },
    },
    en: {
      alertTitle: "🔔 Rent Payment Reminder",
      amountDue: "Amount Owed:",
      forMonth: "For Month:",
      contractEnds: "Contract Ends:",
      footer: "Please send the transfer slip in this group. Thank you 🙏",
      specs: { bed: "Beds", bath: "Baths", sqm: "sqm" },
    },
    cn: {
      alertTitle: "🔔 租金支付提醒",
      amountDue: "应付金额:",
      forMonth: "对应月份:",
      contractEnds: "合同结束:",
      footer: "请在此群发送转账凭证，谢谢 🙏",
      specs: { bed: "卧室", bath: "浴室", sqm: "平方米" },
    },
    ru: {
      alertTitle: "🔔 Напоминание об оплате аренды",
      amountDue: "К оплате:",
      forMonth: "За месяц:",
      contractEnds: "Окончание договора:",
      footer: "Пожалуйста, отправьте чек об оплате в эту группу. Спасибо 🙏",
      specs: { bed: "спальняняняни", bath: "ванные", sqm: "кв.м." },
    },
  };

  const labels = t[language] || t.th;

  return {
    type: "flex",
    altText: isTest ? `[TEST] ${labels.alertTitle}` : labels.alertTitle,
    contents: {
      type: "bubble",
      size: "mega",
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
            text: labels.alertTitle,
            weight: "bold",
            size: "xl",
            color: "#1a202c",
          },
          {
            type: "text",
            text: propertyName,
            size: "md",
            color: "#4a5568",
            wrap: true,
            weight: "bold",
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `${bedrooms} ${labels.specs.bed} | ${bathrooms} ${labels.specs.bath} | ${sizeSqm} ${labels.specs.sqm}`,
                size: "xs",
                color: "#a0aec0",
              },
            ],
          },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: labels.forMonth, size: "sm", color: "#718096" },
                  { type: "text", text: monthYear, size: "sm", color: "#2d3748", align: "end", weight: "bold" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: labels.amountDue, size: "sm", color: "#718096" },
                  { type: "text", text: price, size: "sm", color: "#e53e3e", align: "end", weight: "bold" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: labels.contractEnds, size: "sm", color: "#718096" },
                  { type: "text", text: contractEndDate, size: "sm", color: "#2d3748", align: "end" },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: labels.footer,
            size: "xs",
            color: "#a0aec0",
            align: "center",
            wrap: true,
          },
        ],
      },
      styles: {
        footer: { separator: true },
      },
    },
  };
}
