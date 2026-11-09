/**
 * Nearby Neighborhoods & Adjacent Areas Mapping
 * Provides real estate zone clustering for adjacent exploration.
 * Guarantees SAME PROVINCE exploration (Phuket stays in Phuket, Bangkok stays in Bangkok/vicinity).
 */

export interface NearbyAreaItem {
  name: string;
  name_en: string;
  name_cn?: string;
  name_ru?: string;
  province: string;
}

export const NEARBY_AREAS_MAP: Record<string, NearbyAreaItem[]> = {
  // --- Bangkok CBD & Sukhumvit Core ---
  ทองหล่อ: [
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "พระโขนง", name_en: "Phra Khanong", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
  ],
  เอกมัย: [
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
    { name: "พระโขนง", name_en: "Phra Khanong", province: "กรุงเทพมหานคร" },
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
  ],
  พร้อมพงษ์: [
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
    { name: "พระราม 4", name_en: "Rama 4", province: "กรุงเทพมหานคร" },
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
  ],
  อโศก: [
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "นานา", name_en: "Nana", province: "กรุงเทพมหานคร" },
    { name: "พระราม 9", name_en: "Rama 9", province: "กรุงเทพมหานคร" },
    { name: "รัชดาภิเษก", name_en: "Ratchadaphisek", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
  ],
  นานา: [
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "เพลินจิต", name_en: "Ploenchit", province: "กรุงเทพมหานคร" },
    { name: "ชิดลม - เพลินจิต", name_en: "Chidlom - Ploenchit", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
  ],
  "ชิดลม - เพลินจิต": [
    { name: "หลังสวน", name_en: "Langsuan", province: "กรุงเทพมหานคร" },
    { name: "วิทยุ", name_en: "Wireless Road", province: "กรุงเทพมหานคร" },
    { name: "สยาม", name_en: "Siam", province: "กรุงเทพมหานคร" },
    { name: "นานา", name_en: "Nana", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
  ],
  ชิดลม: [
    { name: "เพลินจิต", name_en: "Ploenchit", province: "กรุงเทพมหานคร" },
    { name: "หลังสวน", name_en: "Langsuan", province: "กรุงเทพมหานคร" },
    { name: "ราชดำริ", name_en: "Ratchadamri", province: "กรุงเทพมหานคร" },
    { name: "สยาม", name_en: "Siam", province: "กรุงเทพมหานคร" },
  ],
  เพลินจิต: [
    { name: "ชิดลม", name_en: "Chidlom", province: "กรุงเทพมหานคร" },
    { name: "วิทยุ", name_en: "Wireless Road", province: "กรุงเทพมหานคร" },
    { name: "นานา", name_en: "Nana", province: "กรุงเทพมหานคร" },
    { name: "หลังสวน", name_en: "Langsuan", province: "กรุงเทพมหานคร" },
  ],
  สุขุมวิท: [
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
  ],
  อ่อนนุช: [
    { name: "พระโขนง", name_en: "Phra Khanong", province: "กรุงเทพมหานคร" },
    { name: "อุดมสุข", name_en: "Udom Suk", province: "กรุงเทพมหานคร" },
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
    { name: "บางนา", name_en: "Bangna", province: "กรุงเทพมหานคร" },
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
  ],
  พระโขนง: [
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
  ],
  อุดมสุข: [
    { name: "บางนา", name_en: "Bangna", province: "กรุงเทพมหานคร" },
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
    { name: "ศรีนครินทร์", name_en: "Srinakarin", province: "กรุงเทพมหานคร" },
    { name: "พระโขนง", name_en: "Phra Khanong", province: "กรุงเทพมหานคร" },
  ],
  บางนา: [
    { name: "อุดมสุข", name_en: "Udom Suk", province: "กรุงเทพมหานคร" },
    { name: "ศรีนครินทร์", name_en: "Srinakarin", province: "กรุงเทพมหานคร" },
    { name: "อ่อนนุช", name_en: "On Nut", province: "กรุงเทพมหานคร" },
    { name: "กรุงเทพกรีฑา", name_en: "Krungthep Kreetha", province: "กรุงเทพมหานคร" },
  ],
  ศรีนครินทร์: [
    { name: "บางนา", name_en: "Bangna", province: "กรุงเทพมหานคร" },
    { name: "พัฒนาการ", name_en: "Pattanakarn", province: "กรุงเทพมหานคร" },
    { name: "กรุงเทพกรีฑา", name_en: "Krungthep Kreetha", province: "กรุงเทพมหานคร" },
    { name: "อุดมสุข", name_en: "Udom Suk", province: "กรุงเทพมหานคร" },
  ],
  กรุงเทพกรีฑา: [
    { name: "พระราม 9", name_en: "Rama 9", province: "กรุงเทพมหานคร" },
    { name: "ศรีนครินทร์", name_en: "Srinakarin", province: "กรุงเทพมหานคร" },
    { name: "พัฒนาการ", name_en: "Pattanakarn", province: "กรุงเทพมหานคร" },
    { name: "รามคำแหง", name_en: "Ramkhamhaeng", province: "กรุงเทพมหานคร" },
    { name: "บางนา", name_en: "Bangna", province: "กรุงเทพมหานคร" },
  ],

  // --- Silom, Sathorn, Riverside ---
  สาทร: [
    { name: "สีลม", name_en: "Silom", province: "กรุงเทพมหานคร" },
    { name: "ลุมพินี", name_en: "Lumpini", province: "กรุงเทพมหานคร" },
    { name: "พระราม 4", name_en: "Rama 4", province: "กรุงเทพมหานคร" },
    { name: "เจริญกรุง", name_en: "Charoenkrung", province: "กรุงเทพมหานคร" },
    { name: "หลังสวน", name_en: "Langsuan", province: "กรุงเทพมหานคร" },
  ],
  สีลม: [
    { name: "สาทร", name_en: "Sathorn", province: "กรุงเทพมหานคร" },
    { name: "ลุมพินี", name_en: "Lumpini", province: "กรุงเทพมหานคร" },
    { name: "สามย่าน", name_en: "Sam Yan", province: "กรุงเทพมหานคร" },
    { name: "เจริญกรุง", name_en: "Charoenkrung", province: "กรุงเทพมหานคร" },
    { name: "พระราม 4", name_en: "Rama 4", province: "กรุงเทพมหานคร" },
  ],
  หลังสวน: [
    { name: "ชิดลม - เพลินจิต", name_en: "Chidlom - Ploenchit", province: "กรุงเทพมหานคร" },
    { name: "ลุมพินี", name_en: "Lumpini", province: "กรุงเทพมหานคร" },
    { name: "วิทยุ", name_en: "Wireless Road", province: "กรุงเทพมหานคร" },
    { name: "สาทร", name_en: "Sathorn", province: "กรุงเทพมหานคร" },
  ],
  ลุมพินี: [
    { name: "สาทร", name_en: "Sathorn", province: "กรุงเทพมหานคร" },
    { name: "สีลม", name_en: "Silom", province: "กรุงเทพมหานคร" },
    { name: "หลังสวน", name_en: "Langsuan", province: "กรุงเทพมหานคร" },
    { name: "พระราม 4", name_en: "Rama 4", province: "กรุงเทพมหานคร" },
  ],
  "พระราม 4": [
    { name: "สาทร", name_en: "Sathorn", province: "กรุงเทพมหานคร" },
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "สุขุมวิท", name_en: "Sukhumvit", province: "กรุงเทพมหานคร" },
    { name: "สีลม", name_en: "Silom", province: "กรุงเทพมหานคร" },
  ],

  // --- Rama 9, Ratchada, Ladprao, Ari ---
  "พระราม 9": [
    { name: "รัชดาภิเษก", name_en: "Ratchadaphisek", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "ห้วยขวาง", name_en: "Huai Khwang", province: "กรุงเทพมหานคร" },
    { name: "กรุงเทพกรีฑา", name_en: "Krungthep Kreetha", province: "กรุงเทพมหานคร" },
  ],
  รัชดาภิเษก: [
    { name: "พระราม 9", name_en: "Rama 9", province: "กรุงเทพมหานคร" },
    { name: "ห้วยขวาง", name_en: "Huai Khwang", province: "กรุงเทพมหานคร" },
    { name: "ลาดพร้าว", name_en: "Ladprao", province: "กรุงเทพมหานคร" },
    { name: "สุทธิสาร", name_en: "Sutthisan", province: "กรุงเทพมหานคร" },
  ],
  ลาดพร้าว: [
    { name: "รัชดาภิเษก", name_en: "Ratchadaphisek", province: "กรุงเทพมหานคร" },
    { name: "จตุจักร", name_en: "Chatuchak", province: "กรุงเทพมหานคร" },
    { name: "พหลโยธิน", name_en: "Phahonyothin", province: "กรุงเทพมหานคร" },
    { name: "รามอินทรา", name_en: "Ramintra", province: "กรุงเทพมหานคร" },
  ],
  อารีย์: [
    { name: "พญาไท", name_en: "Phaya Thai", province: "กรุงเทพมหานคร" },
    { name: "สะพานควาย", name_en: "Saphan Khwai", province: "กรุงเทพมหานคร" },
    { name: "จตุจักร", name_en: "Chatuchak", province: "กรุงเทพมหานคร" },
    { name: "ราชเทวี", name_en: "Ratchathewi", province: "กรุงเทพมหานคร" },
  ],
  พญาไท: [
    { name: "อารีย์", name_en: "Ari", province: "กรุงเทพมหานคร" },
    { name: "ราชเทวี", name_en: "Ratchathewi", province: "กรุงเทพมหานคร" },
    { name: "สยาม", name_en: "Siam", province: "กรุงเทพมหานคร" },
    { name: "ชิดลม - เพลินจิต", name_en: "Chidlom - Ploenchit", province: "กรุงเทพมหานคร" },
  ],
  รามอินทรา: [
    { name: "ลาดพร้าว", name_en: "Ladprao", province: "กรุงเทพมหานคร" },
    { name: "เกษตร-นวมินทร์", name_en: "Kaset-Nawamin", province: "กรุงเทพมหานคร" },
    { name: "วัชรพล", name_en: "Watcharapol", province: "กรุงเทพมหานคร" },
  ],

  // --- Phuket Zone (Stays strictly inside Phuket) ---
  เชิงทะเล: [
    { name: "บางเทา", name_en: "Bang Tao", province: "ภูเก็ต" },
    { name: "ลายัน", name_en: "Layan", province: "ภูเก็ต" },
    { name: "สุรินทร์", name_en: "Surin", province: "ภูเก็ต" },
    { name: "กมลา", name_en: "Kamala", province: "ภูเก็ต" },
    { name: "ถลาง", name_en: "Thalang", province: "ภูเก็ต" },
  ],
  บางเทา: [
    { name: "เชิงทะเล", name_en: "Cherngtalay", province: "ภูเก็ต" },
    { name: "ลายัน", name_en: "Layan", province: "ภูเก็ต" },
    { name: "สุรินทร์", name_en: "Surin", province: "ภูเก็ต" },
    { name: "กมลา", name_en: "Kamala", province: "ภูเก็ต" },
  ],
  กมลา: [
    { name: "ป่าตอง", name_en: "Patong", province: "ภูเก็ต" },
    { name: "สุรินทร์", name_en: "Surin", province: "ภูเก็ต" },
    { name: "บางเทา", name_en: "Bang Tao", province: "ภูเก็ต" },
    { name: "เชิงทะเล", name_en: "Cherngtalay", province: "ภูเก็ต" },
  ],
  ป่าตอง: [
    { name: "กมลา", name_en: "Kamala", province: "ภูเก็ต" },
    { name: "กะรน", name_en: "Karon", province: "ภูเก็ต" },
    { name: "กะทู้", name_en: "Kathu", province: "ภูเก็ต" },
    { name: "กะตะ", name_en: "Kata", province: "ภูเก็ต" },
  ],
  ราไวย์: [
    { name: "ในหาน", name_en: "Nai Harn", province: "ภูเก็ต" },
    { name: "ฉลอง", name_en: "Chalong", province: "ภูเก็ต" },
    { name: "กะตะ", name_en: "Kata", province: "ภูเก็ต" },
    { name: "แหลมพรหมเทพ", name_en: "Promthep Cape", province: "ภูเก็ต" },
  ],
  ในหาน: [
    { name: "ราไวย์", name_en: "Rawai", province: "ภูเก็ต" },
    { name: "ฉลอง", name_en: "Chalong", province: "ภูเก็ต" },
    { name: "กะตะ", name_en: "Kata", province: "ภูเก็ต" },
  ],
  ฉลอง: [
    { name: "ราไวย์", name_en: "Rawai", province: "ภูเก็ต" },
    { name: "เมืองภูเก็ต", name_en: "Phuket Town", province: "ภูเก็ต" },
    { name: "กะตะ", name_en: "Kata", province: "ภูเก็ต" },
    { name: "กะทู้", name_en: "Kathu", province: "ภูเก็ต" },
  ],
  เมืองภูเก็ต: [
    { name: "ฉลอง", name_en: "Chalong", province: "ภูเก็ต" },
    { name: "กะทู้", name_en: "Kathu", province: "ภูเก็ต" },
    { name: "เกาะแก้ว", name_en: "Koh Kaew", province: "ภูเก็ต" },
  ],

  // --- Pattaya / Chonburi Zone ---
  จอมเทียน: [
    { name: "นาจอมเทียน", name_en: "Na Jomtien", province: "ชลบุรี" },
    { name: "เขาพระตำหนัก", name_en: "Pratumnak Hill", province: "ชลบุรี" },
    { name: "พัทยาใต้", name_en: "South Pattaya", province: "ชลบุรี" },
    { name: "พัทยากลาง", name_en: "Central Pattaya", province: "ชลบุรี" },
  ],
  เขาพระตำหนัก: [
    { name: "จอมเทียน", name_en: "Jomtien", province: "ชลบุรี" },
    { name: "พัทยาใต้", name_en: "South Pattaya", province: "ชลบุรี" },
    { name: "พัทยากลาง", name_en: "Central Pattaya", province: "ชลบุรี" },
  ],
  วงศ์อมาตย์: [
    { name: "พัทยาเหนือ", name_en: "North Pattaya", province: "ชลบุรี" },
    { name: "นาเกลือ", name_en: "Naklua", province: "ชลบุรี" },
    { name: "พัทยากลาง", name_en: "Central Pattaya", province: "ชลบุรี" },
  ],
};

