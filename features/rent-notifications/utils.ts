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
  ruleId,
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
  ruleId?: string;
}): FlexMessage {
  const t = {
    th: {
      alertTitle: "🔔 แจ้งเตือนชำระค่าเช่า",
      amountDue: "ยอดที่ต้องชำระ:",
      forMonth: "ประจำเดือน:",
      contractEnds: "สิ้นสุดสัญญา:",
      footer: "กรุณาส่งสลิปการโอนเงินในกลุ่มนี้ได้เลยครับ 🙏",
      specs: { bed: "ห้องนอน", bath: "ห้องน้ำ", sqm: "ตร.ม." },
      btnPaid: "✅ แจ้งโอนแล้ว (ส่งสลิป)",
      btnInfo: "ℹ️ ดูข้อมูลการชำระ",
    },
    en: {
      alertTitle: "🔔 Rent Payment Reminder",
      amountDue: "Amount Owed:",
      forMonth: "For Month:",
      contractEnds: "Contract Ends:",
      footer: "Please send the transfer slip in this group. Thank you 🙏",
      specs: { bed: "Beds", bath: "Baths", sqm: "sqm" },
      btnPaid: "✅ Paid / Sent Slip",
      btnInfo: "ℹ️ Payment Details",
    },
    cn: {
      alertTitle: "🔔 租金支付提醒",
      amountDue: "应付金额:",
      forMonth: "对应月份:",
      contractEnds: "合同结束:",
      footer: "请在此群发送转账凭证，谢谢 🙏",
      specs: { bed: "卧室", bath: "浴室", sqm: "平方米" },
      btnPaid: "✅ 已转账 / 发送凭证",
      btnInfo: "ℹ️ 查看付款信息",
    },
    ru: {
      alertTitle: "🔔 Напоминание об оплате аренды",
      amountDue: "К оплате:",
      forMonth: "За месяц:",
      contractEnds: "Окончание договора:",
      footer: "Пожалуйста, отправьте чек об оплате в эту группу. Спасибо 🙏",
      specs: { bed: "спальни", bath: "ванные", sqm: "кв.м." },
      btnPaid: "✅ Оплачено (Чек)",
      btnInfo: "ℹ️ Детали оплаты",
    },
  };

  const labels = t[language] || t.th;

  const footerContents: any[] = [
    {
      type: "text",
      text: labels.footer,
      size: "xs",
      color: "#a0aec0",
      align: "center",
      wrap: true,
    },
  ];

  // Interactive Reply API Buttons (0 LINE quota!)
  if (ruleId) {
    footerContents.push({
      type: "box",
      layout: "vertical",
      spacing: "sm",
      margin: "md",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#16a34a",
          height: "sm",
          action: {
            type: "postback",
            label: labels.btnPaid,
            data: `action=rent_paid&ruleId=${ruleId}&lang=${language}`,
            displayText: labels.btnPaid,
          },
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "postback",
            label: labels.btnInfo,
            data: `action=rent_info&ruleId=${ruleId}&lang=${language}`,
          },
        },
      ],
    });
  }

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
        contents: footerContents,
      },
      styles: {
        footer: { separator: true },
      },
    },
  };
}

export interface ContractExpiryBubbleItem {
  dealId: string;
  propertyName: string;
  coverImageUrl: string;
  endDate: string;
  daysUntilExpiry: number;
  rentPrice: string;
  language?: "th" | "en" | "cn" | "ru";
}

