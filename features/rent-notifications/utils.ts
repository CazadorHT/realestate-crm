import { RentNotificationRule } from "./types";

interface FlexMessageData {
  propertyName: string;
  price: string;
  coverImageUrl: string;
  bedrooms: string | number;
  bathrooms: string | number;
  sizeSqm: string | number;
  monthYear: string;
  contractEndDate: string;
  language: "th" | "en" | "cn";
  isTest?: boolean;
}

export function generateRentNotificationFlex(data: FlexMessageData) {
  const {
    propertyName,
    price,
    coverImageUrl,
    bedrooms,
    bathrooms,
    sizeSqm,
    monthYear,
    contractEndDate,
    language,
    isTest = false,
  } = data;

  const t = {
    th: {
      alertTitle: isTest ? "🔔 ทดสอบแจ้งเตือน (TEST)" : "🔔 แจ้งเตือนชำระค่าเช่า",
      testBody: "นี่คือข้อความทดสอบการตั้งค่าแจ้งเตือนค่าเช่า",
      amountDue: "ยอดที่ต้องชำระ:",
      forMonth: "ประจำเดือน:",
      contractEnds: "สิ้นสุดสัญญา:",
      footer: "กรุณาส่งสลิปการโอนเงินในกลุ่มนี้ได้เลยครับ 🙏",
      specs: { bed: "ห้องนอน", bath: "ห้องน้ำ", sqm: "ตร.ม." },
    },
    en: {
      alertTitle: isTest ? "🔔 Test Notification (TEST)" : "🔔 Rent Payment Reminder",
      testBody: "This is a test notification for rent payment.",
      amountDue: "Amount Owed:",
      forMonth: "For Month:",
      contractEnds: "Contract Ends:",
      footer: "Please send the transfer slip in this group. Thank you 🙏",
      specs: { bed: "Beds", bath: "Baths", sqm: "sqm" },
    },
    cn: {
      alertTitle: isTest ? "🔔 测试通知 (TEST)" : "🔔 租金支付提醒",
      testBody: "这是租金支付的测试通知。",
      amountDue: "应付金额:",
      forMonth: "对应月份:",
      contractEnds: "合同结束:",
      footer: "请在此群发送转账凭证，谢谢 🙏",
      specs: { bed: "卧室", bath: "浴室", sqm: "平方米" },
    },
  };

  const content = t[language] || t.th;

  return {
    type: "flex",
    altText: `${content.alertTitle}: ${propertyName}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: isTest ? "#1565C0" : "#2E7D32", // Blue for test, Green for real
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
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: `🛏️ ${bedrooms || "-"}`,
                size: "xs",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: `🚿 ${bathrooms || "-"}`,
                size: "xs",
                color: "#888888",
                flex: 1,
              },
              {
                type: "text",
                text: `📏 ${sizeSqm || "-"} ${content.specs.sqm}`,
                size: "xs",
                color: "#888888",
                flex: 2,
              },
            ],
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              isTest ? {
                type: "text",
                text: content.testBody,
                color: "#666666",
                size: "xs",
                wrap: true,
              } : null,
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
            ].filter(Boolean) as any[],
          },
          { type: "separator", margin: "md" },
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
}

export function getLocaleDateFormat(lang: string) {
  switch (lang) {
    case "en": return "en-US";
    case "cn": return "zh-CN";
    default: return "th-TH";
  }
}