// Aliases mapping English and synonyms to Thai key
const AREA_SYNONYMS: Record<string, string> = {
  thonglor: "ทองหล่อ",
  "thong lo": "ทองหล่อ",
  ekkamai: "เอกมัย",
  ekamai: "เอกมัย",
  "phrom phong": "พร้อมพงษ์",
  asoke: "อโศก",
  asok: "อโศก",
  sukhumvit: "สุขุมวิท",
  "on nut": "อ่อนนุช",
  onnut: "อ่อนนุช",
  "phra khanong": "พระโขนง",
  bangna: "บางนา",
  "bang na": "บางนา",
  "udom suk": "อุดมสุข",
  srinakarin: "ศรีนครินทร์",
  "krungthep kreetha": "กรุงเทพกรีฑา",
  sathorn: "สาทร",
  sathon: "สาทร",
  silom: "สีลม",
  "rama 9": "พระราม 9",
  "rama 4": "พระราม 4",
  ratchada: "รัชดาภิเษก",
  ratchadaphisek: "รัชดาภิเษก",
  ladprao: "ลาดพร้าว",
  ari: "อารีย์",
  "phaya thai": "พญาไท",
  "bang tao": "บางเทา",
  bangtao: "บางเทา",
  cherngtalay: "เชิงทะเล",
  kamala: "กมลา",
  patong: "ป่าตอง",
  rawai: "ราไวย์",
  "nai harn": "ในหาน",
  chalong: "ฉลอง",
  "phuket town": "เมืองภูเก็ต",
  jomtien: "จอมเทียน",
  pratumnak: "เขาพระตำหนัก",
};

