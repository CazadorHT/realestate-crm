import { siteConfig } from "@/lib/site-config";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  type PropertyType,
  type ListingType,
} from "@/features/properties/labels";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { getProvinceName, PROVINCES } from "@/lib/utils/provinces";

import {
  type BotLang,
  type FlexBubble,
  type FlexMessage,
  type QuickReplyItem,
  type QuickReply,
} from "@/types/line";

export type {
  BotLang,
  FlexBubble,
  FlexMessage,
  QuickReplyItem,
  QuickReply,
};
import { size } from "zod";

interface PropertyForFlex {
  id: string;
  slug?: string | null;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  price?: number | null;
  rental_price?: number | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  property_type?: string | null;
  property_type_en?: string | null;
  property_type_cn?: string | null;
  listing_type?: string | null;
  listing_type_en?: string | null;
  listing_type_cn?: string | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  district?: string | null;
  district_en?: string | null;
  district_cn?: string | null;
  province?: string | null;
  province_en?: string | null;
  province_cn?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  land_size_sqwah?: number | null;
  property_images?: { image_url: string; is_cover?: boolean }[];
}

/**
 * Common locations dictionary for static translation when DB fields are empty.
 */
export const LOCATION_MAP: Record<string, Record<BotLang, string>> = {
  สนามบิน: { th: "สนามบิน", en: "Suvarnabhumi Airport", cn: "素万那普机场" },
  บางนา: { th: "บางนา", en: "Bang Na", cn: "邦纳" },
  วัฒนา: { th: "วัฒนา", en: "Watthana", cn: "瓦塔纳" },
  คลองเตย: { th: "คลองเตย", en: "Khlong Toei", cn: "孔提" },
  พระโขนง: { th: "พระโขนง", en: "Phra Khanong", cn: "帕卡隆" },
  ห้วยขวาง: { th: "ห้วยขวาง", en: "Huai Khwang", cn: "辉煌" },
  พญาไท: { th: "พญาไท", en: "Phaya Thai", cn: "琶亚泰" },
  ราชเทวี: { th: "ราชเทวี", en: "Ratchathewi", cn: "拉差贴威" },
  ปทุมวัน: { th: "ปทุมวัน", en: "Pathum Wan", cn: "巴吞旺" },
  สวนหลวง: { th: "สวนหลวง", en: "Suan Luang", cn: "宣鑾" },
  สาทร: { th: "สาทร", en: "Sathon", cn: "沙าทร" },
  บางคอแหลม: { th: "บางคอแหลม", en: "Bang Kho Laem", cn: "邦科兰" },
  ยานนาวา: { th: "ยานนาวา", en: "Yan Nawa", cn: "延纳瓦" },
  ประเวศ: { th: "ประเวศ", en: "Prawet", cn: "普拉威" },
  บางกะปิ: { th: "บางกะปิ", en: "Bang Kapi", cn: "邦甲必" },
  ลาดพร้าว: { th: "ลาดพร้าว", en: "Lat Phrao", cn: "叻拋" },
  จตุจักร: { th: "จตุจักร", en: "Chatuchak", cn: "恰图恰" },
};

