import type { StudioLanguage, StudioPriceFormatStyle, AvailableBadgeItem, SocialStudioProperty } from "./types";
import { formatPrice } from "@/lib/property-utils";

export const AVAILABLE_BADGES: AvailableBadgeItem[] = [
  { id: "foreign_freehold", label: "Foreign Freehold", labelEn: "Foreign Freehold" },
  { id: "foreigner_quota", label: "🌍 Foreigner Quota", labelEn: "🌍 Foreigner Quota" },
  { id: "thai_freehold", label: "Thai Freehold", labelEn: "Thai Freehold" },
  { id: "leasehold", label: "Leasehold", labelEn: "Leasehold" },
  { id: "hot_deal", label: "🔥 Hot Deal", labelEn: "🔥 Hot Deal" },
  { id: "pet_friendly", label: "🐾 เลี้ยงสัตว์ได้", labelEn: "🐾 Pet Friendly" },
  { id: "near_transit", label: "🚆 ใกล้รถไฟฟ้า", labelEn: "🚆 Near Transit" },
  { id: "furnished", label: "🛋️ แต่งครบพร้อมอยู่", labelEn: "🛋️ Fully Furnished" },
  { id: "high_yield", label: "💰 High Yield 6%+", labelEn: "💰 High Yield 6%+" },
  { id: "land_private", label: "📐 มีเนื้อที่ดิน", labelEn: "📐 Private Land", icon: "land" },
  { id: "parking_private", label: "🚗 มีที่จอดรถส่วนตัว", labelEn: "🚗 Private Parking", icon: "parking" },
  { id: "sea_view", label: "🌊 วิวทะเล", labelEn: "🌊 Sea View" },
  { id: "private_pool", label: "🏊 สระว่ายน้ำส่วนตัว", labelEn: "🏊 Private Pool" },
  { id: "corner_unit", label: "🏙️ ห้องมุม วิวโล่ง", labelEn: "🏙️ Corner Unit" },
  { id: "corner_house", label: "🏡 บ้านเดี่ยวหลังมุม", labelEn: "🏡 Corner House" },
  { id: "main_road", label: "✨ ติดถนนใหญ่", labelEn: "✨ Main Road Access" },
  { id: "ready_transfer", label: "🔑 พร้อมโอนกรรมสิทธิ์", labelEn: "🔑 Ready to Transfer" },
  { id: "urgent_sale", label: "⚡ ลดด่วนต่ำกว่าทุน", labelEn: "⚡ Urgent Below Market" },
];

/**
 * Generate real-data dynamic property badges based on the property and manual spec inputs
 */