/**
 * Returns nearby neighborhoods strictly within the same province.
 */
export function getNearbyNeighborhoods(
  area?: string | null,
  province?: string | null,
  limit: number = 6
): NearbyAreaItem[] {
  const normalizedArea = (area || "").trim();
  const lowerArea = normalizedArea.toLowerCase();
  const resolvedKey =
    NEARBY_AREAS_MAP[normalizedArea] ? normalizedArea : AREA_SYNONYMS[lowerArea] || null;

  if (resolvedKey && NEARBY_AREAS_MAP[resolvedKey]) {
    const list = NEARBY_AREAS_MAP[resolvedKey];
    // Filter to ensure same province if province is provided
    if (province) {
      const pNorm = province.trim();
      const filtered = list.filter(
        (item) => item.province === pNorm || (pNorm === "กรุงเทพมหานคร" && item.province === "กรุงเทพมหานคร")
      );
      if (filtered.length > 0) return filtered.slice(0, limit);
    }
    return list.slice(0, limit);
  }

  // Fallback default popular areas for common provinces
  if (province === "ภูเก็ต" || province === "Phuket") {
    return [
      { name: "เชิงทะเล", name_en: "Cherngtalay", province: "ภูเก็ต" },
      { name: "บางเทา", name_en: "Bang Tao", province: "ภูเก็ต" },
      { name: "ลายัน", name_en: "Layan", province: "ภูเก็ต" },
      { name: "กมลา", name_en: "Kamala", province: "ภูเก็ต" },
      { name: "ราไวย์", name_en: "Rawai", province: "ภูเก็ต" },
      { name: "ในหาน", name_en: "Nai Harn", province: "ภูเก็ต" },
    ].filter((item) => item.name !== normalizedArea).slice(0, limit);
  }

  if (province === "ชลบุรี" || province === "Chonburi" || province === "Chon Buri") {
    return [
      { name: "จอมเทียน", name_en: "Jomtien", province: "ชลบุรี" },
      { name: "เขาพระตำหนัก", name_en: "Pratumnak Hill", province: "ชลบุรี" },
      { name: "วงศ์อมาตย์", name_en: "Wongamat", province: "ชลบุรี" },
      { name: "พัทยาใต้", name_en: "South Pattaya", province: "ชลบุรี" },
      { name: "พัทยากลาง", name_en: "Central Pattaya", province: "ชลบุรี" },
    ].filter((item) => item.name !== normalizedArea).slice(0, limit);
  }

  // Default Bangkok core popular areas
  return [
    { name: "ทองหล่อ", name_en: "Thonglor", province: "กรุงเทพมหานคร" },
    { name: "พร้อมพงษ์", name_en: "Phrom Phong", province: "กรุงเทพมหานคร" },
    { name: "เอกมัย", name_en: "Ekkamai", province: "กรุงเทพมหานคร" },
    { name: "สาทร", name_en: "Sathorn", province: "กรุงเทพมหานคร" },
    { name: "อโศก", name_en: "Asoke", province: "กรุงเทพมหานคร" },
    { name: "พระราม 9", name_en: "Rama 9", province: "กรุงเทพมหานคร" },
  ].filter((item) => item.name !== normalizedArea).slice(0, limit);
}
