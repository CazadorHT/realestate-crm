import { siteConfig } from "@/lib/site-config";
import {
  PROPERTY_TYPE_LABELS,
  type PropertyType,
} from "@/features/properties/labels";
import { getPublicImageUrl } from "@/features/properties/image-utils";

// ============================
// Types
// ============================
export type BotLang = "th" | "en" | "cn";

type FlexBubble = Record<string, any>;
type FlexMessage = { type: "flex"; altText: string; contents: any };
type QuickReplyItem = {
  type: "action";
  action: { type: string; label: string; text?: string; uri?: string };
};

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
  listing_type?: string | null;
  popular_area?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  property_images?: { image_url: string; is_cover?: boolean }[];
}

// ============================
// i18n Strings
// ============================
const T: Record<string, Record<BotLang, string>> = {
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
};

function t(
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
export function buildLanguageSelection(): any {
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
        paddingAll: "20px",
      },
    },
  };
}

// ============================
// Welcome Greeting Flex
// ============================
export function buildWelcomeFlex(lang: BotLang = "th"): {
  messages: any[];
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
              text: "V-LINK ASSET",
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
      paddingAll: "20px",
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
      paddingAll: "20px",
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
      paddingAll: "12px",
    },
  };

  const quickReply = {
    items: [
      {
        type: "action",
        action: {
          type: "postback",
          label: t("qr_search", lang).slice(0, 20),
          data: "action=search",
          displayText: t("qr_search", lang),
        },
      },
      {
        type: "action",
        action: {
          type: "postback",
          label: t("qr_deposit", lang).slice(0, 20),
          data: "action=deposit",
          displayText: t("qr_deposit", lang),
        },
      },
      {
        type: "action",
        action: {
          type: "postback",
          label: t("qr_contact", lang).slice(0, 20),
          data: "action=contact",
          displayText: t("qr_contact", lang),
        },
      },
      {
        type: "action",
        action: {
          type: "postback",
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
): any {
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
      type: "action",
      action: {
        type: "postback",
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
): any {
  const typeLabel =
    PROPERTY_TYPE_LABELS_I18N[propertyType]?.[lang] ||
    PROPERTY_TYPE_LABELS[propertyType as PropertyType] ||
    propertyType;

  const limitedAreas = areas.slice(0, 13);

  const items: QuickReplyItem[] = limitedAreas.map((area) => {
    const localizedLabel = localizeArea(area, lang, areaTranslations);
    return {
      type: "action",
      action: {
        type: "postback",
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

        const imageUrl = getPublicImageUrl(rawImageUrl);

        const slug = prop.slug || prop.id;
        const propertyUrl = `${siteConfig.url}/properties/${slug}`;

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
                  paddingAll: "2px",
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
export function buildContactInfoMessage(lang: BotLang = "th"): any {
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
        paddingAll: "20px",
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
        paddingAll: "12px",
      },
    },
  };
}

// ============================
// Deposit / List Property Message
// ============================
export function buildDepositMessage(lang: BotLang = "th"): any {
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
        paddingAll: "20px",
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
        paddingAll: "12px",
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
): any {
  return {
    type: "text",
    text: t("no_results", lang, { context }),
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: t("qr_search", lang).slice(0, 20),
            text: "ค้นหาทรัพย์",
          },
        },
      ],
    },
  };
}
