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

export type FeatureItem = {
  name: string;
  category: string | null;
};

export function generatePropertyDescription(
  data: PropertyFormValues,
  activeFeatures: FeatureItem[] = [],
): string {
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
  let html = "";

  // ----------------------------------------------------
  // 1. HEADLINE
  // ----------------------------------------------------
  html += `<h2>`;
  if (isSale && isRent) html += `🔥 ขาย/ให้เช่า `;
  else if (isSale) html += `🔥 ขายด่วน `;
  else if (isRent) html += `🔥 ให้เช่า `;

  html += `${typeLabel} ${projectTitle} `;

  if (data.is_renovated) html += `✨ รีโนเวทใหม่ `;
  if (data.is_pet_friendly) html += `🐶 Pet Friendly `;
  if (data.near_transit)
    html += `🚅 ใกล้ ${data.transit_station_name || "รถไฟฟ้า"} `;

  html += `</h2><br/>`;

  // ----------------------------------------------------
  // 2. HIGHLIGHTS (INTRO)
  // ----------------------------------------------------
  html += `<p><strong>✨ จุดเด่นห้ามพลาด:</strong></p><ul>`;

  if (data.is_pet_friendly)
    html += `<li>🐶 <strong>Pet Friendly:</strong> เลี้ยงสัตว์ได้ (หายากในทำเลนี้!)</li>`;
  if (data.is_renovated)
    html += `<li>✨ <strong>ตกแต่งใหม่:</strong> สภาพสวย พร้อมเข้าอยู่ทันที</li>`;
  if (data.is_corner_unit)
    html += `<li>🧱 <strong>ห้องมุม:</strong> เป็นส่วนตัว ผนังไม่ติดใคร</li>`;
  if (data.floor && data.floor > 15)
    html += `<li>🏙️ <strong>วิวสวยชั้นสูง:</strong> ชั้น ${data.floor} วิวโล่งไม่บล็อก</li>`;
  if (data.is_fully_furnished)
    html += `<li>🛋️ <strong>แต่งครบ:</strong> เฟอร์นิเจอร์ + เครื่องใช้ไฟฟ้า หิ้วกระเป๋าเข้าอยู่ได้เลย</li>`;

  // Views
  if (data.has_city_view) html += `<li>🏙️ วิวเมือง (City View)</li>`;
  if (data.has_pool_view) html += `<li>🏊 วิวสระว่ายน้ำ (Pool View)</li>`;
  if (data.has_garden_view) html += `<li>🌳 วิวสวน (Garden View)</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 3. PROPERTY SPECS
  // ----------------------------------------------------
  html += `<p><strong>🏠 รายละเอียดทรัพย์:</strong></p><ul>`;

  // Size
  if (data.size_sqm)
    html += `<li>พื้นที่ใช้สอย: <strong>${data.size_sqm} ตร.ม.</strong></li>`;
  if (data.land_size_sqwah)
    html += `<li>ขนาดที่ดิน: <strong>${data.land_size_sqwah} ตร.ว.</strong></li>`;

  // Function
  const beds = data.bedrooms ? `${data.bedrooms} ห้องนอน` : "Studio";
  const baths = data.bathrooms ? `${data.bathrooms} ห้องน้ำ` : "";
  html += `<li>ฟังก์ชัน: ${beds} ${baths ? `/ ${baths}` : ""}</li>`;

  if (data.floor) html += `<li>ชั้น: ${data.floor}</li>`;
  if (data.parking_slots)
    html += `<li>ที่จอดรถ: ${data.parking_slots} คัน</li>`;

  // Decoration
  const furnish = data.is_bare_shell
    ? "พื้นที่เปล่า / ห้องเปล่า (Bare Shell)"
    : data.is_fully_furnished
      ? "ตกแต่งครบ (Fully Furnished)"
      : "บางส่วน / มาตรฐาน";
  html += `<li>การตกแต่ง: ${furnish}</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 4. PRICE & PROMOTION
  // ----------------------------------------------------
  html += `<p><strong>💰 ราคาและเงื่อนไข:</strong></p><ul>`;

  if (isRent) {
    const rentPrice = formatPrice(
      data.rental_price || data.original_rental_price,
    );
    html += `<li><strong>ค่าเช่า: ${rentPrice} / เดือน</strong></li>`;
    if (data.min_contract_months)
      html += `<li>สัญญาขั้นต่ำ: ${data.min_contract_months} เดือน</li>`;
    if (data.rent_free_period_days)
      html += `<li>🔥 โปรโมชั่น: อยู่ฟรี ${data.rent_free_period_days} วันแรก!</li>`;
  }

  if (isSale) {
    const salePrice = formatPrice(data.price || data.original_price);
    html += `<li><strong>ราคาขาย: ${salePrice}</strong></li>`;
    if (data.is_selling_with_tenant)
      html += `<li>👥 ขายพร้อมผู้เช่า (เหมาะสำหรับลงทุน)</li>`;
    if (data.is_foreigner_quota)
      html += `<li>🌍 ขายโควต้าต่างชาติ (Foreigner Quota)</li>`;
  }

  // Extra costs
  if (data.maintenance_fee)
    html += `<li>ค่าส่วนกลาง: ${formatPrice(data.maintenance_fee)} / ตร.ม.</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 5. FACILITIES
  // ----------------------------------------------------
  if (activeFeatures.length > 0) {
    html += `<p><strong>🛠️ สิ่งอำนวยความสะดวก:</strong></p><ul>`;

    const facGroups: Record<string, string[]> = {};
    const FAC_CAT_MAP: Record<string, string> = {
      SECURITY: "ระบบรักษาความปลอดภัย",
      FACILITY: "ส่วนกลาง",
      AMENITY: "สิ่งอำนวยความสะดวกในห้อง",
      Other: "อื่นๆ",
    };

    activeFeatures.forEach((f) => {
      const catKey = f.category || "Other";
      const catLabel = FAC_CAT_MAP[catKey] || "อื่นๆ";
      if (!facGroups[catLabel]) facGroups[catLabel] = [];
      facGroups[catLabel].push(f.name);
    });

    Object.entries(facGroups).forEach(([label, items]) => {
      const uniqueItems = Array.from(new Set(items));
      html += `<li><strong>${label}:</strong> ${uniqueItems.join(", ")}</li>`;
    });

    html += `</ul><br/>`;
  } else {
    // Fallback if no formatted features passed but we might want placeholders
    // Or just skip section. For now let's skip or show minimal if purely manual.
  }

  // ----------------------------------------------------
  // 6. LOCATION
  // ----------------------------------------------------
  // ----------------------------------------------------
  // 6. LOCATION
  // ----------------------------------------------------
  const hasNearby =
    (data.nearby_transits?.length ?? 0) > 0 ||
    (data.nearby_places?.length ?? 0) > 0 ||
    data.near_transit;

  if (hasNearby || data.google_maps_link) {
    html += `<p><strong>📍 ทำเลที่ตั้ง:</strong></p><ul>`;

    // 6.1 Grouping Logic
    const groups: Record<string, string[]> = {};
    const addToGroup = (key: string, val: string) => {
      if (!groups[key]) groups[key] = [];
      groups[key].push(val);
    };

    // (A) Transits -> "การเดินทาง"
    if (data.near_transit && data.transit_station_name) {
      addToGroup(
        "การเดินทาง",
        `${data.transit_type || "BTS/MRT"} ${data.transit_station_name} ${
          data.transit_distance_meters
            ? `(${data.transit_distance_meters} ม.)`
            : ""
        }`.trim(),
      );
    }
    data.nearby_transits?.forEach((t) => {
      addToGroup(
        "การเดินทาง",
        `${t.type} ${t.station_name} ${
          t.distance_meters ? `(${t.distance_meters} ม.)` : ""
        }`.trim(),
      );
    });

    // (B) Nearby Places -> Mapped Categories
    const CAT_MAP: Record<string, string> = {
      School: "สถานศึกษา",
      Mall: "ห้างสรรพสินค้า/ตลาด",
      Hospital: "โรงพยาบาล",
      Transport: "การเดินทาง",
      Park: "สวนสาธารณะ",
      Office: "อาคารสำนักงาน",
      Other: "สถานที่อื่นๆ",
    };

    data.nearby_places?.forEach((p) => {
      const cat = p.category || "Other";
      const label = CAT_MAP[cat] || "สถานที่อื่นๆ";
      const name = p.name || "";
      const dist = p.distance_meters ? `(${p.distance_meters} ม.)` : "";
      addToGroup(label, `${name} ${dist}`.trim());
    });

    // 6.2 Render Groups
    Object.entries(groups).forEach(([label, items]) => {
      if (items.length > 0) {
        // Take unique items just in case
        const uniqueItems = Array.from(new Set(items));
        html += `<li><strong>${label}:</strong> ${uniqueItems.join(", ")}</li>`;
      }
    });

    if (data.google_maps_link) {
      html += `<li>🗺️ <a href="${data.google_maps_link}" target="_blank">Google Maps</a></li>`;
    }
    html += `</ul><br/>`;
  }

  // ----------------------------------------------------
  // 7. CALL TO ACTION
  // ----------------------------------------------------
  html += `<hr />`;
  html += `<p><strong>📞 สนใจติดต่อสอบถาม / นัดชมห้อง:</strong></p>`;
  html += `<ul>`;
  html += `<li><strong>Tel:</strong> [เบอร์โทรศัพท์ของคุณ]</li>`;
  html += `<li><strong>Line:</strong> [Line ID ของคุณ]</li>`;
  html += `</ul>`;

  return html;
}