export function getDynamicPropertyBadges(
  property?: SocialStudioProperty,
  customSpecs?: {
    customSizeSqm?: number | string | null;
    customLandSizeSqwah?: number | string | null;
    customParking?: number | string | null;
    customBedrooms?: number | string | null;
    customBathrooms?: number | string | null;
    customFloor?: number | string | null;
  },
  _lang?: StudioLanguage
): AvailableBadgeItem[] {
  const badges: AvailableBadgeItem[] = [];
  if (!property && !customSpecs) return badges;

  // 1. Usable Area (SQM / ตร.ม.) - Real Property Data
  const rawSqm =
    customSpecs?.customSizeSqm !== "" &&
    customSpecs?.customSizeSqm !== null &&
    customSpecs?.customSizeSqm !== undefined
      ? Number(customSpecs.customSizeSqm)
      : (property?.size_sqm ?? (property as any)?.floor_area ?? null);
  if (rawSqm && Number(rawSqm) > 0) {
    badges.push({
      id: "prop_sqm",
      label: `⤢ ${rawSqm} ตร.ม.`,
      labelEn: `⤢ ${rawSqm} SQ.M.`,
      labelZh: `⤢ ${rawSqm} 平米`,
      labelRu: `⤢ ${rawSqm} м²`,
      icon: "sqm",
      isProp: true,
    });
  }

  // 2. Land Size (ตร.วา / Sq.wah) - Real Property Data
  const rawLand =
    customSpecs?.customLandSizeSqwah !== "" &&
    customSpecs?.customLandSizeSqwah !== null &&
    customSpecs?.customLandSizeSqwah !== undefined
      ? Number(customSpecs.customLandSizeSqwah)
      : (property?.land_size_sqwah ?? (property as any)?.land_area ?? null);
  if (rawLand && Number(rawLand) > 0) {
    badges.push({
      id: "prop_land_sqwah",
      label: `📐 ${rawLand} ตร.วา`,
      labelEn: `📐 ${rawLand} Sq.wah`,
      labelZh: `📐 ${rawLand} 瓦`,
      labelRu: `📐 ${rawLand} ва`,
      icon: "land",
      isProp: true,
    });
  }

  // 3. Parking (ที่จอดรถ / Parking) - Real Property Data
  const rawParking =
    customSpecs?.customParking !== "" &&
    customSpecs?.customParking !== null &&
    customSpecs?.customParking !== undefined
      ? Number(customSpecs.customParking)
      : (property?.parking_slots ?? property?.parking ?? null);
  if (rawParking && Number(rawParking) > 0) {
    badges.push({
      id: "prop_parking",
      label: `🚗 ที่จอดรถ ${rawParking} คัน`,
      labelEn: `🚗 ${rawParking} Parking`,
      labelZh: `🚗 ${rawParking} 车位`,
      labelRu: `🚗 ${rawParking} паркинг`,
      icon: "parking",
      isProp: true,
    });
  }

  // 4. Bedrooms - Real Property Data
  const rawBeds =
    customSpecs?.customBedrooms !== "" &&
    customSpecs?.customBedrooms !== null &&
    customSpecs?.customBedrooms !== undefined
      ? Number(customSpecs.customBedrooms)
      : (property?.bedrooms ?? null);
  if (rawBeds !== null && rawBeds !== undefined) {
    badges.push({
      id: "prop_bedrooms",
      label: rawBeds === 0 ? "🛏️ สตูดิโอ" : `🛏️ ${rawBeds} ห้องนอน`,
      labelEn: rawBeds === 0 ? "🛏️ Studio" : `🛏️ ${rawBeds} ${rawBeds > 1 ? "Beds" : "Bed"}`,
      labelZh: rawBeds === 0 ? "🛏️ 开间" : `🛏️ ${rawBeds} 房`,
      labelRu: rawBeds === 0 ? "🛏️ Студия" : `🛏️ ${rawBeds} спальни`,
      icon: "bed",
      isProp: true,
    });
  }

  // 5. Bathrooms - Real Property Data
  const rawBaths =
    customSpecs?.customBathrooms !== "" &&
    customSpecs?.customBathrooms !== null &&
    customSpecs?.customBathrooms !== undefined
      ? Number(customSpecs.customBathrooms)
      : (property?.bathrooms ?? null);
  if (rawBaths && Number(rawBaths) > 0) {
    badges.push({
      id: "prop_bathrooms",
      label: `🚿 ${rawBaths} ห้องน้ำ`,
      labelEn: `🚿 ${rawBaths} ${rawBaths > 1 ? "Baths" : "Bath"}`,
      labelZh: `🚿 ${rawBaths} 卫`,
      labelRu: `🚿 ${rawBaths} санузла`,
      icon: "bath",
      isProp: true,
    });
  }

  // 6. Floor - Real Property Data
  const rawFloor =
    customSpecs?.customFloor !== "" &&
    customSpecs?.customFloor !== null &&
    customSpecs?.customFloor !== undefined
      ? Number(customSpecs.customFloor)
      : (property?.floor ?? null);
  if (rawFloor && Number(rawFloor) > 0) {
    badges.push({
      id: "prop_floor",
      label: `🏢 ชั้น ${rawFloor}`,
      labelEn: `🏢 Fl. ${rawFloor}`,
      labelZh: `🏢 ${rawFloor} 层`,
      labelRu: `🏢 ${rawFloor} этаж`,
      icon: "floor",
      isProp: true,
    });
  }

  // 7. Property-specific feature flags
  if ((property as any)?.is_pet_friendly) {
    badges.push({
      id: "prop_pet",
      label: "🐾 เลี้ยงสัตว์ได้",
      labelEn: "🐾 Pet Friendly",
      labelZh: "🐾 可养宠物",
      labelRu: "🐾 Можно с животными",
      isProp: true,
    });
  }
  if ((property as any)?.is_foreigner_quota) {
    badges.push({
      id: "prop_quota",
      label: "🌍 Foreigner Quota",
      labelEn: "🌍 Foreigner Quota",
      labelZh: "🌍 外国人配额",
      labelRu: "🌍 Иностранная квота",
      isProp: true,
    });
  }
  if ((property as any)?.is_fully_furnished) {
    badges.push({
      id: "prop_furnished",
      label: "🛋️ แต่งครบพร้อมอยู่",
      labelEn: "🛋️ Fully Furnished",
      labelZh: "🛋️ 精装全配",
      labelRu: "🛋️ С мебелью",
      isProp: true,
    });
  }
  if ((property as any)?.has_private_pool) {
    badges.push({
      id: "prop_pool",
      label: "🏊 สระว่ายน้ำส่วนตัว",
      labelEn: "🏊 Private Pool",
      labelZh: "🏊 私人泳池",
      labelRu: "🏊 Личный бассейн",
      isProp: true,
    });
  }
  if ((property as any)?.is_corner_unit) {
    badges.push({
      id: "prop_corner",
      label: "🏙️ ห้องมุม วิวโล่ง",
      labelEn: "🏙️ Corner Unit",
      labelZh: "🏙️ 边套采光佳",
      labelRu: "🏙️ Угловая квартира",
      isProp: true,
    });
  }
  if ((property as any)?.is_hot_deal) {
    badges.push({
      id: "prop_hot",
      label: "🔥 Hot Deal",
      labelEn: "🔥 Hot Deal",
      labelZh: "🔥 特惠好房",
      labelRu: "🔥 Горячее предложение",
      isProp: true,
    });
  }

  return badges;
}