// ============================
// i18n Strings
// ============================
export const T: Record<string, Record<BotLang, string>> = {
  welcome_title: {
    th: "ยินดีต้อนรับค่ะ! 🎉",
    en: "Welcome! 🎉",
    cn: "欢迎！🎉",
  },
  welcome_subtitle: {
    th: "เราพร้อมช่วยคุณค้นหาทรัพย์ในฝัน",
    en: "We're ready to help you find your dream property",
    cn: "我们随时帮您找到理想房产",
  },
  welcome_cta: {
    th: "เลือกเมนูด้านล่างเพื่อเริ่มต้น 👇",
    en: "Select a menu below to start 👇",
    cn: "请选择以下菜单开始 👇",
  },
  menu_search: {
    th: "ค้นหาทรัพย์ ตามประเภท",
    en: "Search by property type",
    cn: "按类型搜索",
  },
  menu_deposit: {
    th: "ฝากขาย / ฝากเช่าทรัพย์",
    en: "List your property",
    cn: "委托出售/出租",
  },
  menu_contact: {
    th: "ติดต่อเจ้าหน้าที่",
    en: "Contact our team",
    cn: "联系我们",
  },
  btn_website: {
    th: "🌐 เปิดเว็บไซต์",
    en: "🌐 Open Website",
    cn: "🌐 访问网站",
  },
  qr_search: {
    th: "🏠 ค้นหาทรัพย์",
    en: "🏠 Search Property",
    cn: "🏠 搜索房产",
  },
  qr_deposit: {
    th: "📝 ฝากขาย/เช่า",
    en: "📝 Deposit Property",
    cn: "📝 委托房产",
  },
  qr_contact: {
    th: "📞 ติดต่อเจ้าหน้าที่",
    en: "📞 Contact Us",
    cn: "📞 联系我们",
  },
  qr_lang: {
    th: "🌐 เปลี่ยนภาษา",
    en: "🌐 Language",
    cn: "🌐 切换语言",
  },
  select_type: {
    th: "เลือกประเภททรัพย์ที่สนใจ 👇",
    en: "Select property type 👇",
    cn: "请选择房产类型 👇",
  },
  select_area: {
    th: "เลือกทำเลที่สนใจ 📍",
    en: "Select location 📍",
    cn: "选择地点 📍",
  },
  no_results: {
    th: "ขออภัยค่ะ ไม่พบทรัพย์{context} ในขณะนี้\n\nลองค้นหาประเภทอื่น หรือพิมพ์ชื่อทำเลที่ต้องการได้เลยนะคะ 😊",
    en: "Sorry, no properties found{context} at the moment.\n\nTry another type or type a location name 😊",
    cn: "很抱歉，暂时没有找到{context}的房产。\n\n请尝试其他类型或输入地点名称 😊",
  },
  found_n: {
    th: "พบ {n} ทรัพย์",
    en: "Found {n} properties",
    cn: "找到 {n} 个房产",
  },
  found_in_area: {
    th: "พบ {n} ทรัพย์ใน {area}",
    en: "Found {n} properties in {area}",
    cn: "在{area}找到{n}个房产",
  },
  btn_detail: {
    th: "ดูรายละเอียด",
    en: "View Details",
    cn: "查看详情",
  },
  btn_contact_short: {
    th: "ติดต่อ",
    en: "Contact",
    cn: "联系",
  },
  price_ask: {
    th: "ราคาติดต่อสอบถาม",
    en: "Price on request",
    cn: "价格面议",
  },
  per_month: {
    th: "/เดือน",
    en: "/mo",
    cn: "/月",
  },
  bed: { th: "นอน", en: "bed", cn: "卧" },
  bath: { th: "น้ำ", en: "bath", cn: "浴" },
  location: { th: "ทำเล", en: "Location", cn: "地点" },
  contact_title: {
    th: "📞 ติดต่อเจ้าหน้าที่",
    en: "📞 Contact Our Team",
    cn: "📞 联系我们",
  },
  deposit_title: {
    th: "📝 ฝากขาย / ฝากเช่าทรัพย์",
    en: "📝 List Your Property",
    cn: "📝 委托出售/出租",
  },
  deposit_desc: {
    th: "ฝากทรัพย์กับเราฟรี! ไม่มีค่าใช้จ่าย\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชม.",
    en: "List with us for free!\nOur team will contact you within 24 hours.",
    cn: "免费委托！\n我们的团队将在24小时内联系您。",
  },
  deposit_point1: {
    th: "ลงประกาศฟรี ไม่มีค่าใช้จ่าย",
    en: "Free listing, no charges",
    cn: "免费发布，无需费用",
  },
  deposit_point2: {
    th: "ทีมงานดูแลตลอดกระบวนการ",
    en: "Full support throughout the process",
    cn: "全程专业服务",
  },
  deposit_point3: {
    th: "เข้าถึงผู้ซื้อ/ผู้เช่ากว่าพันคน",
    en: "Reach thousands of buyers/tenants",
    cn: "覆盖数千买家/租户",
  },
  deposit_btn: {
    th: "📝 ฝากทรัพย์กับเรา",
    en: "📝 List Your Property",
    cn: "📝 委托房产",
  },
  lang_select: {
    th: "กรุณาเลือกภาษา\nPlease select language.\n请选择语言。",
    en: "กรุณาเลือกภาษา\nPlease select language.\n请选择语言。",
    cn: "กรุณาเลือกภาษา\nPlease select language.\n请选择语言。",
  },
  lang_changed: {
    th: "เปลี่ยนเป็นภาษาไทยแล้วค่ะ 🇹🇭",
    en: "Language changed to English 🇬🇧",
    cn: "已切换为中文 🇨🇳",
  },
  search_fallback_fail: {
    th: 'ขออภัยค่ะ ไม่พบทรัพย์ที่ตรงกับ "{text}"\n\nลองพิมพ์ชื่อทำเล หรือประเภททรัพย์ เช่น "คอนโด บางนา"\nหรือพิมพ์ "เมนู" เพื่อดูตัวเลือกทั้งหมดค่ะ 😊',
    en: 'Sorry, no properties found matching "{text}"\n\nTry typing a location or property type, e.g. "Condo Bangna"\nOr type "menu" to see all options 😊',
    cn: '很抱歉，没有找到匹配"{text}"的房产\n\n请尝试输入地点或类型，例如"公寓 曼纳"\n或输入"菜单"查看所有选项 😊',
  },
  btn_view_details: {
    th: "🌐 ดูรายละเอียดเพิ่ม",
    en: "🌐 View Details",
    cn: "🌐 查看更多",
  },
  btn_book_viewing: {
    th: "❤️ สนใจ",
    en: "❤️ Interested",
    cn: "❤️ 感兴趣",
  },
  btn_contact_agent: {
    th: "💬 ติดต่อเจ้าหน้าที่",
    en: "💬 Contact Agent",
    cn: "💬 联系中介",
  },
  book_viewing_text: {
    th: "สนใจทรัพย์: {title}\n(รหัส: {id})",
    en: "Interested in: {title}\n(ID: {id})",
    cn: "对这套房感兴趣: {title}\n(编号: {id})",
  },
  interested_reply: {
    th: "ขอบคุณที่สนใจนะคะ! 🙏 เจ้าหน้าที่จะติดต่อกลับหาคุณโดยเร็วที่สุดค่ะ 😊✨",
    en: "Thank you for your interest! 🙏 Our team will get back to you as soon as possible. 😊✨",
    cn: "感谢您的关注！🙏 我们的团队会尽快与您联系。😊✨",
  },
};

