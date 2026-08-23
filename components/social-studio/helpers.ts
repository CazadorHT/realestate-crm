import type { StudioLanguage, StudioPriceFormatStyle, AvailableBadgeItem } from "./types";
import { formatPrice } from "@/lib/property-utils";

export const AVAILABLE_BADGES: AvailableBadgeItem[] = [
  { id: "pet_friendly", label: "🐾 เลี้ยงสัตว์ได้", labelEn: "🐾 Pet Friendly" },
  { id: "foreigner_quota", label: "🌍 Foreigner Quota", labelEn: "🌍 Foreigner Quota" },
  { id: "hot_deal", label: "🔥 Hot Deal", labelEn: "🔥 Hot Deal" },
  { id: "near_transit", label: "🚆 ใกล้รถไฟฟ้า", labelEn: "🚆 Near Transit" },
  { id: "furnished", label: "🛋️ แต่งครบพร้อมอยู่", labelEn: "🛋️ Fully Furnished" },
  { id: "high_yield", label: "💰 High Yield 6%+", labelEn: "💰 High Yield 6%+" },
];

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

  const numStr = amount.toLocaleString();
  return isRent ? `฿${numStr} ${rentSuffix}` : `฿${numStr}`;
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
