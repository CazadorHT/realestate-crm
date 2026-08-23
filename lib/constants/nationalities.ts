export const NATIONALITY_MAP_TH_TO_EN: Record<string, string> = {
  "ไทย": "THA, Thailand",
  "จีน": "CHN, China",
  "ญี่ปุ่น": "JPN, Japan",
  "เกาหลี": "KOR, South Korea",
  "อเมริกัน": "USA, United States",
  "อังกฤษ": "GBR, United Kingdom",
  "ฝรั่งเศส": "FRA, France",
  "เยอรมัน": "DEU, Germany",
  "รัสเซีย": "RUS, Russia",
  "อินเดีย": "IND, India",
  "สิงคโปร์": "SGP, Singapore",
  "มาเลเซีย": "MYS, Malaysia",
  "พม่า": "MMR, Myanmar",
  "กัมพูชา": "KHM, Cambodia",
  "ลาว": "LAO, Laos",
  "เวียดนาม": "VNM, Vietnam",
  "ฟิลิปปินส์": "PHL, Philippines",
  "อินโดนีเซีย": "IDN, Indonesia",
  "สเปน": "ESP, Spain",
  "ไต้หวัน": "TWN, Taiwan",
  "ฮ่องกง": "HKG, Hong Kong",
  "ออสเตรเลีย": "AUS, Australia",
};

export const NATIONALITY_MAP_EN_TO_TH: Record<string, string> = {
  "thai": "ไทย",
  "thailand": "ไทย",
  "tha": "ไทย",
  "tha, thailand": "ไทย",
  "chinese": "จีน",
  "china": "จีน",
  "chn": "จีน",
  "chn, china": "จีน",
  "japanese": "ญี่ปุ่น",
  "japan": "ญี่ปุ่น",
  "jpn": "ญี่ปุ่น",
  "jpn, japan": "ญี่ปุ่น",
  "korean": "เกาหลี",
  "south korea": "เกาหลี",
  "kor": "เกาหลี",
  "kor, south korea": "เกาหลี",
  "american": "อเมริกัน",
  "united states": "อเมริกัน",
  "usa": "อเมริกัน",
  "usa, united states": "อเมริกัน",
  "british": "อังกฤษ",
  "united kingdom": "อังกฤษ",
  "gbr": "อังกฤษ",
  "gbr, united kingdom": "อังกฤษ",
  "french": "ฝรั่งเศส",
  "france": "ฝรั่งเศส",
  "fra": "ฝรั่งเศส",
  "fra, france": "ฝรั่งเศส",
  "german": "เยอรมัน",
  "germany": "เยอรมัน",
  "deu": "เยอรมัน",
  "deu, germany": "เยอรมัน",
  "russian": "รัสเซีย",
  "russia": "รัสเซีย",
  "rus": "รัสเซีย",
  "rus, russia": "รัสเซีย",
  "indian": "อินเดีย",
  "india": "อินเดีย",
  "ind": "อินเดีย",
  "ind, india": "อินเดีย",
  "singaporean": "สิงคโปร์",
  "singapore": "สิงคโปร์",
  "sgp": "สิงคโปร์",
  "sgp, singapore": "สิงคโปร์",
  "malaysian": "มาเลเซีย",
  "malaysia": "มาเลเซีย",
  "mys": "มาเลเซีย",
  "mys, malaysia": "มาเลเซีย",
  "burmese": "พม่า",
  "myanmar": "พม่า",
  "mmr": "พม่า",
  "mmr, myanmar": "พม่า",
  "cambodian": "กัมพูชา",
  "cambodia": "กัมพูชา",
  "khm": "กัมพูชา",
  "khm, cambodia": "กัมพูชา",
  "laotian": "ลาว",
  "laos": "ลาว",
  "lao": "ลาว",
  "lao, laos": "ลาว",
  "vietnamese": "เวียดนาม",
  "vietnam": "เวียดนาม",
  "vnm": "เวียดนาม",
  "vnm, vietnam": "เวียดนาม",
  "filipino": "ฟิลิปปินส์",
  "philippines": "ฟิลิปปินส์",
  "phl": "ฟิลิปปินส์",
  "phl, philippines": "ฟิลิปปินส์",
  "indonesian": "อินโดนีเซีย",
  "indonesia": "อินโดนีเซีย",
  "idn": "อินโดนีเซีย",
  "idn, indonesia": "อินโดนีเซีย",
  "spanish": "สเปน",
  "spain": "สเปน",
  "esp": "สเปน",
  "esp, spain": "สเปน",
  "taiwanese": "ไต้หวัน",
  "taiwan": "ไต้หวัน",
  "twn": "ไต้หวัน",
  "twn, taiwan": "ไต้หวัน",
  "hong konger": "ฮ่องกง",
  "hong kong": "ฮ่องกง",
  "hkg": "ฮ่องกง",
  "hkg, hong kong": "ฮ่องกง",
  "australian": "ออสเตรเลีย",
  "australia": "ออสเตรเลีย",
  "aus": "ออสเตรเลีย",
  "aus, australia": "ออสเตรเลีย",
};

export function translateToThai(text: string): string {
  if (!text) return "";
  let temp = text.toLowerCase();

  const keys = Object.keys(NATIONALITY_MAP_EN_TO_TH).sort(
    (a, b) => b.length - a.length
  );
  const result: string[] = [];

  for (const key of keys) {
    if (temp.includes(key)) {
      result.push(NATIONALITY_MAP_EN_TO_TH[key]);
      temp = temp.replace(new RegExp(key, "g"), "");
    }
  }

  const remaining = temp
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^[,\s]*$/.test(p));
  if (remaining.length > 0) {
    result.push(...remaining);
  }

  return result.join(", ");
}

export function translateToEnglish(text: string): string {
  if (!text) return "";
  const parts = text.split(",").map((p) => p.trim());
  const converted = parts.map(
    (part) => NATIONALITY_MAP_TH_TO_EN[part] || part
  );
  return converted.join(", ");
}