/**
 * Resolve any badge identifier or label into the active Studio Language and map to vector icon
 */
export function resolveBadgeForLanguage(
  badgeIdOrText: string,
  lang: StudioLanguage,
  propertyBadges: AvailableBadgeItem[] = []
): { text: string; icon?: "sqm" | "land" | "parking" | "bed" | "bath" | "floor" } {
  if (!badgeIdOrText) return { text: "" };

  const trimmed = badgeIdOrText.trim();

  // 1. Search in dynamic property badges
  const propMatch = propertyBadges.find(
    (b) =>
      b.id === trimmed ||
      b.label.trim() === trimmed ||
      (b.labelEn && b.labelEn.trim() === trimmed) ||
      (b.id === "prop_sqm" && (trimmed.includes("ตร.ม.") || trimmed.toLowerCase().includes("sq.m") || trimmed.toLowerCase().includes("sqm"))) ||
      (b.id === "prop_land_sqwah" && (trimmed.includes("ตร.วา") || trimmed.toLowerCase().includes("sq.wah"))) ||
      (b.id === "prop_parking" && (trimmed.includes("ที่จอด") || trimmed.toLowerCase().includes("parking"))) ||
      (b.id === "prop_bedrooms" && (trimmed.includes("ห้องนอน") || trimmed.toLowerCase().includes("bed"))) ||
      (b.id === "prop_bathrooms" && (trimmed.includes("ห้องน้ำ") || trimmed.toLowerCase().includes("bath"))) ||
      (b.id === "prop_floor" && (trimmed.includes("ชั้น") || trimmed.toLowerCase().includes("floor") || trimmed.toLowerCase().includes("fl.")))
  );
  if (propMatch) {
    const text =
      lang === "en"
        ? propMatch.labelEn || propMatch.label
        : lang === "zh" && propMatch.labelZh
        ? propMatch.labelZh
        : lang === "ru" && propMatch.labelRu
        ? propMatch.labelRu
        : propMatch.label;
    return { text, icon: propMatch.icon };
  }

  // 2. Search in AVAILABLE_BADGES
  const staticMatch = AVAILABLE_BADGES.find(
    (b) =>
      b.id === trimmed ||
      b.label.trim() === trimmed ||
      (b.labelEn && b.labelEn.trim() === trimmed)
  );
  if (staticMatch) {
    const text =
      lang === "en"
        ? staticMatch.labelEn || staticMatch.label
        : lang === "zh" && staticMatch.labelZh
        ? staticMatch.labelZh
        : lang === "ru" && staticMatch.labelRu
        ? staticMatch.labelRu
        : staticMatch.label;
    return { text, icon: staticMatch.icon };
  }

  // 3. Fallback smart regex resolver
  let cleanText = trimmed;
  let icon: "sqm" | "land" | "parking" | "bed" | "bath" | "floor" | undefined = undefined;

  if (trimmed.includes("🚗") || trimmed.toLowerCase().includes("parking") || trimmed.includes("ที่จอด")) {
    icon = "parking";
    const num = trimmed.match(/\d+/)?.[0];
    cleanText =
      lang === "en"
        ? (num ? `${num} Parking` : "Parking Space")
        : (num ? `ที่จอดรถ ${num} คัน` : "มีที่จอดรถส่วนตัว");
  } else if (trimmed.includes("📐") || trimmed.toLowerCase().includes("sq.wah") || trimmed.includes("ตร.วา") || trimmed.includes("เนื้อที่ดิน")) {
    icon = "land";
    const num = trimmed.match(/\d+(\.\d+)?/)?.[0];
    cleanText =
      lang === "en"
        ? (num ? `${num} Sq.wah` : "Land Area")
        : (num ? `${num} ตร.วา` : "มีเนื้อที่ดิน");
  } else if (trimmed.includes("⤢") || trimmed.toLowerCase().includes("sq.m") || trimmed.includes("ตร.ม.") || trimmed.toLowerCase().includes("sqm")) {
    icon = "sqm";
    const num = trimmed.match(/\d+(\.\d+)?/)?.[0];
    cleanText =
      lang === "en"
        ? (num ? `${num} SQ.M.` : "Area")
        : (num ? `${num} ตร.ม.` : "พื้นที่ใช้สอย");
  } else if (trimmed.includes("🐾") || trimmed.includes("สัตว์")) {
    cleanText = lang === "en" ? "🐾 Pet Friendly" : "🐾 เลี้ยงสัตว์ได้";
  } else if (trimmed.includes("🛋️") || trimmed.includes("แต่งครบ")) {
    cleanText = lang === "en" ? "🛋️ Fully Furnished" : "🛋️ แต่งครบพร้อมอยู่";
  } else if (trimmed.includes("🔑") || trimmed.includes("พร้อมโอน")) {
    cleanText = lang === "en" ? "🔑 Ready to Transfer" : "🔑 พร้อมโอนกรรมสิทธิ์";
  } else if (trimmed.includes("⚡") || trimmed.includes("ลดด่วน") || trimmed.includes("ต่ำกว่า")) {
    cleanText = lang === "en" ? "⚡ Urgent Below Market" : "⚡ ลดด่วนต่ำกว่าทุน";
  } else if (trimmed.includes("🌊") || trimmed.includes("วิวทะเล")) {
    cleanText = lang === "en" ? "🌊 Sea View" : "🌊 วิวทะเล";
  } else if (trimmed.includes("🏊") || trimmed.includes("สระว่ายน้ำ")) {
    cleanText = lang === "en" ? "🏊 Private Pool" : "🏊 สระว่ายน้ำส่วนตัว";
  } else if (trimmed.includes("🏙️") || trimmed.includes("ห้องมุม")) {
    cleanText = lang === "en" ? "🏙️ Corner Unit" : "🏙️ ห้องมุม วิวโล่ง";
  } else if (trimmed.includes("🏡") || trimmed.includes("หลังมุม")) {
    cleanText = lang === "en" ? "🏡 Corner House" : "🏡 บ้านเดี่ยวหลังมุม";
  } else if (trimmed.includes("✨") || trimmed.includes("ติดถนน")) {
    cleanText = lang === "en" ? "✨ Main Road Access" : "✨ ติดถนนใหญ่";
  } else if (trimmed.includes("🚆") || trimmed.includes("รถไฟฟ้า")) {
    cleanText = lang === "en" ? "🚆 Near Transit" : "🚆 ใกล้รถไฟฟ้า";
  }

  return { text: cleanText, icon };
}


