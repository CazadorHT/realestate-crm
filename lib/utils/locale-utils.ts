/**
 * Locale Utility Functions
 * Helpers for retrieving localized values from database objects (Properties, Areas, etc.)
 */

/**
 * V3 Unified Localization Interface
 */
export interface LocalizedValueV3 {
  th?: string | null;
  en?: string | null;
  cn?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Get localized value from an object with fallback to default (Thai)
 * Optimized for V3 JSONB structure while maintaining legacy support.
 *
 * @param data The object containing fields (either JSONB or flat fields)
 * @param field The base field name (e.g., 'title')
 * @param locale The current user locale ('th', 'en', 'cn')
 * @returns The localized string or fallback to default
 */
const LOCALE_DICTIONARY_FALLBACKS: Record<string, Record<string, string>> = {
  "อ่างอาบน้ำ": { en: "Bathtub", cn: "浴缸", ru: "Ванна" },
  "คลับเฮ้าส์": { en: "Clubhouse", cn: "会所", ru: "Клубный дом" },
  "คลับเฮ้าส์ / เลานจ์": { en: "Clubhouse / Lounge", cn: "会所 / 休息室", ru: "Клубный дом / Лаундж" },
  "โซล่าเซลล์": { en: "Solar Cells", cn: "太阳能电池板", ru: "Солнечные батареи" },
  "โซลาร์เซลล์": { en: "Solar Cells", cn: "太阳能电池板", ru: "Солнечные батареи" },
  "วิวทะเล": { en: "Sea View", cn: "海景", ru: "Вид на море" },
  "วิวภูเขา": { en: "Mountain View", cn: "山景", ru: "Вид на горы" },
  "วิวเมือง": { en: "City View", cn: "城市景观", ru: "Вид на город" },
  "วิวแม่น้ำ": { en: "River View", cn: "江景", ru: "Вид на реку" },
  "สวน": { en: "Garden", cn: "花园", ru: "Сад" },
  "สวนหย่อม": { en: "Garden", cn: "园林绿化", ru: "Сад" },
  "สวนขั้นดาดฟ้า": { en: "Rooftop Garden", cn: "屋顶花园", ru: "Сад на крыше" },
  "สวนดาดฟ้า": { en: "Rooftop Garden", cn: "屋顶花园", ru: "Сад на крыше" },
  "สวนสาธารณะ": { en: "Public Park", cn: "公园", ru: "Общественный парк" },
  "เครื่องชาร์จรถยนต์ไฟฟ้า": { en: "EV Charger", cn: "电动车充电站", ru: "Зарядка для электромобилей" },
  "จุดชาร์จรถยนต์ไฟฟ้า": { en: "EV Charging Station", cn: "电动车充电站", ru: "Зарядка для электромобилей" },
  "โซนสัตว์เลี้ยง": { en: "Pet Friendly Zone", cn: "宠物活动区", ru: "Зона для питомцев" },
  "ที่จอดรถ": { en: "Parking", cn: "停车场", ru: "Парковка" },
  "โรงยิม / ฟิตเนส": { en: "Fitness / Gym", cn: "健身房", ru: "Фитнес-зал" },
  "ฟิตเนส": { en: "Fitness Gym", cn: "健身房", ru: "Фитнес-зал" },
  "ลิฟต์": { en: "Elevator", cn: "电梯", ru: "Лифт" },
  "ลิฟต์โดยสาร": { en: "Passenger Lift", cn: "电梯", ru: "Лифт" },
  "สระว่ายน้ำ": { en: "Swimming Pool", cn: "游泳池", ru: "Бассейн" },
  "ห้องซาวน่า / ห้องอบไอน้ำ": { en: "Sauna / Steam Room", cn: "桑拿/蒸汽房", ru: "Sauna / Парная" },
  "ห้องซาวน่า": { en: "Sauna", cn: "桑拿房", ru: "Сауна" },
  "ห้องอบไอน้ำ": { en: "Steam Room", cn: "蒸汽房", ru: "Парная" },
  "สตรีม": { en: "Steam Room", cn: "蒸汽房", ru: "Парная" },
  "สนามเด็กเล่น": { en: "Playground", cn: "儿童游乐场", ru: "Детская площадка" },
  "ระบบรักษาความปลอดภัย": { en: "24/7 Security", cn: "24小时安保", ru: "Круглосуточная охрана" },
  "ระบบรักษาความปลอดภัย 24 ชม.": { en: "24-Hour Security", cn: "24小时安保", ru: "Круглосуточная охрана" },
  "กล้องวงจรปิด": { en: "CCTV", cn: "闭路电视监控", ru: "Видеонаблюдение (CCTV)" },
  "กล้องวงจรปิด (CCTV)": { en: "CCTV Security", cn: "闭路电视监控", ru: "Видеонаблюдение (CCTV)" },
  "คีย์การ์ด": { en: "Keycard Access", cn: "智能卡门禁", ru: "Доступ по картам" },
  "เข้า-ออกด้วยคีย์การ์ด": { en: "Key Card Access", cn: "智能卡门禁", ru: "Доступ по картам" },
  "ล็อบบี้": { en: "Lobby", cn: "大堂前台", ru: "Лобби" },
  "ล็อบบี้ / แผนกต้อนรับ": { en: "Lobby / Reception", cn: "大堂前台", ru: "Лобби / Ресепшн" },
  "ห้องสมุด": { en: "Library", cn: "图书馆", ru: "Библиотека" },
  "ห้องสมุด / Co-working Space": { en: "Library / Co-working Space", cn: "图书馆/联合办公区", ru: "Библиотека / Коворкинг" },
  "co-working space": { en: "Co-Working Space", cn: "联合办公区", ru: "Коворкинг" },
  "เพดานสูง": { en: "High Ceiling", cn: "挑高天花板", ru: "Высокие потолки" },
  "เพดานสูงโปร่ง": { en: "High Ceiling", cn: "挑高天花板", ru: "Высокие потолки" },
  "ระบบสมาร์ทโฮม": { en: "Smart Home System", cn: "智能家居系统", ru: "Система Умный дом" },
  "ห้องแม่บ้าน": { en: "Maid Quarter", cn: "保姆房", ru: "Комната для прислуги" },
  "บริการรถรับส่ง": { en: "Shuttle Service", cn: "接驳车服务", ru: "Трансфер" },
  "พนักงานต้อนรับ": { en: "Concierge", cn: "礼宾服务", ru: "Консьерж-сервис" },
  "อินเทอร์เน็ต / wifi": { en: "High-Speed Wi-Fi", cn: "高速无线网络", ru: "Высокоскоростной Wi-Fi" },
  "wifi": { en: "Wi-Fi", cn: "无线网络", ru: "Wi-Fi" },
  "เครื่องปรับอากาศ": { en: "Air Conditioning", cn: "空调", ru: "Кондиционер" },
  "แอร์": { en: "Air Conditioning", cn: "空调", ru: "Кондиционер" },
  "เครื่องทำน้ำอุ่น": { en: "Water Heater", cn: "热水器", ru: "Водонагреватель" },
  "เฟอร์นิเจอร์": { en: "Fully Furnished", cn: "全套家具", ru: "Меблирована" },
  "ตู้เย็น": { en: "Refrigerator", cn: "冰箱", ru: "Холодильник" },
  "ไมโครเวฟ": { en: "Microwave", cn: "微波炉", ru: "Микроволновка" },
  "เตาไฟฟ้า": { en: "Electric Stove", cn: "电炉", ru: "Электроплита" },
  "เครื่องดูดควัน": { en: "Cooker Hood", cn: "抽油烟机", ru: "Вытяжка" },
  "เครื่องซักผ้า": { en: "Washing Machine", cn: "洗衣机", ru: "Стиральная машина" },
  "ระเบียง": { en: "Balcony", cn: "阳台", ru: "Балкон" },
  "จากุซซี่": { en: "Jacuzzi", cn: "按摩浴缸", ru: "Джакузи" },
  "อ่างจากุซซี่": { en: "Jacuzzi Bathtub", cn: "按摩浴缸", ru: "Ванна с джакузи" },
};

export function getLocaleValue(
  data: object | null | undefined,
  field: string,
  locale: string,
): string {
  if (!data) return "";

  // Safe internal access for indexing
  const dataObj = data as Record<string, unknown>;
  const rawValue = dataObj[field];

  // --- V3: Hardened JSONB Structure Support ---
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const localizedObj = rawValue as LocalizedValueV3;
    
    // 1. Exact locale match (Elite Priority)
    const exactMatch = localizedObj[locale];
    if (typeof exactMatch === "string" && exactMatch.trim() !== "") {
      return exactMatch;
    }
    
    // 2. Fallback to English (Global Standard)
    if (locale !== "en") {
      const enMatch = localizedObj["en"];
      if (typeof enMatch === "string" && enMatch.trim() !== "") {
        return enMatch;
      }
    }
    
    // 3. Last resort: Thai (Core Default)
    const thMatch = localizedObj["th"];
    if (typeof thMatch === "string" && thMatch.trim() !== "") {
      if (locale !== "th" && LOCALE_DICTIONARY_FALLBACKS[thMatch.trim()]) {
        const dictionaryHit = LOCALE_DICTIONARY_FALLBACKS[thMatch.trim()][locale] || LOCALE_DICTIONARY_FALLBACKS[thMatch.trim()]["en"];
        if (dictionaryHit) return dictionaryHit;
      }
      return thMatch;
    }
    
    // If it's an object but no matching keys, find the first available non-empty string
    const firstString = Object.values(localizedObj).find(
      (v): v is string => typeof v === "string" && v.trim() !== ""
    );
    return firstString || "";
  }

  // --- Legacy: Flat Field Structure Support (title, title_en, title_cn) ---
  const baseValue = typeof rawValue === "string" ? rawValue : "";

  if (locale === "th") {
    return baseValue;
  }

  const localizedField = `${field}_${locale}`;
  const localizedValue = dataObj[localizedField];

  if (typeof localizedValue === "string" && localizedValue.trim() !== "") {
    return localizedValue;
  }

  // Fallback to English for flat fields
  if (locale !== "en") {
    const englishField = `${field}_en`;
    const englishValue = dataObj[englishField];
    if (typeof englishValue === "string" && englishValue.trim() !== "") {
      return englishValue;
    }
  }

  // Check dictionary fallback if baseValue is in Thai
  if (baseValue && LOCALE_DICTIONARY_FALLBACKS[baseValue.trim()]) {
    const dictionaryHit = LOCALE_DICTIONARY_FALLBACKS[baseValue.trim()][locale] || LOCALE_DICTIONARY_FALLBACKS[baseValue.trim()]["en"];
    if (dictionaryHit) return dictionaryHit;
  }

  return baseValue;
}