export function t(
  key: string,
  lang: BotLang,
  replacements?: Record<string, string>,
): string {
  let str = T[key]?.[lang] || T[key]?.th || key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

// Property type labels per language
const PROPERTY_TYPE_LABELS_I18N: Record<string, Record<BotLang, string>> = {
  HOUSE: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅" },
  CONDO: { th: "คอนโด", en: "Condo", cn: "公寓" },
  OFFICE_BUILDING: { th: "สำนักงานออฟฟิศ", en: "Office", cn: "办公楼" },
  POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅" },
  VILLA: { th: "วิลล่า", en: "Villa", cn: "别墅" },
  TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅" },
  LAND: { th: "ที่ดิน", en: "Land", cn: "土地" },
  WAREHOUSE: { th: "โกดัง", en: "Warehouse", cn: "仓库" },
  COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商业楼" },
  OTHER: { th: "อื่นๆ", en: "Other", cn: "其他" },
};

// Area labels (Global Cache for Bot translations)
export type AreaTranslations = Record<
  string,
  { en: string | null; cn: string | null }
>;

function localizeArea(
  areaName: string,
  lang: BotLang,
  translations?: AreaTranslations,
): string {
  if (translations && translations[areaName]) {
    const trans = translations[areaName];
    if (lang === "en" && trans.en) return trans.en;
    if (lang === "cn" && trans.cn) return trans.cn;
  }
  return areaName;
}

// ============================
// Quick Reply Buttons
// ============================
const PROPERTY_TYPE_EMOJI: Record<string, string> = {
  HOUSE: "🏠",
  CONDO: "🏢",
  TOWNHOME: "🏘️",
  LAND: "🗺️",
  OFFICE_BUILDING: "🏛️",
  WAREHOUSE: "🏭",
  COMMERCIAL_BUILDING: "🏪",
  VILLA: "🌴",
  POOL_VILLA: "🏊",
  OTHER: "📦",
};

// ============================
// Language Selection
// ============================
export function buildLanguageSelection(): FlexMessage {
  return {
    type: "flex",
    altText: "กรุณาเลือกภาษา / Please select language",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "กรุณาเลือกภาษา",
            weight: "bold",
            size: "md",
            color: "#1E3A5F",
          },
          {
            type: "text",
            text: "Please select language.",
            size: "sm",
            color: "#666666",
            margin: "xs",
          },
          {
            type: "text",
            text: "请选择语言。",
            size: "sm",
            color: "#666666",
            margin: "xs",
          },
          { type: "separator", margin: "xl" },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "🇹🇭 ไทย",
                  data: "action=lang&value=th",
                  displayText: "ภาษาไทย 🇹🇭",
                },
                style: "primary",
                color: "#1E3A5F",
                height: "sm",
              },
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "🇬🇧 English",
                  data: "action=lang&value=en",
                  displayText: "English 🇬🇧",
                },
                style: "secondary",
                height: "sm",
              },
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "🇨🇳 中文",
                  data: "action=lang&value=cn",
                  displayText: "中文 🇨🇳",
                },
                style: "secondary",
                height: "sm",
              },
            ],
          },
        ],
        paddingAll: "lg",
      },
    },
  };
}

// ============================
// Welcome Greeting Flex
// ============================
export function buildWelcomeFlex(lang: BotLang = "th"): {
  messages: FlexMessage[];
} {
  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: siteConfig.name,
              color: "#FFFFFF",
              size: "xl",
              weight: "bold",
            },
            {
              type: "text",
              text: t("welcome_title", lang),
              color: "#FFFFFF",
              size: "lg",
              margin: "sm",
            },
          ],
        },
      ],
      backgroundColor: "#1E3A5F",
      paddingAll: "lg",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: t("welcome_subtitle", lang),
          weight: "bold",
          size: "md",
          wrap: true,
          color: "#1E3A5F",
        },
        {
          type: "text",
          text: t("welcome_cta", lang),
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true,
        },
        { type: "separator", margin: "xl" },
        {
          type: "box",
          layout: "vertical",
          margin: "xl",
          spacing: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🏠", size: "lg", flex: 0 },
                {
                  type: "text",
                  text: t("menu_search", lang),
                  size: "sm",
                  color: "#333333",
                  flex: 5,
                  gravity: "center",
                },
              ],
              spacing: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📝", size: "lg", flex: 0 },
                {
                  type: "text",
                  text: t("menu_deposit", lang),
                  size: "sm",
                  color: "#333333",
                  flex: 5,
                  gravity: "center",
                },
              ],
              spacing: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📞", size: "lg", flex: 0 },
                {
                  type: "text",
                  text: t("menu_contact", lang),
                  size: "sm",
                  color: "#333333",
                  flex: 5,
                  gravity: "center",
                },
              ],
              spacing: "md",
            },
          ],
        },
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: t("btn_website", lang),
            uri: siteConfig.url,
          },
          style: "primary",
          color: "#1E3A5F",
          height: "sm",
        },
      ],
      paddingAll: "md",
    },
  };

  const quickReply: QuickReply = {
    items: [
      {
        type: "action" as const,
        action: {
          type: "postback" as const,
          label: t("qr_search", lang).slice(0, 20),
          data: "action=search",
          displayText: t("qr_search", lang),
        },
      },
      {
        type: "action" as const,
        action: {
          type: "postback" as const,
          label: t("qr_deposit", lang).slice(0, 20),
          data: "action=deposit",
          displayText: t("qr_deposit", lang),
        },
      },
      {
        type: "action" as const,
        action: {
          type: "postback" as const,
          label: t("qr_contact", lang).slice(0, 20),
          data: "action=contact",
          displayText: t("qr_contact", lang),
        },
      },
      {
        type: "action" as const,
        action: {
          type: "postback" as const,
          label: t("qr_lang", lang).slice(0, 20),
          data: "action=change_lang",
          displayText: t("qr_lang", lang),
        },
      },
    ],
  };

  return {
    messages: [
      {
        type: "flex",
        altText: t("welcome_title", lang),
        contents: bubble,
        quickReply,
      },
    ],
  };
}