// Multilingual Dictionary for Transit Stations
const STATION_DICTIONARY: Record<string, { en: string; zh: string; ru: string }> = {
  "บ้านทับช้าง": { en: "Ban Thap Chang", zh: "塔邦常", ru: "Бан Тхап Чанг" },
  "อโศก": { en: "Asoke", zh: "阿索克", ru: "Асок" },
  "พญาไท": { en: "Phaya Thai", zh: "帕亚泰", ru: "Пхая Тхай" },
  "หมอชิต": { en: "Mo Chit", zh: "蒙奇", ru: "Мо Чит" },
  "สยาม": { en: "Siam", zh: "暹罗", ru: "Сиам" },
  "ทองหล่อ": { en: "Thonglor", zh: "通罗", ru: "Тอนглор" },
  "เอกมัย": { en: "Ekkamai", zh: "亿甲迈", ru: "Эккамай" },
  "พร้อมพงษ์": { en: "Phrom Phong", zh: "澎蓬", ru: "Пром Понг" },
  "ช่องนนทรี": { en: "Chong Nonsi", zh: "钟那席", ru: "Чонг Нонси" },
  "ศาลาแดง": { en: "Sala Daeng", zh: "莎拉当", ru: "Сала Дэнг" },
  "กรุงธนบุรี": { en: "Krung Thon Buri", zh: "吞武里", ru: "Крунг Тхоน Бури" },
  "สะพานตากสิน": { en: "Saphan Taksin", zh: "郑王桥", ru: "Сапхан Таксин" },
  "ห้วยขวาง": { en: "Huai Khwang", zh: "辉煌", ru: "Хуай Кванг" },
  "พระราม 9": { en: "Rama 9", zh: "拉玛九", ru: "Рама 9" },
  "พระราม9": { en: "Rama 9", zh: "拉玛九", ru: "Рама 9" },
  "เตาปูน": { en: "Tao Poon", zh: "陶公", ru: "Тао Пуน" },
  "บางซื่อ": { en: "Bang Sue", zh: "邦苏", ru: "Банг Sue" },
  "จตุจักร": { en: "Chatuchak", zh: "乍都乍", ru: "Чатучак" },
  "ลาดพร้าว": { en: "Lat Phrao", zh: "拉普劳", ru: "Лат Пхрао" },
  "สำโรง": { en: "Samrong", zh: "三荣", ru: "Самронг" },
  "ปากน้ำ": { en: "Pak Nam", zh: "北榄", ru: "Пак Нам" },
  "ศรีนครินทร์": { en: "Srinagarindra", zh: "诗娜卡琳", ru: "Шринакариндра" },
  "หัวหมาก": { en: "Hua Mak", zh: "华马克", ru: "Хуа Мак" },
  "สุวรรณภูมิ": { en: "Suvarnabhumi", zh: "素万那普", ru: "Суварнабхуми" },
  "ดอนเมือง": { en: "Don Mueang", zh: "廊曼", ru: "Дон Муанг" },
};

