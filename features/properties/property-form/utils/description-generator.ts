import { PropertyFormValues } from "../../schema";
// import { formatCurrency } from "@/lib/utils"; // Removed unused import to fix lint

function formatPrice(amount?: number | null, currency = "THB", isEn = false): string {
  if (!amount) return "-";
  return new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
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
  lang: "th" | "en" = "th"
): string {
  const isEn = lang === "en";
  const isSale =
    data.listing_type === "SALE" || data.listing_type === "SALE_AND_RENT";
  const isRent =
    data.listing_type === "RENT" || data.listing_type === "SALE_AND_RENT";

  const typeLabel = isEn
    ? (data.property_type === "CONDO"
        ? "Condo"
        : data.property_type === "HOUSE"
          ? "Single House"
          : data.property_type === "TOWNHOME"
            ? "Townhome"
            : "Property")
    : (data.property_type === "CONDO"
        ? "คอนโด"
        : data.property_type === "HOUSE"
          ? "บ้านเดี่ยว"
          : data.property_type === "TOWNHOME"
            ? "ทาวน์โฮม"
            : "อสังหาฯ");

  const projectTitle = (isEn ? data.title_en : data.title) || data.title || (isEn ? "[Project Name]" : "[ชื่อโครงการ]");
  let html = "";

  // ----------------------------------------------------
  // 1. HEADLINE
  // ----------------------------------------------------
  html += `<h2>`;
  if (isSale && isRent) html += isEn ? `🔥 For Sale / For Rent ` : `🔥 ขาย/ให้เช่า `;
  else if (isSale) html += isEn ? `🔥 Hot Sale ` : `🔥 ขายด่วน `;
  else if (isRent) html += isEn ? `🔥 For Rent ` : `🔥 ให้เช่า `;

  html += `${typeLabel} ${projectTitle} `;

  if (data.is_renovated) html += isEn ? `✨ Newly Renovated ` : `✨ รีโนเวทใหม่ `;
  if (data.is_pet_friendly) html += `🐶 Pet Friendly `;
  if (data.near_transit)
    html += isEn 
      ? `🚅 Near ${data.transit_station_name || "Transit"} ` 
      : `🚅 ใกล้ ${data.transit_station_name || "รถไฟฟ้า"} `;

  html += `</h2><br/>`;

  // ----------------------------------------------------
  // 2. HIGHLIGHTS (INTRO)
  // ----------------------------------------------------
  html += `<p><strong>${isEn ? "✨ Key Highlights:" : "✨ จุดเด่นห้ามพลาด:"}</strong></p><ul>`;

  if (data.is_pet_friendly)
    html += isEn 
      ? `<li>🐶 <strong>Pet Friendly:</strong> Pets allowed (Rare find in this area!)</li>`
      : `<li>🐶 <strong>Pet Friendly:</strong> เลี้ยงสัตว์ได้ (หายากในทำเลนี้!)</li>`;
  if (data.is_renovated)
    html += isEn
      ? `<li>✨ <strong>Newly Renovated:</strong> Excellent condition, ready to move in</li>`
      : `<li>✨ <strong>ตกแต่งใหม่:</strong> สภาพสวย พร้อมเข้าอยู่ทันที</li>`;
  if (data.is_corner_unit)
    html += isEn
      ? `<li>🧱 <strong>Corner Unit:</strong> Highly private corner unit</li>`
      : `<li>🧱 <strong>ห้องมุม:</strong> เป็นส่วนตัว ผนังไม่ติดใคร</li>`;
  if (data.floor && data.floor > 15)
    html += isEn
      ? `<li>🏙️ <strong>High Floor View:</strong> Floor ${data.floor} with unobstructed view</li>`
      : `<li>🏙️ <strong>วิวสวยชั้นสูง:</strong> ชั้น ${data.floor} วิวโล่งไม่บล็อก</li>`;
  if (data.is_fully_furnished)
    html += isEn
      ? `<li>🛋️ <strong>Fully Furnished:</strong> Complete furniture & electric appliances</li>`
      : `<li>🛋️ <strong>แต่งครบ:</strong> เฟอร์นิเจอร์ + เครื่องใช้ไฟฟ้า หิ้วกระเป๋าเข้าอยู่ได้เลย</li>`;

  // Views
  if (data.has_city_view) html += isEn ? `<li>🏙️ City View</li>` : `<li>🏙️ วิวเมือง (City View)</li>`;
  if (data.has_pool_view) html += isEn ? `<li>🏊 Pool View</li>` : `<li>🏊 วิวสระว่ายน้ำ (Pool View)</li>`;
  if (data.has_garden_view) html += isEn ? `<li>🌳 Garden View</li>` : `<li>🌳 วิวสวน (Garden View)</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 3. PROPERTY SPECS
  // ----------------------------------------------------
  html += `<p><strong>${isEn ? "🏠 Property Details:" : "🏠 รายละเอียดทรัพย์:"}</strong></p><ul>`;

  // Size
  if (data.size_sqm)
    html += isEn 
      ? `<li>Usable Area: <strong>${data.size_sqm} Sq.m.</strong></li>` 
      : `<li>พื้นที่ใช้สอย: <strong>${data.size_sqm} ตร.ม.</strong></li>`;
  if (data.land_size_sqwah)
    html += isEn 
      ? `<li>Land Area: <strong>${data.land_size_sqwah} Sq.wah</strong></li>` 
      : `<li>ขนาดที่ดิน: <strong>${data.land_size_sqwah} ตร.ว.</strong></li>`;

  // Function
  const beds = data.bedrooms 
    ? (isEn ? `${data.bedrooms} Bedrooms` : `${data.bedrooms} ห้องนอน`) 
    : (isEn ? "Studio" : "Studio");
  const baths = data.bathrooms 
    ? (isEn ? `${data.bathrooms} Bathrooms` : `${data.bathrooms} ห้องน้ำ`) 
    : "";
  html += `<li>${isEn ? "Layout" : "ฟังก์ชัน"}: ${beds} ${baths ? `/ ${baths}` : ""}</li>`;

  if (data.floor) html += isEn ? `<li>Floor: ${data.floor}</li>` : `<li>ชั้น: ${data.floor}</li>`;
  if (data.parking_slots)
    html += isEn 
      ? `<li>Parking: ${data.parking_slots} slot(s)</li>` 
      : `<li>ที่จอดรถ: ${data.parking_slots} คัน</li>`;

  // Decoration
  const furnish = data.is_bare_shell
    ? (isEn ? "Bare Shell" : "พื้นที่เปล่า / ห้องเปล่า (Bare Shell)")
    : data.is_fully_furnished
      ? (isEn ? "Fully Furnished" : "ตกแต่งครบ (Fully Furnished)")
      : (isEn ? "Partially Furnished / Standard" : "บางส่วน / มาตรฐาน");
  html += `<li>${isEn ? "Decoration" : "การตกแต่ง"}: ${furnish}</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 4. PRICE & PROMOTION
  // ----------------------------------------------------
  html += `<p><strong>${isEn ? "💰 Price & Terms:" : "💰 ราคาและเงื่อนไข:"}</strong></p><ul>`;

  if (isRent) {
    const rentPrice = formatPrice(
      data.rental_price || data.original_rental_price,
      "THB",
      isEn
    );
    html += `<li><strong>${isEn ? `Rent: ${rentPrice} / month` : `ค่าเช่า: ${rentPrice} / เดือน`}</strong></li>`;
    if (data.min_contract_months)
      html += isEn 
        ? `<li>Minimum Contract: ${data.min_contract_months} months</li>` 
        : `<li>สัญญาขั้นต่ำ: ${data.min_contract_months} เดือน</li>`;
    if (data.rent_free_period_days)
      html += isEn 
        ? `<li>🔥 Promotion: First ${data.rent_free_period_days} days rent-free!</li>` 
        : `<li>🔥 โปรโมชั่น: อยู่ฟรี ${data.rent_free_period_days} วันแรก!</li>`;
  }

  if (isSale) {
    const salePrice = formatPrice(data.price || data.original_price, "THB", isEn);
    html += `<li><strong>${isEn ? `Selling Price: ${salePrice}` : `ราคาขาย: ${salePrice}`}</strong></li>`;
    if (data.is_selling_with_tenant)
      html += isEn 
        ? `<li>👥 Sold with tenant (Great investment opportunity)</li>` 
        : `<li>👥 ขายพร้อมผู้เช่า (เหมาะสำหรับลงทุน)</li>`;
    if (data.is_foreigner_quota)
      html += isEn 
        ? `<li>🌍 Foreigner Quota Available</li>` 
        : `<li>🌍 ขายโควต้าต่างชาติ (Foreigner Quota)</li>`;
  }

  // Extra costs
  if (data.maintenance_fee)
    html += isEn 
      ? `<li>Common Fee: ${formatPrice(data.maintenance_fee, "THB", isEn)} / sq.m.</li>` 
      : `<li>ค่าส่วนกลาง: ${formatPrice(data.maintenance_fee)} / ตร.ม.</li>`;

  html += `</ul><br/>`;

  // ----------------------------------------------------
  // 5. FACILITIES
  // ----------------------------------------------------
  if (activeFeatures.length > 0) {
    html += `<p><strong>${isEn ? "🛠️ Facilities & Amenities:" : "🛠️ สิ่งอำนวยความสะดวก:"}</strong></p><ul>`;

    const facGroups: Record<string, string[]> = {};
    const FAC_CAT_MAP_TH: Record<string, string> = {
      SECURITY: "ระบบรักษาความปลอดภัย",
      FACILITY: "ส่วนกลาง",
      AMENITY: "สิ่งอำนวยความสะดวกในห้อง",
      Other: "อื่นๆ",
    };
    const FAC_CAT_MAP_EN: Record<string, string> = {
      SECURITY: "Security",
      FACILITY: "Common Facilities",
      AMENITY: "Room Amenities",
      Other: "Other",
    };

    activeFeatures.forEach((f) => {
      const catKey = f.category || "Other";
      const catLabel = (isEn ? FAC_CAT_MAP_EN[catKey] : FAC_CAT_MAP_TH[catKey]) || (isEn ? "Other" : "อื่นๆ");
      if (!facGroups[catLabel]) facGroups[catLabel] = [];
      facGroups[catLabel].push(f.name);
    });

    Object.entries(facGroups).forEach(([label, items]) => {
      const uniqueItems = Array.from(new Set(items));
      html += `<li><strong>${label}:</strong> ${uniqueItems.join(", ")}</li>`;
    });

    html += `</ul><br/>`;
  }

  // ----------------------------------------------------
  // 6. LOCATION
  // ----------------------------------------------------
  const hasNearby =
    (data.nearby_transits?.length ?? 0) > 0 ||
    (data.nearby_places?.length ?? 0) > 0 ||
    data.near_transit;

  if (hasNearby || data.google_maps_link) {
    html += `<p><strong>${isEn ? "📍 Location & Connectivity:" : "📍 ทำเลที่ตั้ง:"}</strong></p><ul>`;

    const groups: Record<string, string[]> = {};
    const addToGroup = (key: string, val: string) => {
      if (!groups[key]) groups[key] = [];
      groups[key].push(val);
    };

    const transitGroupLabel = isEn ? "Transportation" : "การเดินทาง";
    if (data.near_transit && data.transit_station_name) {
      addToGroup(
        transitGroupLabel,
        `${data.transit_type || "BTS/MRT"} ${data.transit_station_name} ${
          data.transit_distance_meters
            ? (isEn ? `(${data.transit_distance_meters} m)` : `(${data.transit_distance_meters} ม.)`)
            : ""
        }`.trim(),
      );
    }
    data.nearby_transits?.forEach((t) => {
      addToGroup(
        transitGroupLabel,
        `${t.type} ${t.station_name} ${
          t.distance_meters ? (isEn ? `(${t.distance_meters} m)` : `(${t.distance_meters} ม.)`) : ""
        }`.trim(),
      );
    });

    const CAT_MAP_TH: Record<string, string> = {
      School: "สถานศึกษา",
      Mall: "ห้างสรรพสินค้า/ตลาด",
      Hospital: "โรงพยาบาล",
      Airport: "สนามบิน",
      Transport: "การเดินทาง",
      Park: "สวนสาธารณะ",
      Office: "อาคารสำนักงาน",
      Other: "สถานที่อื่นๆ",
    };
    const CAT_MAP_EN: Record<string, string> = {
      School: "Schools & Universities",
      Mall: "Shopping & Markets",
      Hospital: "Hospitals",
      Airport: "Airports",
      Transport: "Transportation",
      Park: "Parks",
      Office: "Office Buildings",
      Other: "Other Places",
    };

    data.nearby_places?.forEach((p) => {
      const cat = p.category || "Other";
      const label = (isEn ? CAT_MAP_EN[cat] : CAT_MAP_TH[cat]) || (isEn ? "Other Places" : "สถานที่อื่นๆ");
      const name = p.name || "";
      const dist = p.distance_meters ? (isEn ? `(${p.distance_meters} m)` : `(${p.distance_meters} ม.)`) : "";
      addToGroup(label, `${name} ${dist}`.trim());
    });

    Object.entries(groups).forEach(([label, items]) => {
      if (items.length > 0) {
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
  html += `<p><strong>${isEn ? "📞 Contact & Viewing Appointment:" : "📞 สนใจติดต่อสอบถาม / นัดชมห้อง:"}</strong></p>`;
  html += `<ul>`;
  html += `<li><strong>Tel:</strong> ${isEn ? "[Your Phone Number]" : "[เบอร์โทรศัพท์ของคุณ]"}</li>`;
  html += `<li><strong>Line:</strong> ${isEn ? "[Your Line ID]" : "[Line ID ของคุณ]"}</li>`;
  html += `</ul>`;

  return html;
}