// ============================
// Property Type Quick Reply
// ============================
export function buildPropertyTypeQuickReply(
  lang: BotLang = "th",
  activeTypes?: string[],
): { type: "text"; text: string; quickReply: QuickReply } {
  // Use DB-sourced activeTypes if provided, otherwise show common types
  const typesToShow: string[] =
    activeTypes && activeTypes.length > 0
      ? activeTypes.slice(0, 13) // LINE Quick Reply max 13
      : [
          "CONDO",
          "HOUSE",
          "TOWNHOME",
          "VILLA",
          "POOL_VILLA",
          "OFFICE_BUILDING",
          "LAND",
          "WAREHOUSE",
          "COMMERCIAL_BUILDING",
        ];

  const items: QuickReplyItem[] = typesToShow.map((type) => {
    const label =
      PROPERTY_TYPE_LABELS_I18N[type]?.[lang] ||
      PROPERTY_TYPE_LABELS[type as PropertyType] ||
      type;
    return {
      type: "action" as const,
      action: {
        type: "postback" as const,
        label: `${PROPERTY_TYPE_EMOJI[type] || "📦"} ${label}`.slice(0, 20),
        data: new URLSearchParams({ action: "select_type", type }).toString(),
        displayText: `${PROPERTY_TYPE_EMOJI[type] || "📦"} ${label}`,
      },
    };
  });

  return {
    type: "text",
    text: t("select_type", lang),
    quickReply: { items },
  };
}

// ============================
// Area Quick Reply (per type)
// ============================
export function buildAreaQuickReply(
  propertyType: string,
  areas: string[],
  lang: BotLang = "th",
  areaTranslations?: AreaTranslations,
): { type: "text"; text: string; quickReply: QuickReply } {
  const typeLabel =
    PROPERTY_TYPE_LABELS_I18N[propertyType]?.[lang] ||
    PROPERTY_TYPE_LABELS[propertyType as PropertyType] ||
    propertyType;

  const limitedAreas = areas.slice(0, 13);

  const items: QuickReplyItem[] = limitedAreas.map((area) => {
    const localizedLabel = localizeArea(area, lang, areaTranslations);
    return {
      type: "action" as const,
      action: {
        type: "postback" as const,
        label: `📍 ${localizedLabel}`.slice(0, 20),
        data: new URLSearchParams({
          action: "select_area",
          type: propertyType,
          area: area,
        }).toString(),
        displayText: `📍 ${localizedLabel}`,
      },
    };
  });

  return {
    type: "text",
    text: `${typeLabel} — ${t("select_area", lang)}`,
    quickReply: { items },
  };
}

// ============================
// Search Result Text
// ============================
export function buildSearchResultText(
  n: number,
  propertyType: string,
  area?: string,
  lang: BotLang = "th",
  areaTranslations?: AreaTranslations,
): { type: "text"; text: string; quickReply: QuickReply } {
  const typeLabel =
    PROPERTY_TYPE_LABELS_I18N[propertyType]?.[lang] ||
    PROPERTY_TYPE_LABELS[propertyType as PropertyType] ||
    propertyType;

  let text = t("found_n", lang, { n: String(n) });
  if (area) {
    const localizedArea = localizeArea(area, lang, areaTranslations);
    text += ` ${t("in_area", lang, { area: localizedArea })}`;
  }
  text += ` ${t("for_type", lang, { type: typeLabel })}`;

  const items: QuickReplyItem[] = [
    {
      type: "action" as const,
      action: {
        type: "postback" as const,
        label: t("qr_search_again", lang).slice(0, 20),
        data: "action=search",
        displayText: t("qr_search_again", lang),
      },
    },
  ];

  return {
    type: "text",
    text: text,
    quickReply: { items },
  };
}