// Multilingual Dictionary for Popular Areas
const AREA_DICTIONARY: Record<string, { en: string; zh: string; ru: string }> = {
  "กรุงเทพกรีฑาตัดใหม่": { en: "New Krungthep Kreetha", zh: "新曼谷克里他", ru: "Новый Крунгтхеп Крипха" },
  "กรุงเทพกรีฑา": { en: "Krungthep Kreetha", zh: "曼谷克里他", ru: "Крунгтхеп Крипха" },
  "พระราม 9": { en: "Rama 9", zh: "拉玛九", ru: "Рама 9" },
  "พระราม9": { en: "Rama 9", zh: "拉玛九", ru: "Рама 9" },
  "พระราม 2": { en: "Rama 2", zh: "拉玛二", ru: "Рама 2" },
  "พระราม 3": { en: "Rama 3", zh: "拉玛三", ru: "Рама 3" },
  "สุขุมวิท": { en: "Sukhumvit", zh: "素坤逸", ru: "Сукхумвит" },
  "ทองหล่อ": { en: "Thonglor", zh: "通罗", ru: "Тอนглор" },
  "เอกมัย": { en: "Ekkamai", zh: "亿甲迈", ru: "Эккамай" },
  "พร้อมพงษ์": { en: "Phrom Phong", zh: "澎蓬", ru: "Пром Понг" },
  "อโศก": { en: "Asoke", zh: "阿索克", ru: "Асок" },
  "นานา": { en: "Nana", zh: "娜娜", ru: "Нана" },
  "เพลินจิต": { en: "Ploenchit", zh: "奔集", ru: "Пленчит" },
  "ชิดลม": { en: "Chit Lom", zh: "奇隆", ru: "Читлом" },
  "สยาม": { en: "Siam", zh: "暹罗", ru: "Сиам" },
  "ราชดำริ": { en: "Ratchadamri", zh: "拉差当梅", ru: "Ратчадамри" },
  "สาทร": { en: "Sathorn", zh: "沙吞", ru: "Саторน" },
  "สีลม": { en: "Silom", zh: "席隆", ru: "Силом" },
  "ห้วยขวาง": { en: "Huai Khwang", zh: "辉煌", ru: "Хуай Кванг" },
  "รัชดา": { en: "Ratchada", zh: "拉差达", ru: "Ратчада" },
  "รัชดาภิเษก": { en: "Ratchadaphisek", zh: "拉差达", ru: "Ратчада" },
  "พญาไท": { en: "Phaya Thai", zh: "帕亚泰", ru: "Пхая Тхай" },
  "อารีย์": { en: "Ari", zh: "阿里", ru: "Ари" },
  "สะพานควาย": { en: "Saphan Khwai", zh: "沙潘怀", ru: "Сапхан Квай" },
  "หมอชิต": { en: "Mo Chit", zh: "蒙奇", ru: "Мо Чит" },
  "บางนา": { en: "Bangna", zh: "邦纳", ru: "Бангна" },
  "อุดมสุข": { en: "Udom Suk", zh: "乌东苏", ru: "Удом Сук" },
  "ปุณณวิถี": { en: "Punnawithi", zh: "普那威提", ru: "Пунนาвитхи" },
  "อ่อนนุช": { en: "On Nut", zh: "安努", ru: "Он Нут" },
  "พระโขนง": { en: "Phra Khanong", zh: "帕卡农", ru: "Пхра Кханонг" },
  "ลาดพร้าว": { en: "Ladprao", zh: "拉普劳", ru: "Ладпрао" },
  "รามคำแหง": { en: "Ramkhamhaeng", zh: "兰甘亨", ru: "Рамкхамхенг" },
  "ศรีนครินทร์": { en: "Srinakarin", zh: "诗娜卡琳", ru: "Шринакарин" },
  "พัฒนาการ": { en: "Pattanakarn", zh: "帕塔那干", ru: "Паттанакарн" },
  "พัทยา": { en: "Pattaya", zh: "芭提雅", ru: "Паттайя" },
  "ป่าตอง": { en: "Patong", zh: "芭东", ru: "Патонг" },
  "เชิงทะเล": { en: "Cherngtalay", zh: "邦涛", ru: "Чернгталай" },
  "ราไวย์": { en: "Rawai", zh: "拉威", ru: "Раваи" },
  "กะทู้": { en: "Kathu", zh: "卡图", ru: "Кату" },
  "ฉลอง": { en: "Chalong", zh: "查龙", ru: "Чалонг" },
  "กมลา": { en: "Kamala", zh: "卡мара", ru: "Камала" },
  "ไนหาร์น": { en: "Nai Harn", zh: "奈汉", ru: "Най Харн" },
};

