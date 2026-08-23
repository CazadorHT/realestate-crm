export const MOCK_PROPERTY_DATA_TH = {
  title: "คอนโดหรู ใจกลางสุขุมวิท 24",
  price: "15,900,000",
  original_price: "18,500,000",
  sale_price: "15,900,000 บาท",
  rental_price: "65,000 บาท/เดือน",
  original_sale_price: "18,500,000 บาท",
  original_rental_price: "75,000 บาท/เดือน",
  price_tag: "ลดพิเศษ! 15,900,000 บาท (จาก 18,500,000 - ลด 14%)",
  bedrooms: "2",
  bathrooms: "2",
  size_sqm: "85",
  floor: "22",
  property_type: "Condo",
  listing_type: "Sale",
  popular_area: "พร้อมพงษ์",
  location: "คลองเตย กรุงเทพฯ",
  amenities: "- สระว่ายน้ำ\n- ฟิตเนส\n- ที่จอดรถ 100%",
  nearby_places: "BTS พร้อมพงษ์, เอ็มควอเทียร์",
  near_transit: "BTS พร้อมพงษ์",
  transit: "BTS พร้อมพงษ์ (500ม.)",
  google_maps: "https://maps.google.com/...",
  verified: "✅ ตรวจสอบแล้ว",
  exclusive: "🌟 Exclusive",
  agent_name: "John Doe",
  agent_phone: "081-234-5678",
  agent_line: "@realestate_john",
  link: "https://your-crm.com/properties/123",
  details: "4 ห้องนอน | 5 ห้องน้ำ | 320 ตร.ม. | ชั้น 2",
  description:
    "บ้านเดี่ยวสุดหรู 2 ชั้น พร้อมสระว่ายน้ำส่วนตัว ทำเลทองย่านห้วยขวาง พื้นที่ใช้สอยกว้างขวาง ตกแต่งครบครัน...",
  project_name: "เดอะ พาร์ค สุขุมวิท 24",
};

export const MOCK_PROPERTY_DATA_EN = {
  title: "Luxury Condo in Central Sukhumvit 24",
  price: "15,900,000",
  original_price: "18,500,000",
  sale_price: "THB 15,900,000",
  rental_price: "THB 65,000/mo",
  original_sale_price: "THB 18,500,000",
  original_rental_price: "THB 75,000/mo",
  price_tag: "Special Deal! THB 15.9M (Was 18.5M - Save 14%)",
  bedrooms: "2",
  bathrooms: "2",
  size_sqm: "85",
  floor: "22",
  property_type: "Condo",
  listing_type: "Sale",
  popular_area: "Phrom Phong",
  location: "Khlong Toei, Bangkok",
  amenities: "- Swimming Pool\n- Fitness Center\n- 100% Parking",
  nearby_places: "BTS Phrom Phong, EmQuartier",
  near_transit: "BTS Phrom Phong",
  transit: "BTS Phrom Phong (500m)",
  google_maps: "https://maps.google.com/...",
  verified: "✅ Verified",
  exclusive: "🌟 Exclusive",
  agent_name: "John Doe",
  agent_phone: "081-234-5678",
  agent_line: "@realestate_john",
  link: "https://your-crm.com/properties/123",
  details: "4 Beds | 5 Baths | 320 Sq.m. | 2nd Fl.",
  description:
    "Luxury 2-story detached house with private pool, prime Huai Khwang location, spacious living area, fully furnished...",
  project_name: "The Park Sukhumvit 24",
};

export const getMockPropertyData = (isEn: boolean = false) => {
  return isEn ? MOCK_PROPERTY_DATA_EN : MOCK_PROPERTY_DATA_TH;
};

// Default export for backwards-compatibility
export const MOCK_PROPERTY_DATA = MOCK_PROPERTY_DATA_TH;

export const SMART_TAGS = [
  // Core Info
  { tag: "{{title}}", label: "ชื่อทรัพย์", label_en: "Property Title" },
  { tag: "{{project_name}}", label: "ชื่อโครงการ", label_en: "Project Name" },
  { tag: "{{price}}", label: "ราคาสรุป (แนะนำ)", label_en: "Summary Price (Recommended)" },
  { tag: "{{price_tag}}", label: "ป้ายราคาอัจฉริยะ (ลดราคา/ขาย-เช่า)", label_en: "Smart Price Tag (Discount/Sale-Rent)" },
  { tag: "{{location}}", label: "ทำเล (เขต/จังหวัด)", label_en: "Location (District/City)" },
  { tag: "{{link}}", label: "ลิงก์เว็บ", label_en: "Property Link" },
  
  // Pricing Details
  { tag: "{{sale_price}}", label: "ราคาขายปัจจุบัน", label_en: "Current Sale Price" },
  { tag: "{{rental_price}}", label: "ราคาเช่าปัจจุบัน", label_en: "Current Rent Price" },
  { tag: "{{original_price}}", label: "ราคาเดิม (รวม)", label_en: "Original Price (Total)" },
  { tag: "{{original_sale_price}}", label: "ราคาขายเดิม", label_en: "Original Sale Price" },
  { tag: "{{original_rental_price}}", label: "ราคาเช่าเดิม", label_en: "Original Rent Price" },

  // Specs
  { tag: "{{bedrooms}}", label: "ห้องนอน", label_en: "Bedrooms" },
  { tag: "{{bathrooms}}", label: "ห้องน้ำ", label_en: "Bathrooms" },
  { tag: "{{size_sqm}}", label: "พื้นที่ (ตร.ม.)", label_en: "Usable Area (sqm)" },
  { tag: "{{floor}}", label: "ชั้นที่", label_en: "Floor" },
  { tag: "{{details}}", label: "สรุปข้อมูล (Beds/Baths/Sqm)", label_en: "Specs Summary (Beds/Baths/Sqm)" },
  { tag: "{{property_type}}", label: "ประเภททรัพย์", label_en: "Property Type" },
  { tag: "{{listing_type}}", label: "ประเภทประกาศ (ขาย/เช่า)", label_en: "Listing Type (Sale/Rent)" },

  // Location & Area
  { tag: "{{popular_area}}", label: "ย่านยอดนิยม", label_en: "Popular Neighborhood" },
  { tag: "{{nearby_places}}", label: "สถานที่ใกล้เคียง", label_en: "Nearby Places" },
  { tag: "{{near_transit}}", label: "รถไฟฟ้าทั้งหมด", label_en: "All Transit Lines" },
  { tag: "{{transit}}", label: "รถไฟฟ้าที่ใกล้สุด", label_en: "Nearest Transit Station" },
  { tag: "{{google_maps}}", label: "Google Maps", label_en: "Google Maps Link" },

  // Agent
  { tag: "{{agent_name}}", label: "ชื่อเอเจนท์", label_en: "Agent Name" },
  { tag: "{{agent_phone}}", label: "เบอร์ติดต่อ", label_en: "Contact Phone" },
  { tag: "{{agent_line}}", label: "Line ID", label_en: "Line ID" },

  // Others
  { tag: "{{amenities}}", label: "สิ่งอำนวยความสะดวก", label_en: "Amenities" },
  { tag: "{{verified}}", label: "ตราตรวจสอบแล้ว", label_en: "Verified Badge" },
  { tag: "{{exclusive}}", label: "ตรา Exclusive", label_en: "Exclusive Badge" },
  { tag: "{{description}}", label: "รายละเอียดเต็ม", label_en: "Full Description" },
];
