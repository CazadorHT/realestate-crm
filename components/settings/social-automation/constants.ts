export const MOCK_PROPERTY_DATA = {
  title: "คอนโดหรู ใจกลางสุขุมวิท 24",
  price: "15,900,000",
  original_price: "18,500,000",
  sale_price: "15,900,000 บาท",
  rental_price: "65,000 บาท/เดือน",
  original_sale_price: "18,500,000 บาท",
  original_rental_price: "75,000 บาท/เดือน",
  price_tag: "🔥 ลดพิเศษ! 15,900,000 บาท (จาก 18,500,000 - ลด 14%)",
  bedrooms: "2",
  bathrooms: "2",
  size_sqm: "85",
  floor: "22",
  property_type: "Condo",
  listing_type: "Sale",
  popular_area: "Phrom Phong",
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

export const SMART_TAGS = [
  // Core Info
  { tag: "{{title}}", label: "ชื่อทรัพย์" },
  { tag: "{{project_name}}", label: "ชื่อโครงการ" },
  { tag: "{{price}}", label: "ราคาสรุป (แนะนำ)" },
  { tag: "{{price_tag}}", label: "ป้ายราคาอัจฉริยะ (ลดราคา/ขาย-เช่า)" },
  { tag: "{{location}}", label: "ทำเล (เขต/จังหวัด)" },
  { tag: "{{link}}", label: "ลิงก์เว็บ" },
  
  // Pricing Details
  { tag: "{{sale_price}}", label: "ราคาขายปัจจุบัน" },
  { tag: "{{rental_price}}", label: "ราคาเช่าปัจจุบัน" },
  { tag: "{{original_price}}", label: "ราคาเดิม (รวม)" },
  { tag: "{{original_sale_price}}", label: "ราคาขายเดิม" },
  { tag: "{{original_rental_price}}", label: "ราคาเช่าเดิม" },


  // Specs
  { tag: "{{bedrooms}}", label: "ห้องนอน" },
  { tag: "{{bathrooms}}", label: "ห้องน้ำ" },
  { tag: "{{size_sqm}}", label: "พื้นที่ (ตร.ม.)" },
  { tag: "{{floor}}", label: "ชั้นที่" },
  { tag: "{{details}}", label: "สรุปข้อมูล (ฺBeds/Baths/Sqm)" },
  { tag: "{{property_type}}", label: "ประเภททรัพย์" },
  { tag: "{{listing_type}}", label: "ประเภทประกาศ (ขาย/เช่า)" },

  // Location & Area
  { tag: "{{popular_area}}", label: "ย่านยอดนิยม" },
  { tag: "{{nearby_places}}", label: "สถานที่ใกล้เคียง" },
  { tag: "{{near_transit}}", label: "รถไฟฟ้าทั้งหมด" },
  { tag: "{{transit}}", label: "รถไฟฟ้าที่ใกล้สุด" },
  { tag: "{{google_maps}}", label: "Google Maps" },

  // Agent
  { tag: "{{agent_name}}", label: "ชื่อเอเจนท์" },
  { tag: "{{agent_phone}}", label: "เบอร์ติดต่อ" },
  { tag: "{{agent_line}}", label: "Line ID" },

  // Others
  { tag: "{{amenities}}", label: "สิ่งอำนวยความสะดวก" },
  { tag: "{{verified}}", label: "ตราตรวจสอบแล้ว" },
  { tag: "{{exclusive}}", label: "ตรา Exclusive" },
  { tag: "{{description}}", label: "รายละเอียดเต็ม" },
];