/**
 * Format transit station with line prefix (BTS, MRT, ARL, SRT, etc.) and distance
 */
export function formatTransitDisplay(
  station?: string | null,
  type?: string | null,
  distanceMeters?: number | null,
  lang: StudioLanguage = "th",
  stationLangOverride?: { en?: string | null; cn?: string | null; ru?: string | null }
): string | undefined {
  if (!station) return undefined;
  let sName = station.trim();

  // Multilingual station resolution
  if (lang === "en") {
    if (stationLangOverride?.en) sName = stationLangOverride.en;
    else if (STATION_DICTIONARY[sName]?.en) sName = STATION_DICTIONARY[sName].en;
  } else if (lang === "zh") {
    if (stationLangOverride?.cn) sName = stationLangOverride.cn;
    else if (STATION_DICTIONARY[sName]?.zh) sName = STATION_DICTIONARY[sName].zh;
  } else if (lang === "ru") {
    if (stationLangOverride?.ru) sName = stationLangOverride.ru;
    else if (STATION_DICTIONARY[sName]?.ru) sName = STATION_DICTIONARY[sName].ru;
  }

  let typePrefix = "";
  const tUpper = (type || "").toUpperCase();

  if (lang === "en") {
    if (tUpper.includes("YELLOW") || tUpper === "MRT_YELLOW") typePrefix = "MRT Yellow Line";
    else if (tUpper.includes("PINK") || tUpper === "MRT_PINK") typePrefix = "MRT Pink Line";
    else if (tUpper.includes("PURPLE") || tUpper === "MRT_PURPLE") typePrefix = "MRT Purple Line";
    else if (tUpper.includes("RED") || tUpper === "SRT_RED") typePrefix = "SRT Red Line";
    else if (tUpper.includes("ARL") || tUpper.includes("AIRPORT")) typePrefix = "ARL";
    else if (tUpper.includes("BRT")) typePrefix = "BRT";
    else if (tUpper.includes("GOLD")) typePrefix = "Gold Line";
    else if (tUpper.includes("MRT")) typePrefix = "MRT";
    else if (tUpper.includes("BTS")) typePrefix = "BTS";
    else if (type) typePrefix = type;
  } else if (lang === "zh") {
    if (tUpper.includes("YELLOW") || tUpper === "MRT_YELLOW") typePrefix = "MRT 黄线";
    else if (tUpper.includes("PINK") || tUpper === "MRT_PINK") typePrefix = "MRT 粉红线";
    else if (tUpper.includes("PURPLE") || tUpper === "MRT_PURPLE") typePrefix = "MRT 紫线";
    else if (tUpper.includes("RED") || tUpper === "SRT_RED") typePrefix = "SRT 红线";
    else if (tUpper.includes("ARL") || tUpper.includes("AIRPORT")) typePrefix = "ARL 机场快线";
    else if (tUpper.includes("BRT")) typePrefix = "BRT";
    else if (tUpper.includes("GOLD")) typePrefix = "金色线";
    else if (tUpper.includes("MRT")) typePrefix = "MRT";
    else if (tUpper.includes("BTS")) typePrefix = "BTS";
    else if (type) typePrefix = type;
  } else if (lang === "ru") {
    if (tUpper.includes("YELLOW") || tUpper === "MRT_YELLOW") typePrefix = "MRT Жёлтая";
    else if (tUpper.includes("PINK") || tUpper === "MRT_PINK") typePrefix = "MRT Розовая";
    else if (tUpper.includes("PURPLE") || tUpper === "MRT_PURPLE") typePrefix = "MRT Фиолетовая";
    else if (tUpper.includes("RED") || tUpper === "SRT_RED") typePrefix = "SRT Красная";
    else if (tUpper.includes("ARL") || tUpper.includes("AIRPORT")) typePrefix = "ARL";
    else if (tUpper.includes("BRT")) typePrefix = "BRT";
    else if (tUpper.includes("GOLD")) typePrefix = "Золотая линия";
    else if (tUpper.includes("MRT")) typePrefix = "MRT";
    else if (tUpper.includes("BTS")) typePrefix = "BTS";
    else if (type) typePrefix = type;
  } else {
    if (tUpper.includes("YELLOW") || tUpper === "MRT_YELLOW") typePrefix = "MRT สายสีเหลือง";
    else if (tUpper.includes("PINK") || tUpper === "MRT_PINK") typePrefix = "MRT สายสีชมพู";
    else if (tUpper.includes("PURPLE") || tUpper === "MRT_PURPLE") typePrefix = "MRT สายสีม่วง";
    else if (tUpper.includes("RED") || tUpper === "SRT_RED") typePrefix = "SRT สายสีแดง";
    else if (tUpper.includes("ARL") || tUpper.includes("AIRPORT")) typePrefix = "ARL";
    else if (tUpper.includes("BRT")) typePrefix = "BRT";
    else if (tUpper.includes("GOLD")) typePrefix = "สายสีทอง";
    else if (tUpper.includes("MRT")) typePrefix = "MRT";
    else if (tUpper.includes("BTS")) typePrefix = "BTS";
    else if (type) typePrefix = type;
  }

  let cleanStation = sName;
  if (typePrefix && cleanStation.toLowerCase().startsWith(typePrefix.toLowerCase())) {
    cleanStation = cleanStation.slice(typePrefix.length).trim();
  }

  const fullStation = typePrefix ? `${typePrefix} ${cleanStation}` : cleanStation;
  const distStr =
    distanceMeters && distanceMeters > 0
      ? lang === "en"
        ? ` (${distanceMeters}m)`
        : lang === "zh"
          ? ` (${distanceMeters}米)`
          : lang === "ru"
            ? ` (${distanceMeters}м)`
            : ` (${distanceMeters} ม.)`
      : "";

  if (lang === "en") return `Near ${fullStation}${distStr}`;
  if (lang === "zh") return `靠近 ${fullStation}${distStr}`;
  if (lang === "ru") return `Рядом с ${fullStation}${distStr}`;
  return `ใกล้ ${fullStation}${distStr}`;
}