function buildContractExpiryBubble(item: ContractExpiryBubbleItem): any {
  const lang = item.language || "th";
  const isUrgent = item.daysUntilExpiry <= 7;
  const isWarning = item.daysUntilExpiry <= 30;
  const headerColor = isUrgent ? "#dc2626" : isWarning ? "#ea580c" : "#1d4ed8";

  const t = {
    th: {
      badge: isUrgent ? "ด่วน: เหลือ 7 วัน" : isWarning ? "เตือนล่วงหน้า 30 วัน" : "สอบถามการต่อสัญญา (60 วัน)",
      title: "แจ้งเตือนสัญญาเช่าใกล้ครบกำหนด",
      endLabel: "วันสิ้นสุดสัญญา",
      rentLabel: "ค่าเช่าปัจจุบัน",
      renewBtn: "✨ สนใจต่อสัญญา",
      moveOutBtn: "📦 แจ้งย้ายออก",
    },
    en: {
      badge: isUrgent ? "Urgent: 7 Days Left" : isWarning ? "30-Day Notice" : "60-Day Renewal Check",
      title: "Lease Contract Expiry Notice",
      endLabel: "Contract End",
      rentLabel: "Current Rent",
      renewBtn: "✨ Interested to Renew",
      moveOutBtn: "📦 Plan to Move Out",
    },
    cn: {
      badge: isUrgent ? "紧急：剩余7天" : isWarning ? "提前30天提醒" : "续租意向确认（60天）",
      title: "租约即将到期提醒",
      endLabel: "合同到期日",
      rentLabel: "当前租金",
      renewBtn: "✨ 有意续租",
      moveOutBtn: "📦 计划退租",
    },
    ru: {
      badge: isUrgent ? "Срочно: 7 дней" : isWarning ? "За 30 дней" : "Продление (60 дней)",
      title: "Окончание договора аренды",
      endLabel: "Дата окончания",
      rentLabel: "Аренда",
      renewBtn: "✨ Продлить договор",
      moveOutBtn: "📦 Планирую выезд",
    },
  }[lang];

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerColor,
      paddingAll: "md",
      contents: [
        {
          type: "text",
          text: t.badge,
          color: "#ffffff",
          weight: "bold",
          size: "sm",
        },
        {
          type: "text",
          text: t.title,
          color: "#ffffff",
          size: "xs",
          margin: "xs",
        },
      ],
    },
    hero: {
      type: "image",
      url: item.coverImageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: item.propertyName,
          weight: "bold",
          size: "md",
          wrap: true,
          color: "#1e293b",
        },
        { type: "separator", margin: "md" },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            { type: "text", text: t.endLabel, size: "sm", color: "#64748b" },
            { type: "text", text: item.endDate, size: "sm", color: "#0f172a", align: "end", weight: "bold" },
          ],
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: t.rentLabel, size: "sm", color: "#64748b" },
            { type: "text", text: item.rentPrice, size: "sm", color: "#2563eb", align: "end", weight: "bold" },
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
          color: "#2563eb",
          height: "sm",
          action: {
            type: "postback",
            label: t.renewBtn,
            data: `action=contract_renew&dealId=${item.dealId}&lang=${lang}`,
            displayText: t.renewBtn,
          },
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "postback",
            label: t.moveOutBtn,
            data: `action=contract_moveout&dealId=${item.dealId}&lang=${lang}`,
            displayText: t.moveOutBtn,
          },
        },
      ],
    },
  };
}

/**
 * Generates a single 1-click Renewal Flex Card for a tenant's LINE Group
 */
export function generateContractRenewalFlex(item: ContractExpiryBubbleItem): FlexMessage {
  return {
    type: "flex",
    altText: `แจ้งเตือนสัญญาเช่าใกล้ครบกำหนด (${item.daysUntilExpiry} วัน): ${item.propertyName}`,
    contents: buildContractExpiryBubble(item),
  };
}

/**
 * Bundles up to 10 expiring contracts into ONE Flex Carousel (saves LINE quota: 10 contracts = 1 push!)
 */
export function generateContractExpiryCarouselFlex(items: ContractExpiryBubbleItem[]): FlexMessage {
  return {
    type: "flex",
    altText: `สรุปสัญญาเช่าใกล้หมดอายุ (${items.length} รายการ)`,
    contents: {
      type: "carousel",
      contents: items.slice(0, 10).map(buildContractExpiryBubble),
    },
  };
}