// ============================
// Property Flex Carousel
// ============================
export function buildPropertyCarousel(
  properties: PropertyForFlex[],
  headerText?: string,
  lang: BotLang = "th",
  areaTranslations?: AreaTranslations,
): FlexMessage {
  const bubbles: FlexBubble[] = properties
    .map((prop) => {
      try {
        const coverImage = prop.property_images?.find((img) => img.is_cover);
        const rawImageUrl =
          coverImage?.image_url ||
          prop.property_images?.[0]?.image_url ||
          "https://placehold.co/600x400?text=No+Image";

        const ensureHttps = (url: string) => {
          if (!url) return "https://placehold.co/600x400?text=No+URL";
          let cleanUrl = url.trim();
          if (cleanUrl.startsWith("http://")) {
            cleanUrl = cleanUrl.replace("http://", "https://");
          } else if (cleanUrl.startsWith("//")) {
            cleanUrl = "https:" + cleanUrl;
          }
          // LINE Limit: 1000 chars for URIs
          if (cleanUrl.length > 1000) {
            return "https://placehold.co/600x400?text=URL+Too+Long";
          }
          return cleanUrl;
        };

        const slug = prop.slug || prop.id;
        const encodedSlug = encodeURIComponent(slug);
        const baseUrl = siteConfig.url.endsWith("/")
          ? siteConfig.url.slice(0, -1)
          : siteConfig.url;

        let propertyUrl = ensureHttps(`${baseUrl}/properties/${encodedSlug}`);

        // Fallback: If URL with slug is too long (> 1000), use ID which is shorter
        if (propertyUrl.length > 950 && prop.slug) {
          propertyUrl = ensureHttps(`${baseUrl}/properties/${prop.id}`);
        }

        const imageUrl = ensureHttps(getPublicImageUrl(rawImageUrl));

        // Localized title
        let title = prop.title || "—";
        if (lang === "en" && prop.title_en) title = prop.title_en;
        if (lang === "cn" && prop.title_cn) title = prop.title_cn;

        // Price display logic (New enhanced version based on Inquiry action)
        const priceContents = [];
        const hasRent =
          (prop.rental_price || 0) > 0 || (prop.original_rental_price || 0) > 0;
        const hasSale = (prop.price || 0) > 0 || (prop.original_price || 0) > 0;

        const createPriceNode = (
          current: number | null,
          original: number | null,
          unit: string,
        ) => {
          const pNodes = [];
          const mainPrice = current || original;
          if (!mainPrice) return [];

          if (original && current && original > current) {
            const discount = Math.round(
              ((original - current) / original) * 100,
            );
            pNodes.push({
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: `฿${original.toLocaleString()}`,
                      size: "xs",
                      color: "#888888",
                      decoration: "line-through",
                    },
                    {
                      type: "text",
                      text: `฿${current.toLocaleString()}${unit}`,
                      weight: "bold",
                      size: "md",
                      color: "#E53935",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: `-${discount}%`,
                      size: "xxs",
                      color: "#E53935",
                      weight: "bold",
                      align: "center",
                      gravity: "center",
                    },
                  ],
                  backgroundColor: "#FFEBEE",
                  paddingAll: "xs",
                  cornerRadius: "sm",
                  margin: "sm",
                  flex: 0,
                },
              ],
              alignItems: "center",
            });
          } else {
            pNodes.push({
              type: "text",
              text: `฿${mainPrice.toLocaleString()}${unit}`,
              weight: "bold",
              size: "md",
              color: "#E53935",
            });
          }
          return pNodes;
        };

        if (hasRent) {
          priceContents.push(
            ...createPriceNode(
              prop.rental_price ?? null,
              prop.original_rental_price ?? null,
              t("per_month", lang),
            ),
          );
        }
        if (hasSale) {
          if (hasRent) priceContents.push({ type: "separator", margin: "xs" });
          priceContents.push(
            ...createPriceNode(
              prop.price ?? null,
              prop.original_price ?? null,
              "",
            ),
          );
        }
        if (priceContents.length === 0) {
          priceContents.push({
            type: "text",
            text: t("price_ask", lang),
            weight: "bold",
            size: "md",
            color: "#E53935",
          });
        }

        return {
          type: "bubble",
          hero: {
            type: "image",
            url: imageUrl,
            size: "full",
            aspectRatio: "4:3",
            aspectMode: "cover",
            action: { type: "uri", uri: propertyUrl },
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: title,
                weight: "bold",
                size: "sm",
                wrap: true,
                maxLines: 2,
                color: "#333333",
              },
              // Price Section
              {
                type: "box",
                layout: "vertical",
                margin: "sm",
                spacing: "xs",
                contents: priceContents,
              },
              // Area
              ...(prop.popular_area
                ? [
                    {
                      type: "text",
                      text: `📍 ${localizeArea(prop.popular_area, lang, areaTranslations)}`,
                      size: "xxs",
                      color: "#888888",
                      margin: "xs",
                    },
                  ]
                : []),
              // Specs Row (Simplified - matching user's working example)
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: `🛏️ ${prop.bedrooms || "-"}`,
                    size: "xxs",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `🚿 ${prop.bathrooms || "-"}`,
                    size: "xxs",
                    color: "#666666",
                    flex: 1,
                    align: "center",
                  },
                  {
                    type: "text",
                    text: `📏 ${prop.size_sqm || "-"} sqm`,
                    size: "xxs",
                    color: "#666666",
                    flex: 2,
                    align: "center",
                  },
                ],
              },
            ],
            paddingAll: "md",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "uri",
                  label: t("btn_detail", lang),
                  uri: propertyUrl,
                },
                color: "#1E3A5F",
                flex: 1,
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "uri",
                  label: t("btn_contact_short", lang),
                  uri: `${propertyUrl}#contact`,
                },
                flex: 1,
              },
            ],
            paddingAll: "md",
          },
        };
      } catch (err) {
        console.error(`[BOT] Error building bubble for property:`, err);
        return null;
      }
    })
    .filter(Boolean) as FlexBubble[];

  const validBubbles = bubbles.slice(0, 10);

  return {
    type: "flex",
    altText: headerText || t("found_n", lang, { n: String(properties.length) }),
    contents: {
      type: "carousel",
      contents: validBubbles,
    },
  };
}

