import { PropertyFormValues } from "../../schema";
// import { formatCurrency } from "@/lib/utils"; // Removed unused import to fix lint

function formatPrice(amount?: number | null, currency = "THB"): string {
  if (!amount) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generatePropertyDescription(data: PropertyFormValues): string {
  const isSale =
    data.listing_type === "SALE" || data.listing_type === "SALE_AND_RENT";
  const isRent =
    data.listing_type === "RENT" || data.listing_type === "SALE_AND_RENT";

  const typeLabel =
    data.property_type === "CONDO"
      ? "คอนโด"
      : data.property_type === "HOUSE"
        ? "บ้านเดี่ยว"
        : data.property_type === "TOWNHOME"
          ? "ทาวน์โฮม"
          : "อสังหาฯ";

  const projectTitle = data.title || "[ชื่อโครงการ]";

  // 1. HEADLINE
  let html = `<p><strong>🔥 `;
  if (isSale && isRent) html += `ขาย/ให้เช่า `;
  else if (isSale) html += `ขายด่วน `;
  else if (isRent) html += `ให้เช่า `;

  html += `${typeLabel} ${projectTitle} `;

  if (data.is_renovated) html += `รีโนเวทใหม่สวยมาก `;
  if (data.is_pet_friendly) html += `เลี้ยงสัตว์ได้ 🐶🐱 `;
  if (data.near_transit)
    html += `ใกล้ ${data.transit_station_name || "รถไฟฟ้า"} `;

  html += `</strong></p>`;

  // 2. HIGHLIGHTS (INTRO)
  html += `<p>✨ <strong>จุดเด่น:</strong></p><ul>`;
  if (data.is_corner_unit) html += `<li>ห้องมุม เป็นส่วนตัว วิวสวย</li>`;
  if (data.floor && data.floor > 20)
    html += `<li>ชั้นสูง (${data.floor}) วิวโล่งไม่บล็อก</li>`;
  if (data.is_fully_furnished)
    html += `<li>แต่งครบ เฟอร์นิเจอร์+เครื่องใช้ไฟฟ้า พร้อมเข้าอยู่</li>`;
  if (data.is_renovated) html += `<li>ตกแต่งใหม่ สภาพนางฟ้า</li>`;
  if (data.is_pet_friendly)
    html += `<li>Pet Friendly เลี้ยงสัตว์เปิดเผยได้</li>`;
  if (data.allow_smoking) html += `<li>สูบบุหรี่ได้ (ระเบียง)</li>`;
  if (data.has_private_pool) html += `<li>มีสระว่ายน้ำส่วนตัว</li>`;
  html += `</ul>`;

  // 3. SPECS
  html += `<p>🏠 <strong>รายละเอียดห้อง:</strong></p><ul>`;
  if (data.size_sqm) html += `<li>ขนาด: ${data.size_sqm} ตร.ม.</li>`;
  if (data.land_size_sqwah)
    html += `<li>ที่ดิน: ${data.land_size_sqwah} ตร.ว.</li>`;

  const beds = data.bedrooms ? `${data.bedrooms} ห้องนอน` : "Studio";
  const baths = data.bathrooms ? `${data.bathrooms} ห้องน้ำ` : "";
  html += `<li>ฟังก์ชัน: ${beds} ${baths}</li>`;

  if (data.floor) html += `<li>ชั้น: ${data.floor}</li>`;
  if (data.parking_slots)
    html += `<li>ที่จอดรถ: ${data.parking_slots} คัน</li>`;
  // Furnishing
  const furnish = data.is_unfurnished
    ? "ห้องเปล่า"
    : data.is_fully_furnished
      ? "เฟอร์ครบ"
      : "เฟอร์บางส่วน";
  html += `<li>การตกแต่ง: ${furnish}</li>`;
  html += `</ul>`;

  // 4. PRICE
  html += `<p>💰 <strong>ราคาและเงื่อนไข:</strong></p><ul>`;

  if (isSale) {
    const salePrice = data.price || data.original_price;
    html += `<li><strong>ราคาขาย: ${formatPrice(salePrice)}</strong>`;
    if (data.original_price && data.price && data.original_price > data.price) {
      html += ` (ลดจาก ${formatPrice(data.original_price)})`;
    }
    html += `</li>`;
  }

  if (isRent) {
    const rentPrice = data.rental_price || data.original_rental_price;
    html += `<li><strong>ค่าเช่า: ${formatPrice(rentPrice)}/เดือน</strong>`;
    if (
      data.original_rental_price &&
      data.rental_price &&
      data.original_rental_price > data.rental_price
    ) {
      html += ` (โปรโมชั่นจาก ${formatPrice(data.original_rental_price)})`;
    }
    html += `</li>`;
    if (data.min_contract_months) {
      html += `<li>สัญญาขั้นต่ำ: ${data.min_contract_months} เดือน</li>`;
    }
  }
  html += `</ul>`;

  // 5. LOCATION (If available)
  if (data.google_maps_link) {
    html += `<p>📍 <strong>ทำเลที่ตั้ง:</strong> <a href="${data.google_maps_link}" target="_blank">Google Maps</a></p>`;
  }

  // 6. CONTACT (Placeholder)
  html += `<p>───────────────────────</p>`;
  html += `<p>📞 <strong>สนใจติดต่อสอบถาม / นัดชม:</strong></p>`;
  html += `<p>โทร: <strong>[เบอร์โทรศัพท์ของคุณ]</strong></p>`;
  html += `<p>Line: <strong>[Line ID ของคุณ]</strong></p>`;

  return html;
}
