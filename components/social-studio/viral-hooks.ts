import type { SocialStudioProperty, StudioLanguage } from "./types";

export interface ViralHookItem {
  id: string;
  category: "urgency" | "location" | "space" | "finance";
  text: string;
  badge: string;
}

export const PRESET_VIRAL_HOOKS: Record<StudioLanguage, ViralHookItem[]> = {
  th: [
    // Urgency & Hot Deals
    { id: "u1", category: "urgency", badge: "🔥 หลุดจอง", text: "หลุดจองด่วน ห้องสุดท้าย!" },
    { id: "u2", category: "urgency", badge: "⚡ ลดกระหน่ำ", text: "เจ้าของยอมปล่อยขาดทุน ด่วน!" },
    { id: "u3", category: "urgency", badge: "🚨 ด่วนที่สุด", text: "ลดราคาแรงมาก ช้าหมดอด!" },
    { id: "u4", category: "urgency", badge: "💥 ดีลลับ", text: "ดีลลับเฉพาะสัปดาห์นี้เท่านั้น!" },

    // Location & Transit
    { id: "l1", category: "location", badge: "🚆 ติดรถไฟฟ้า", text: "ก้าวเดียวถึง BTS 0 ม. ไม่ต้องง้อรถ!" },
    { id: "l2", category: "location", badge: "📍 ทำเลทอง", text: "ทำเลทองใจกลางเมือง เดินทางโคตรสะดวก!" },
    { id: "l3", category: "location", badge: "🚶 ใกล้ห้างดัง", text: "เดิน 3 นาทีถึงห้าง ไลฟ์สไตล์ครบครัน" },
    { id: "l4", category: "location", badge: "✨ ทำเลในฝัน", text: "ทำเลศักยภาพสูง ของหายาก!" },

    // Space & Lifestyle
    { id: "s1", category: "space", badge: "🏢 ไซส์บ้าน", text: "คอนโดไซส์บ้าน โปร่งโล่ง อยู่สบาย!" },
    { id: "s2", category: "space", badge: "🌅 วิวตาแตก", text: "วิวสวยตาแตก ชั้นสูง ไม่บล็อกวิว!" },
    { id: "s3", category: "space", badge: "🛋️ แต่งครบ", text: "ตกแต่งครบ ลากกระเป๋าเข้าอยู่ได้เลย!" },
    { id: "s4", category: "space", badge: "👑 เพดานสูง", text: "เพดานสูงเหมือนเพนท์เฮาส์ สวยหรู!" },

    // Finance & Investment
    { id: "f1", category: "finance", badge: "💰 ผ่อนคุ้ม", text: "ผ่อนถูกกว่าเช่า คุ้มค่าที่สุด!" },
    { id: "f2", category: "finance", badge: "📈 Yield สูง", text: "Yield สูง การันตีผู้เช่าเต็มตลอดปี!" },
    { id: "f3", category: "finance", badge: "✨ ต่ำกว่าทุน", text: "ซื้อราคานี้ ได้ติดหรูขนาดนี้?!" },
    { id: "f4", category: "finance", badge: "🎁 ฟรีโอน", text: "กู้ได้เต็ม 100% ฟรีค่าใช้จ่ายวันโอน!" },
  ],
  en: [
    { id: "u1_en", category: "urgency", badge: "🔥 Last Unit", text: "Last Available Unit! Act Fast!" },
    { id: "u2_en", category: "urgency", badge: "⚡ Below Market", text: "Owner Selling Below Market Value!" },
    { id: "u3_en", category: "urgency", badge: "🚨 Rare Deal", text: "Rare Deal of the Month, Won't Last!" },
    { id: "l1_en", category: "location", badge: "🚆 0m to BTS", text: "Zero Steps to BTS! Prime Location!" },
    { id: "l2_en", category: "location", badge: "📍 City Heart", text: "Prime City Center, Walk Everywhere!" },
    { id: "s1_en", category: "space", badge: "🏢 Penthouse Feel", text: "Spacious Living with Unblocked View!" },
    { id: "s2_en", category: "space", badge: "🛋️ Fully Furnished", text: "Designer Decorated, Move-in Ready!" },
    { id: "f1_en", category: "finance", badge: "💰 High Yield", text: "High Rental Yield 6%+ Investor Choice!" },
    { id: "f2_en", category: "finance", badge: "📈 Cheaper than Rent", text: "Own for Less than Renting!" },
  ],
  zh: [
    { id: "u1_zh", category: "urgency", badge: "🔥 降价急售", text: "房东降价急售！捡漏手慢无！" },
    { id: "u2_zh", category: "urgency", badge: "⚡ 最后一间", text: "最后一间！超高性价比即刻入住！" },
    { id: "l1_zh", category: "location", badge: "🚆 紧邻地铁", text: "步行0米到轻轨站！交通超便捷！" },
    { id: "s1_zh", category: "space", badge: "🛋️ 精装全配", text: "豪华精装修，提包直接入住！" },
    { id: "f1_zh", category: "finance", badge: "💰 高投报率", text: "租金回报率超高，带租约出售！" },
  ],
  ru: [
    { id: "u1_ru", category: "urgency", badge: "🔥 Горячее предложение", text: "Срочная продажа ниже рынка!" },
    { id: "l1_ru", category: "location", badge: "🚆 0м от метро", text: "0 метров от метро BTS! Супер локация!" },
    { id: "s1_ru", category: "space", badge: "🛋️ С мебелью", text: "Готовая квартира с дизайнерским ремонтом!" },
    { id: "f1_ru", category: "finance", badge: "💰 Доходность 7%+", text: "Высокая арендная доходность для инвестора!" },
  ],
};