function formatSinglePriceValue(
  amount: number,
  isRent: boolean,
  style: StudioPriceFormatStyle = "default",
  lang: StudioLanguage = "th"
): string {
  const rentSuffix = lang === "en" ? "/mo" : lang === "zh" ? "/月" : lang === "ru" ? "/мес" : "/ด.";

  if (style === "symbol_short") {
    if (amount >= 1_000_000) {
      const val = (amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return isRent ? `฿ ${val}M ${rentSuffix}` : `฿ ${val}M`;
    }
    if (amount >= 1_000) {
      const val = (amount / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return isRent ? `฿ ${val}k ${rentSuffix}` : `฿ ${val}k`;
    }
  }

  if (style === "code_short_prefix") {
    if (amount >= 1_000_000) {
      const val = (amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return isRent ? `THB ${val}M ${rentSuffix}` : `THB ${val}M`;
    }
    if (amount >= 1_000) {
      const val = (amount / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return isRent ? `THB ${val}k ${rentSuffix}` : `THB ${val}k`;
    }
    return isRent ? `THB ${amount.toLocaleString()} ${rentSuffix}` : `THB ${amount.toLocaleString()}`;
  }

  if (style === "code_short_suffix") {
    if (amount >= 1_000_000) {
      const val = (amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return isRent ? `${val}M THB ${rentSuffix}` : `${val}M THB`;
    }
    if (amount >= 1_000) {
      const val = (amount / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return isRent ? `${val}k THB ${rentSuffix}` : `${val}k THB`;
    }
    return isRent ? `${amount.toLocaleString()} THB ${rentSuffix}` : `${amount.toLocaleString()} THB`;
  }

  if (style === "code_full_suffix") {
    const num = amount.toLocaleString();
    return isRent ? `${num} THB ${rentSuffix}` : `${num} THB`;
  }

  if (style === "thai_lakh") {
    if (amount >= 1_000_000) {
      const val = (amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return isRent ? `${val} ล้าน ${rentSuffix}` : `${val} ล้านบาท`;
    }
    if (amount >= 10_000) {
      const val = (amount / 10_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return isRent ? `${val} หมื่น ${rentSuffix}` : `${val} หมื่นบาท`;
    }
  }

  if (style === "usd_approx") {
    const usdVal = amount / 35;
    if (usdVal >= 1_000_000) {
      const val = (usdVal / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
      return isRent ? `$ ${val}M / mo` : `$ ${val}M USD`;
    }
    if (usdVal >= 1_000) {
      const val = (usdVal / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return isRent ? `$ ${val}k / mo` : `$ ${val}k USD`;
    }
    return isRent ? `$ ${Math.round(usdVal).toLocaleString()} / mo` : `$ ${Math.round(usdVal).toLocaleString()} USD`;
  }

  if (style === "thb_with_usd") {
    const usdVal = Math.round(amount / 35.5);
    const usdStr = isRent
      ? `(~$${usdVal.toLocaleString()} USD/mo)`
      : `(~$${usdVal.toLocaleString()} USD)`;
    const thbStr = isRent ? `฿${amount.toLocaleString()} ${rentSuffix}` : `฿${amount.toLocaleString()}`;
    return `${thbStr} ${usdStr}`;
  }

  const numStr = amount.toLocaleString();
  return isRent ? `฿ ${numStr} ${rentSuffix}` : `฿ ${numStr}`;
}

/**
 * Format price according to language and format style
 */
export function formatStudioPrice(
  listingType?: string | null,
  price?: number | null,
  rentalPrice?: number | null,
  lang: StudioLanguage = "th",
  style: StudioPriceFormatStyle = "default"
): string {
  const hasSale = Boolean(price && price > 0);
  const hasRent = Boolean(rentalPrice && rentalPrice > 0);

  // Dual Pricing (Both Sale and Rent exist on the property)
  if (hasSale && hasRent && (listingType === "SALE_AND_RENT" || (price && rentalPrice))) {
    const saleStr = formatSinglePriceValue(price!, false, style, lang);
    const rentStr = formatSinglePriceValue(rentalPrice!, true, style, lang);
    return `${saleStr} • ${rentStr}`;
  }

  const isRent = listingType === "RENT";
  const amount = isRent ? (rentalPrice || price) : (price || rentalPrice);

  if (!amount) {
    return lang === "en"
      ? "Contact for Price"
      : lang === "zh"
        ? "咨询价格"
        : lang === "ru"
          ? "Цена по запросу"
          : "ติดต่อสอบถาม";
  }

  return formatSinglePriceValue(amount, isRent, style, lang);
}

/**
 * Format province / popular area in target language
 */
export function formatStudioLocation(
  popularArea?: string | null,
  province?: string | null,
  lang: StudioLanguage = "th",
  areaLangOverride?: { en?: string | null; cn?: string | null; ru?: string | null }
): string {
  const p = province || "";
  let a = (popularArea || "").trim();

  // Multilingual popular area resolution
  if (lang === "en") {
    if (areaLangOverride?.en) a = areaLangOverride.en;
    else if (AREA_DICTIONARY[a]?.en) a = AREA_DICTIONARY[a].en;
  } else if (lang === "zh") {
    if (areaLangOverride?.cn) a = areaLangOverride.cn;
    else if (AREA_DICTIONARY[a]?.zh) a = AREA_DICTIONARY[a].zh;
  } else if (lang === "ru") {
    if (areaLangOverride?.ru) a = areaLangOverride.ru;
    else if (AREA_DICTIONARY[a]?.ru) a = AREA_DICTIONARY[a].ru;
  }

  let provText = p;
  if (lang === "en") {
    if (p === "กรุงเทพมหานคร" || p.toLowerCase().includes("bangkok")) provText = "Bangkok";
    else if (p === "ภูเก็ต" || p.toLowerCase().includes("phuket")) provText = "Phuket";
    else if (p === "ชลบุรี" || p.toLowerCase().includes("chonburi")) provText = "Chonburi";
    else if (p === "เชียงใหม่" || p.toLowerCase().includes("chiang mai")) provText = "Chiang Mai";
  } else if (lang === "zh") {
    if (p === "กรุงเทพมหานคร" || p.toLowerCase().includes("bangkok")) provText = "曼谷";
    else if (p === "ภูเก็ต" || p.toLowerCase().includes("phuket")) provText = "普吉岛";
    else if (p === "ชลบุรี" || p.toLowerCase().includes("chonburi")) provText = "春武里 / 芭提雅";
    else if (p === "เชียงใหม่" || p.toLowerCase().includes("chiang mai")) provText = "清迈";
  } else if (lang === "ru") {
    if (p === "กรุงเทพมหานคร" || p.toLowerCase().includes("bangkok")) provText = "Бангкок";
    else if (p === "ภูเก็ต" || p.toLowerCase().includes("phuket")) provText = "Пхукет";
    else if (p === "ชลบุรี" || p.toLowerCase().includes("chonburi")) provText = "Чонбури / Паттайя";
    else if (p === "เชียงใหม่" || p.toLowerCase().includes("chiang mai")) provText = "Чиангмай";
  }
  return [a, provText].filter(Boolean).join(" • ");
}

/**
 * Helper to load an image URL safely into a Blob for ZIP packaging and sharing
 */
export async function fetchImageBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      return await res.blob();
    }
  } catch {}

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          c.toBlob((b) => resolve(b), "image/jpeg", 0.92);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