// ============================
// Contact Info Message
// ============================
export function buildContactInfoMessage(lang: BotLang = "th"): FlexMessage {
  return {
    type: "flex",
    altText: t("contact_title", lang),
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: t("contact_title", lang),
            weight: "bold",
            size: "lg",
            color: "#1E3A5F",
          },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📱", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: siteConfig.contact.phone,
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                    weight: "bold",
                  },
                ],
                spacing: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💬", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: `LINE: ${siteConfig.contact.lineId}`,
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                    weight: "bold",
                  },
                ],
                spacing: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✉️", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: siteConfig.contact.email,
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                    weight: "bold",
                  },
                ],
                spacing: "md",
              },
            ],
          },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: t("btn_website", lang),
              uri: siteConfig.url,
            },
            style: "primary",
            color: "#1E3A5F",
            height: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  };
}

// ============================
// Deposit / List Property Message
// ============================
export function buildDepositFlex(lang: BotLang = "th"): FlexMessage {
  return {
    type: "flex",
    altText: t("deposit_title", lang),
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: t("deposit_title", lang),
            weight: "bold",
            size: "lg",
            color: "#1E3A5F",
          },
          {
            type: "text",
            text: t("deposit_desc", lang),
            size: "sm",
            color: "#666666",
            margin: "lg",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: t("deposit_point1", lang),
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                  },
                ],
                spacing: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: t("deposit_point2", lang),
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                  },
                ],
                spacing: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  {
                    type: "text",
                    text: t("deposit_point3", lang),
                    size: "sm",
                    color: "#333333",
                    flex: 5,
                  },
                ],
                spacing: "md",
              },
            ],
          },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: t("deposit_btn", lang),
              uri: `${siteConfig.url}/#deposit-section`,
            },
            style: "primary",
            color: "#7C3AED",
            height: "sm",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: t("qr_contact", lang).slice(0, 20),
              text: "ติดต่อเจ้าหน้าที่",
            },
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  };
}