/**
 * Generate Tailor-Made Viral Hooks dynamically based on Property Details
 */
export function generateDynamicPropertyHooks(
  property: SocialStudioProperty,
  lang: StudioLanguage = "th"
): ViralHookItem[] {
  const dynamicHooks: ViralHookItem[] = [];

  // Transit Hook
  if (property.transit_station_name) {
    const dist = property.transit_distance_meters;
    const distText = dist ? (dist <= 100 ? "0 ม." : `${dist} ม.`) : "เดินถึงได้";
    if (lang === "th") {
      dynamicHooks.push({
        id: "dyn_transit",
        category: "location",
        badge: "🚆 ติดรถไฟฟ้า",
        text: `ใกล้ ${property.transit_type || "BTS"} ${property.transit_station_name} แค่ ${distText}!`,
      });
    } else {
      dynamicHooks.push({
        id: "dyn_transit_en",
        category: "location",
        badge: "🚆 Near Transit",
        text: `Only ${distText} to ${property.transit_type || "BTS"} ${property.transit_station_name_en || property.transit_station_name}!`,
      });
    }
  }

  // Size / Bedroom Hook
  if (property.bedrooms && property.size_sqm) {
    if (lang === "th") {
      dynamicHooks.push({
        id: "dyn_size",
        category: "space",
        badge: "🏢 ไซส์ใหญ่",
        text: `${property.bedrooms} นอน ห้องใหญ่ ${property.size_sqm} ตร.ม. โปร่งโล่งสบาย!`,
      });
    } else {
      dynamicHooks.push({
        id: "dyn_size_en",
        category: "space",
        badge: "🏢 Spacious",
        text: `${property.bedrooms} Bed, Huge ${property.size_sqm} Sqm! Rare find!`,
      });
    }
  }

  // Floor Hook
  if (property.floor && property.floor >= 15) {
    if (lang === "th") {
      dynamicHooks.push({
        id: "dyn_floor",
        category: "space",
        badge: "🌅 ชั้นสูง",
        text: `ชั้น ${property.floor} วิวพาโนรามาสวยสะกดตา!`,
      });
    }
  }

  // Pet Friendly Hook
  if (property.is_pet_friendly) {
    if (lang === "th") {
      dynamicHooks.push({
        id: "dyn_pet",
        category: "space",
        badge: "🐾 เลี้ยงสัตว์ได้",
        text: `คอนโดเลี้ยงสัตว์ได้ 100% หายากในทำเลนี้!`,
      });
    } else {
      dynamicHooks.push({
        id: "dyn_pet_en",
        category: "space",
        badge: "🐾 Pet Friendly",
        text: `100% Pet Friendly Condo in prime location!`,
      });
    }
  }

  return dynamicHooks;
}

/**
 * Get all available hooks combined
 */
export function getAllViralHooks(
  property: SocialStudioProperty,
  lang: StudioLanguage = "th"
): ViralHookItem[] {
  const dynamic = generateDynamicPropertyHooks(property, lang);
  const presets = PRESET_VIRAL_HOOKS[lang] || PRESET_VIRAL_HOOKS.th;
  return [...dynamic, ...presets];
}
