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

  // --- Popular Areas Dictionary Fallbacks ---
  "สาทร": { en: "Sathorn", cn: "沙吞", ru: "Сатхон" },
  "ยานนาวา": { en: "Yannawa", cn: "然那哇", ru: "Яннава" },
  "สุขุมวิท": { en: "Sukhumvit", cn: "素坤逸", ru: "Сукхумвит" },
  "อโศก": { en: "Asoke", cn: "阿索克", ru: "Асок" },
  "พร้อมพงษ์": { en: "Phrom Phong", cn: "澎蓬", ru: "Пхром Пхонг" },
  "ทองหล่อ": { en: "Thong Lo", cn: "通罗", ru: "Тхонг Ло" },
  "เอกมัย": { en: "Ekkamai", cn: "亿甲迈", ru: "Эккамай" },
  "พระราม 9": { en: "Rama 9", cn: "拉玛九", ru: "Рама 9" },
  "รัชดา": { en: "Ratchada", cn: "拉差达", ru: "Ратчада" },
  "ห้วยขวาง": { en: "Huai Khwang", cn: "辉煌", ru: "Хуай Кхванг" },
  "พญาไท": { en: "Phaya Thai", cn: "披耶泰", ru: "Пхая Тхай" },
  "อารีย์": { en: "Ari", cn: "阿里", ru: "Ари" },
  "จตุจักร": { en: "Chatuchak", cn: "乍都乍", ru: "Чатучак" },
  "บางนา": { en: "Bang Na", cn: "邦纳", ru: "Банг На" },
  "อ่อนนุช": { en: "On Nut", cn: "安奴", ru: "Он Нут" },
  "ปุณณวิถี": { en: "Punnawithi", cn: "普那威提", ru: "Пуннавити" },
  "อุดมสุข": { en: "Udom Suk", cn: "乌东素", ru: "Удом Сук" },
  "แบริ่ง": { en: "Bearing", cn: "轴承", ru: "Беринг" },
  "สำโรง": { en: "Samrong", cn: "三隆", ru: "Самронг" },
  "สีลม": { en: "Silom", cn: "是隆", ru: "Силом" },
  "ลุมพินี": { en: "Lumpini", cn: "伦披尼", ru: "Лумпини" },
  "เพลินจิต": { en: "Ploenchit", cn: "隆齐", ru: "Пхленчит" },
  "ชิดลม": { en: "Chidlom", cn: "奇隆", ru: "Читлом" },
  "สยาม": { en: "Siam", cn: "暹罗", ru: "Сиам" },
  "ราชเทวี": { en: "Ratchathewi", cn: "拉差贴威", ru: "Ратчатхеви" },
  "สามย่าน": { en: "Sam Yan", cn: "三燕", ru: "Сам Ян" },
  "พระราม 3": { en: "Rama 3", cn: "拉玛三", ru: "Рама 3" },
  "พระราม 4": { en: "Rama 4", cn: "拉玛四", ru: "Рама 4" },
  "คลองเตย": { en: "Khlong Toei", cn: "孔堤", ru: "Кхлонг Тей" },
  "เจริญกรุง": { en: "Charoen Krung", cn: "石龙军", ru: "Чароен Крунг" },
  "เจริญนคร": { en: "Charoen Nakhon", cn: "乍能那空", ru: "Чароен Накхон" },
  "ฝั่งธน": { en: "Thonburi", cn: "吞武里", ru: "Тхонбури" },
  "ธนบุรี": { en: "Thonburi", cn: "吞武里", ru: "Тхонбури" },
  "วงเวียนใหญ่": { en: "Wongwian Yai", cn: "大罗斗圈", ru: "Вонгвиан Яй" },
  "ตลาดพลู": { en: "Talat Phlu", cn: "哒叻普", ru: "Талат Пхлу" },
  "ท่าพระ": { en: "Tha Phra", cn: "塔帕", ru: "Тха Пхра" },
  "บางแค": { en: "Bang Khae", cn: "挽开", ru: "Банг Кхэ" },
  "เพชรเกษม": { en: "Phetkasem", cn: "碧甲盛", ru: "Пхеткасем" },
  "ปิ่นเกล้า": { en: "Pin Klao", cn: "宾诰", ru: "Пин Клао" },
  "จรัญสนิทวงศ์": { en: "Charan Sanitwong", cn: "查兰萨尼特翁", ru: "Чаран Санитвонг" },
  "บางซื่อ": { en: "Bang Sue", cn: "邦素", ru: "Банг Сือ" },
  "บางโพ": { en: "Bang Pho", cn: "邦坡", ru: "Банг Пхо" },
  "เตาปูน": { en: "Tao Poon", cn: "岛本", ru: "Тао Пун" },
  "วงศ์สว่าง": { en: "Wongsawang", cn: "翁沙旺", ru: "Вонгсаванг" },
  "ประชาชื่น": { en: "Prachachuen", cn: "巴差春", ru: "Прачачуен" },
  "งามวงศ์วาน": { en: "Ngamwongwan", cn: "昂旺万", ru: "Нгамвонгван" },
  "แจ้งวัฒนะ": { en: "Chaeng Watthana", cn: "澄瓦塔纳", ru: "Чэнг Ваттана" },
  "ดอนเมือง": { en: "Don Mueang", cn: "廊曼", ru: "Дон Муанг" },
  "รังสิต": { en: "Rangsit", cn: "兰实", ru: "Рангсит" },
  "ศรีนครินทร์": { en: "Srinakarin", cn: "席纳卡琳", ru: "Сринакарин" },
  "พัฒนาการ": { en: "Phatthanakan", cn: "帕卡农", ru: "Пхаттханакан" },
  "กรุงเทพกรีฑา": { en: "Krungthep Kreetha", cn: "空堤克里塔", ru: "Крунгтеп Крита" },
  "ลาดพร้าว": { en: "Lat Phrao", cn: "拉抛", ru: "Лат Пхрао" },
  "โชคชัย 4": { en: "Chokchai 4", cn: "卓猜4", ru: "Чокчай 4" },
  "เลียบด่วนรามอินทรา": { en: "Ramintra Expressway", cn: "兰因他沿线", ru: "Раминтра Экспрессвей" },
  "รามอินทรา": { en: "Ram Intra", cn: "兰因他", ru: "Рам Интра" },
  "เกษตร-นวมินทร์": { en: "Kaset-Nawamin", cn: "甲色-那瓦敏", ru: "Касет-Навамин" },
  "นวลจันทร์": { en: "Nuanchan", cn: "暖占", ru: "Нуанчан" },
  "รามคำแหง": { en: "Ramkhamhaeng", cn: "兰甘亨", ru: "Рамкхамхенг" },
  "หัวหมาก": { en: "Hua Mak", cn: "华马克", ru: "Хуа Мак" },
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