// ============================
// No Results Message
// ============================
export function buildNoResultsMessage(
  context: string,
  lang: BotLang = "th",
): { type: "text"; text: string; quickReply: QuickReply } {
  return {
    type: "text",
    text: t("no_results", lang, { context }),
    quickReply: {
      items: [
        {
          type: "action" as const,
          action: {
            type: "message" as const,
            label: t("qr_search", lang).slice(0, 20),
            text: "ค้นหาทรัพย์",
          },
        },
      ],
    },
  };
} // ============================
// Commission Statement Flex
// ============================
export function buildCommissionStatementFlex(data: {
  dealTitle: string;
  agentName: string;
  role: string;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  date: string;
}): FlexMessage {
  return {
    type: "flex",
    altText: `ใบแจ้งค่าคอมมิชชั่น: ${data.dealTitle}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ใบสรุปยอดคอมมิชชั่น",
            weight: "bold",
            color: "#FFFFFF",
            size: "lg",
          },
          {
            type: "text",
            text: data.date,
            color: "#AABBDD",
            size: "xs",
          },
        ],
        backgroundColor: "#1E3A5F",
        paddingAll: "lg",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: data.dealTitle,
            weight: "bold",
            size: "md",
            wrap: true,
            color: "#1E3A5F",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "Recipient:",
                size: "xs",
                color: "#888888",
                flex: 2,
              },
              {
                type: "text",
                text: data.agentName,
                size: "xs",
                color: "#333333",
                flex: 4,
                weight: "bold",
              },
            ],
            margin: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "Role:",
                size: "xs",
                color: "#888888",
                flex: 2,
              },
              {
                type: "text",
                text: data.role,
                size: "xs",
                color: "#333333",
                flex: 4,
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
                  {
                    type: "text",
                    text: "Gross Amount",
                    size: "sm",
                    color: "#555555",
                  },
                  {
                    type: "text",
                    text: `฿${data.grossAmount.toLocaleString()}`,
                    size: "sm",
                    align: "end",
                    weight: "bold",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "WHT (3%)",
                    size: "sm",
                    color: "#555555",
                  },
                  {
                    type: "text",
                    text: `-฿${data.whtAmount.toLocaleString()}`,
                    size: "sm",
                    align: "end",
                    color: "#E53935",
                  },
                ],
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            backgroundColor: "#F0F4F8",
            paddingAll: "md",
            cornerRadius: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "NET PAYOUT",
                    weight: "bold",
                    color: "#1E3A5F",
                    size: "sm",
                  },
                  {
                    type: "text",
                    text: `฿${data.netAmount.toLocaleString()}`,
                    weight: "bold",
                    color: "#0066CC",
                    align: "end",
                    size: "md",
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "Thank you for being part of our team! 🚀",
            size: "xxs",
            align: "center",
            color: "#AAAAAA",
          },
        ],
        paddingAll: "sm",
      },
    },
  };
}

// ============================
// Social Post Flex Card
// ============================
export function buildSocialPostFlex(
  prop: PropertyForFlex,
  images: string[],
  customContent?: string,
  lang: BotLang = "th",
): FlexMessage {
  const ensureHttps = (url: string) => {
    if (!url) return "https://placehold.co/600x400?text=No+URL";
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith("http://")) {
      cleanUrl = cleanUrl.replace("http://", "https://");
    } else if (cleanUrl.startsWith("//")) {
      cleanUrl = "https:" + cleanUrl;
    }
    if (cleanUrl.length > 1000) {
      return "https://placehold.co/600x400?text=URL+Too+Long";
    }
    return cleanUrl;
  };

  const rawBase = siteConfig.url;
  let baseUrl = rawBase;
  
  // If we're getting a localhost URL in a production-like context (LINE requires HTTPS), 
  // or if the URL is empty/missing, use the verified production domain as a robust fallback.
  if (!baseUrl || baseUrl.includes("localhost") || !baseUrl.startsWith("http")) {
    baseUrl = "https://realestate-crm-rho.vercel.app";
  }
  
  baseUrl = baseUrl.replace(/\/$/, "");
  
  const targetId = prop.slug || prop.id;
  let propertyUrl = `${baseUrl}/properties/${encodeURIComponent(targetId || prop.id || "")}`;
  
  // Ensure it's never empty to avoid the "No URL" placeholder
  if (!targetId && !prop.id) {
    propertyUrl = baseUrl;
  }
  
  // Final sanitize via shared helper
  propertyUrl = ensureHttps(propertyUrl);

  // Localized Title
  const title =
    (lang === "th" ? prop.title : (prop as any)[`title_${lang}`]) ||
    prop.title ||
    "—";


  const PROPERTY_TYPE_LABELS_I18N: Record<string, Record<string, string>> = {
    HOUSE: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅" },
    CONDO: { th: "คอนโด", en: "Condo", cn: "公寓" },
    TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅" },
    LAND: { th: "ที่ดิน", en: "Land", cn: "土地" },
    OFFICE_BUILDING: { th: "สำนักงานออฟฟิศ", en: "Office Building", cn: "办公楼" },
    WAREHOUSE: { th: "โกดัง", en: "Warehouse", cn: "仓库" },
    COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial Building", cn: "商用建筑" },
    VILLA: { th: "วิลล่า", en: "Villa", cn: "别墅" },
    POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅" },
    OTHER: { th: "อื่นๆ", en: "Other", cn: "其他" },
  };

  const LISTING_TYPE_LABELS_I18N: Record<string, Record<string, string>> = {
    SALE: { th: "ขาย", en: "For Sale", cn: "出售" },
    RENT: { th: "เช่า", en: "For Rent", cn: "出租" },
    SALE_AND_RENT: {
      th: "ขายและเช่า",
      en: "Sale & Rent",
      cn: "出售/出租",
    },
  };

  const propertyTypeLabelValue =
    PROPERTY_TYPE_LABELS_I18N[prop.property_type || ""]?.[lang] ||
    (lang === "th"
      ? PROPERTY_TYPE_LABELS[prop.property_type as PropertyType]
      : (prop as any)[`property_type_${lang}`]) ||
    PROPERTY_TYPE_LABELS[prop.property_type as PropertyType] ||
    prop.property_type ||
    "—";

  const typeLabel =
    LISTING_TYPE_LABELS_I18N[prop.listing_type || ""]?.[lang] ||
    LISTING_TYPE_LABELS[prop.listing_type as ListingType] ||
    prop.listing_type ||
    (lang === "en" ? "Property" : lang === "cn" ? "房产" : "ทรัพย์สิน");
  // 1. Localize location (static dictionary for common Thai areas since DB doesn't have localized fields)
  const translateLocation = (val: string | null | undefined, lang: BotLang) => {
    if (!val) return "";
    return LOCATION_MAP[val]?.[lang] || val;
  };

  // 1. Enhanced Location Logic (Flexible Localized Fields)
  const getLoc = (field: string, l: BotLang) => {
    const p = prop as any;
    // Try literal fields first (field_th, field_en, etc.)
    const localizedField = p[`${field}_${l}`];
    if (localizedField) return localizedField;

    // If TH, use base field
    if (l === "th") return p[field] || "";

    // If not found in DB, use utilities
    if (field === "province") return getProvinceName(p[field] || "", l);
    return translateLocation(p[field] || "", l);
  };

  const tPopularArea = getLoc("popular_area", lang);
  const tDistrict = getLoc("district", lang);
  const tProvince = getLoc("province", lang);

  const locationText = [
    tPopularArea
      ? lang === "th"
        ? `ย่าน${tPopularArea}`
        : tPopularArea
      : null,
    tDistrict,
    tProvince,
  ]
    .filter(Boolean)
    .join(", ");

  // 2. Enhanced Price Display (Support Sale & Rent with Fallbacks)
  const formatPrice = (p: number | string | null | undefined) => {
    if (p === null || p === undefined || p === "" || p === 0) return null;
    const num = Number(p);
    return isNaN(num) ? p.toString() : num.toLocaleString();
  };

  const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : "出售";
  const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : "出租";
  const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : "泰铢";
  const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : "/月";

  const saleVal = prop.price || prop.original_price || (prop as any).price_sale;
  const rentVal =
    prop.rental_price || prop.original_rental_price || (prop as any).price_rent;

  const lt = (prop.listing_type || "").toString().toUpperCase();

  let priceDisplay = "";
  if (lt === "SALE_AND_RENT" || lt === "RENT-SALE" || lt === "RENT_SALE") {
    const parts = [];
    if (saleVal) parts.push(`${tSale} ${formatPrice(saleVal)} ${tBaht}`);
    if (rentVal)
      parts.push(`${tRent} ${formatPrice(rentVal)} ${tBaht}${tPerMonth}`);
    priceDisplay = parts.join("\n") || t("price_ask", lang);
  } else if (lt === "RENT") {
    priceDisplay = rentVal
      ? `${formatPrice(rentVal)} ${tBaht}${tPerMonth}`
      : t("price_ask", lang);
  } else {
    priceDisplay = saleVal
      ? `${formatPrice(saleVal)} ${tBaht}`
      : t("price_ask", lang);
  }

  // Helper for Spec item (🛌, 🚿, etc)
  const specItem = (
    icon: string,
    text: string,
    align: "start" | "center" | "end" = "center",
  ) => ({
    type: "box" as const,
    layout: "vertical" as const,
    flex: 1,
    contents: [
      {
        type: "text" as const,
        text: `${icon} ${text}`,
        size: "xs" as const,
        color: "#666666",
        align: align,
      },
    ],
  });

  const headerImages =
    images.length > 0
      ? images.slice(0, 4)
      : ["https://placehold.co/600x400?text=Property+Image"];

  // Fill grid to 4 if needed for consistency
  const gridImages = [...headerImages];
  while (gridImages.length < 4 && headerImages.length > 0) {
    gridImages.push(headerImages[0]); // Duplicate cover if fewer than 4
  }

  const imageToFlexItem = (img: string) => ({
    type: "image" as const,
    url: ensureHttps(getPublicImageUrl(img)),
    size: "full" as const,
    aspectMode: "cover" as const,
    aspectRatio: "1:1",
    flex: 1,
  });

  const bubble: FlexBubble = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `🔥 ${title}`,
          weight: "bold",
          size: "lg",
          wrap: true,
          color: "#1E3A5F",
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "xs",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: `${propertyTypeLabelValue} | ${typeLabel}`,
              size: "xs",
              color: "#888888",
              flex: 0,
            }
          ],
        },
      ],
      paddingAll: "lg",
      paddingBottom: "none",
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "none",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: gridImages.slice(0, 2).map(imageToFlexItem),
              spacing: "xs",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: gridImages.slice(2, 4).map(imageToFlexItem),
              spacing: "xs",
              margin: "xs",
            },
          ],
          paddingAll: "lg",
          paddingBottom: "none",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: priceDisplay,
              weight: "bold",
              size: "md",
              color: "#E53935",
              wrap: true, // Allow price to wrap if it's dual
            },
            {
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "📍",
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: locationText || "—",
                  size: "xs",
                  color: "#666666",
                  margin: "sm",
                  wrap: true,
                },
              ],
            },
            {
              type: "box" as const,
              layout: "horizontal",
              margin: "lg" as const,
              contents: [
                specItem(
                  "🛌",
                  `${prop.bedrooms || "-"}${t("bed", lang)}`,
                  "start",
                ),
                specItem(
                  "🚿",
                  `${prop.bathrooms || "-"}${t("bath", lang)}`,
                  "center",
                ),
                ...(prop.size_sqm
                  ? [
                      specItem(
                        "",
                        `${prop.size_sqm}${lang === "th" ? "ตร.ม." : "sq.m."}`,
                        prop.land_size_sqwah ? "center" : "end",
                      ),
                    ]
                  : []),
                ...(prop.land_size_sqwah
                  ? [
                      specItem(
                        "",
                        `${prop.land_size_sqwah}${lang === "th" ? "ตร.ว." : "sq.w."}`,
                        "end",
                      ),
                    ]
                  : []),
              ],
            },
          ],
          paddingAll: "lg",
        },
        ...(customContent
          ? [
              {
                type: "box" as const,
                layout: "vertical" as const,
                paddingAll: "lg" as const,
                paddingTop: "none" as const,
                contents: [
                  {
                    type: "separator" as const,
                    margin: "md" as const,
                  },
                  {
                    type: "text" as const,
                    text: customContent || (lang === "th" ? "รายละเอียดทรัพย์..." : lang === "en" ? "Property Details..." : "房产详情..."),
                    size: "xs" as const,
                    color: "#666666",
                    wrap: true,
                    margin: "lg" as const,
                  },
                ],
              },
            ]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#1E3A5F",
          cornerRadius: "md",
          height: "40px",
          justifyContent: "center",
          action: {
            type: "uri",
            label: t("btn_view_details", lang),
            uri: propertyUrl,
          },
          contents: [
            {
              type: "text",
              text: t("btn_view_details", lang),
              color: "#FFFFFF",
              size: "xs",
              align: "center",
              weight: "bold",
            },
          ],
        },
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#F5F5F5",
              cornerRadius: "md",
              height: "40px",
              justifyContent: "center",
              flex: 1,
              action: {
                type: "message",
                label: t("btn_book_viewing", lang),
                text: t("book_viewing_text", lang, {
                  title: title.slice(0, 150),
                  id: prop.id,
                }),
              },
              contents: [
                {
                  type: "text",
                  text: t("btn_book_viewing", lang),
                  color: "#666666",
                  size: "xs",
                  align: "center",
                },
              ],
            },
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#F5F5F5",
              cornerRadius: "md",
              height: "40px",
              justifyContent: "center",
              flex: 1,
              action: {
                type: "uri",
                label: t("btn_contact_agent", lang),
                uri: siteConfig.links.line || "https://line.me",
              },
              contents: [
                {
                  type: "text",
                  text: t("btn_contact_agent", lang),
                  color: "#666666",
                  size: "xs",
                  align: "center",
                },
              ],
            },
          ],
        },
      ],
      paddingAll: "md",
    },
  };

  return {
    type: "flex",
    altText: `แชร์ทรัพย์: ${title}`,
    contents: bubble,
  };
}
