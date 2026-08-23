import { 
  PROPERTY_TYPE_LABELS, 
  LISTING_TYPE_LABELS, 
  PROPERTY_STATUS_LABELS,
  propertyStatusLabel,
  propertyTypeLabel,
  listingTypeLabel
} from "@/features/properties/labels";
import { PropertyFormValues } from "@/features/properties/schema";

export interface PropertyDiffResult {
  changed_fields: string[];
  summary: string[];
  details: Record<string, { old: unknown; new: unknown }>;
  image_changes?: { added: string[]; removed: string[] };
  word_counts?: Record<string, { old: number; new: number; delta: number }>;
  oldState: Partial<PropertyFormValues>;
  newState: Partial<PropertyFormValues>;
}

export function getPropertyDiff(
  oldData: Partial<PropertyFormValues>,
  newData: Partial<PropertyFormValues>,
  context: {
    allAgents?: { id: string; full_name: string }[];
    allFeatures?: { id: string; label: string }[];
    language?: "th" | "en";
  } = {}
): PropertyDiffResult {
  const isEn = context.language === "en";
  const diff: PropertyDiffResult = {
    changed_fields: [],
    summary: [],
    details: {},
    oldState: oldData,
    newState: newData,
  };

  const trackField = (
    key: keyof PropertyFormValues, 
    labelTh: string,
    labelEn: string,
    formatter?: (v: unknown) => string,
    isLongText: boolean = false
  ) => {
    const label = isEn ? labelEn : labelTh;
    const oldVal = (oldData as Record<string, unknown>)[key];
    const newVal = (newData as Record<string, unknown>)[key];

    // Normalize empty values (null, undefined, empty string)
    const isOldEmpty = oldVal === null || oldVal === undefined || oldVal === "";
    const isNewEmpty = newVal === null || newVal === undefined || newVal === "";
    if (isOldEmpty && isNewEmpty) return;

    // Normalize numeric values
    if (typeof oldVal === "number" || typeof newVal === "number") {
      const oldNum = oldVal !== null && oldVal !== undefined && oldVal !== "" ? Number(oldVal) : null;
      const newNum = newVal !== null && newVal !== undefined && newVal !== "" ? Number(newVal) : null;
      if (oldNum === newNum) return;
    }

    // Standard equality check
    if (oldVal != newVal) {
      const oldFormatted = formatter ? formatter(oldVal) : String(oldVal ?? "N/A");
      const newFormatted = formatter ? formatter(newVal) : String(newVal ?? "N/A");
      
      // If formatted strings are identical, skip
      if (oldFormatted === newFormatted) return;

      diff.changed_fields.push(key);
      let summaryText = `${label}: ${oldFormatted} → ${newFormatted}`;
      
      if (isLongText && oldVal && newVal) {
        const oldWords = String(oldVal).split(/\s+/).filter(Boolean).length;
        const newWords = String(newVal).split(/\s+/).filter(Boolean).length;
        const delta = newWords - oldWords;
        const deltaText = delta >= 0 ? `(+${delta} words)` : `(${delta} words)`;
        summaryText = isEn 
          ? `${label}: Updated content ${deltaText}` 
          : `${label}: แก้ไขเนื้อหา ${deltaText}`;
        
        if (!diff.word_counts) diff.word_counts = {};
        diff.word_counts[key] = { old: oldWords, new: newWords, delta };
      }

      diff.summary.push(summaryText);
      diff.details[key] = { old: oldVal, new: newVal };
    }
  };

  const trackBooleanField = (key: keyof PropertyFormValues, labelTh: string, labelEn: string) => {
    const label = isEn ? labelEn : labelTh;
    const oldBool = Boolean((oldData as Record<string, unknown>)[key]);
    const newBool = Boolean((newData as Record<string, unknown>)[key]);

    if (oldBool !== newBool) {
      diff.changed_fields.push(key);
      const trueStr = isEn ? "Yes" : "ใช่";
      const falseStr = isEn ? "No" : "ไม่ใช่";
      const summaryText = `${label}: ${oldBool ? trueStr : falseStr} → ${newBool ? trueStr : falseStr}`;
      diff.summary.push(summaryText);
      diff.details[key] = { old: oldBool, new: newBool };
    }
  };

  // Helper for Enum Localization
  const enumFormatter = (labels: Record<string, any>) => (val: unknown) => {
    const key = String(val ?? "");
    const labelObj = labels[key];
    if (labelObj && typeof labelObj === "object") {
      return (isEn ? labelObj.en : labelObj.th) || labelObj.th || labelObj.en;
    }
    return labelObj || String(val ?? "N/A");
  };

  // --- 1. CORE FIELDS ---
  trackField("price", "ราคาขายปัจจุบัน", "Current Sale Price", formatCurrencyDiff);
  trackField("original_price", "ราคาตั้งขาย", "Original Sale Price", formatCurrencyDiff);
  trackField("rental_price", "ราคาเช่าปัจจุบัน", "Current Rent Price", formatCurrencyDiff);
  trackField("original_rental_price", "ราคาตั้งเช่า", "Original Rent Price", formatCurrencyDiff);
  trackField("status", "สถานะ", "Status", enumFormatter(PROPERTY_STATUS_LABELS));
  trackField("listing_type", "ประเภทประกาศ", "Listing Type", enumFormatter(LISTING_TYPE_LABELS));
  trackField("property_type", "ประเภททรัพย์", "Property Type", enumFormatter(PROPERTY_TYPE_LABELS));
  trackField("title", "ชื่อทรัพย์", "Property Title (TH)");
  trackField("title_en", "ชื่อทรัพย์ (EN)", "Property Title (EN)");
  
  // --- 2. DESCRIPTIONS (Long Text) ---
  trackField("description", "รายละเอียดทรัพย์", "Description (TH)", undefined, true);
  trackField("description_en", "รายละเอียดทรัพย์ (EN)", "Description (EN)", undefined, true);

  // --- 3. OWNERSHIP & FINANCIALS ---
  trackField("owner_id", "เจ้าของทรัพย์ (Owner)", "Property Owner");
  trackField("assigned_to", "เอเจนท์ผู้ดูแลหลัก", "Lead Agent");
  trackField("commission_sale_percentage", "ค่าคอมมิชชั่นการขาย (%)", "Sale Commission (%)");
  trackField("commission_rent_months", "ค่าคอมมิชชั่นการเช่า (เดือน)", "Rental Commission (Months)");
  trackField("maintenance_fee", "ค่าส่วนกลาง", "Common Fee");
  trackField("total_units", "จำนวนยูนิตทั้งหมด", "Total Units");
  trackField("sold_units", "จำนวนที่ขายแล้ว", "Sold Units");

  // --- 4. PHYSICAL SPECS ---
  trackField("bedrooms", "ห้องนอน", "Bedrooms");
  trackField("bathrooms", "ห้องน้ำ", "Bathrooms");
  trackField("size_sqm", "พื้นที่ใช้สอย (ตร.ม.)", "Usable Area (Sq.m.)");
  trackField("land_size_sqwah", "พื้นที่ดิน (ตร.ว.)", "Land Area (Sq.wah)");
  trackField("floor", "ชั้น", "Floor");
  trackField("orientation", "ทิศทาง", "Orientation");
  trackField("parking_slots", "ที่จอดรถ", "Parking Slots");

  // --- 5. LOCATION ---
  trackField("address_line1", "ที่อยู่/โครงการ", "Address/Project");
  trackField("google_maps_link", "ลิงก์แผนที่", "Google Maps Link");
  trackField("province", "จังหวัด", "Province");
  trackField("district", "เขต/อำเภอ", "District");

  // --- 6. BOOLEAN FLAGS (TAGS) ---
  const booleanFieldsMap: Record<string, { th: string; en: string }> = {
    is_exclusive: { th: "สัญญา Exclusive", en: "Exclusive Contract" },
    is_pet_friendly: { th: "เลี้ยงสัตว์ได้", en: "Pet Friendly" },
    is_fully_furnished: { th: "เฟอร์นิเจอร์ครบ", en: "Fully Furnished" },
    is_renovated: { th: "ตกแต่ง/รีโนเวทใหม่", en: "Renovated" },
    verified: { th: "ยืนยันแล้ว", en: "Verified" },
    requires_ai_review: { th: "รอ AI ตรวจสอบ", en: "Requires AI Review" },
    is_co_agent: { th: "รับ Co-Agent", en: "Co-Agent Allowed" },
    has_private_pool: { th: "สระว่ายน้ำส่วนตัว", en: "Private Pool" },
    is_selling_with_tenant: { th: "ขายพร้อมผู้เช่า", en: "Selling with Tenant" },
    is_bare_shell: { th: "ห้องเปล่า (Bare Shell)", en: "Bare Shell" },
    has_garden_view: { th: "วิวสวน", en: "Garden View" },
    has_pool_view: { th: "วิวสระว่ายน้ำ", en: "Pool View" },
    has_city_view: { th: "วิวเมือง", en: "City View" },
    has_river_view: { th: "วิวแม่น้ำ", en: "River View" },
    is_cbd: { th: "ทำเล CBD", en: "CBD Location" },
    is_smart_home: { th: "ระบบ Smart Home", en: "Smart Home System" },
  };
  
  Object.entries(booleanFieldsMap).forEach(([fieldKey, labels]) => {
    trackBooleanField(fieldKey as keyof PropertyFormValues, labels.th, labels.en);
  });

  // --- 7. JUNCTION: IMAGES (Visual Tracking) ---
  const oldImgs = oldData.images || [];
  const newImgs = newData.images || [];
  if (JSON.stringify(oldImgs) !== JSON.stringify(newImgs)) {
    const added = newImgs.filter(url => !oldImgs.includes(url));
    const removed = oldImgs.filter(url => !newImgs.includes(url));
    
    if (added.length > 0 || removed.length > 0) {
      diff.changed_fields.push("images");
      diff.image_changes = { added, removed };
      
      let imgSum = isEn ? "Images: " : "รูปภาพ: ";
      if (added.length) imgSum += isEn ? `Added ${added.length} image(s) ` : `เพิ่ม ${added.length} รูป `;
      if (removed.length) imgSum += isEn ? `Removed ${removed.length} image(s)` : `ลบ ${removed.length} รูป`;
      diff.summary.push(imgSum.trim());
      diff.details.images = { old: oldImgs, new: newImgs };
    }
  }

  // --- 8. JUNCTION: AGENTS ---
  const agentDiff = calculateCollectionDiff(
    oldData.agent_ids || [], 
    newData.agent_ids || [], 
    (context.allAgents || []).map(a => ({ id: a.id, label: a.full_name }))
  );
  if (agentDiff.hasChanges) {
    diff.changed_fields.push("agent_ids");
    if (agentDiff.added.length) diff.summary.push(isEn ? `Added Agents: ${agentDiff.added.join(", ")}` : `เพิ่มเอเจนท์: ${agentDiff.added.join(", ")}`);
    if (agentDiff.removed.length) diff.summary.push(isEn ? `Removed Agents: ${agentDiff.removed.join(", ")}` : `ถอดเอเจนท์: ${agentDiff.removed.join(", ")}`);
    diff.details.agent_ids = { old: oldData.agent_ids, new: newData.agent_ids };
  }

  // --- 9. JUNCTION: FEATURES ---
  const featureDiff = calculateCollectionDiff(
    oldData.feature_ids || [], 
    newData.feature_ids || [], 
    context.allFeatures || []
  );
  if (featureDiff.hasChanges) {
    diff.changed_fields.push("feature_ids");
    if (featureDiff.added.length) diff.summary.push(isEn ? `Added Features: ${featureDiff.added.join(", ")}` : `เพิ่มฟีเจอร์: ${featureDiff.added.join(", ")}`);
    if (featureDiff.removed.length) diff.summary.push(isEn ? `Removed Features: ${featureDiff.removed.join(", ")}` : `ถอดฟีเจอร์: ${featureDiff.removed.join(", ")}`);
    diff.details.feature_ids = { old: oldData.feature_ids, new: newData.feature_ids };
  }

  return diff;
}

/**
 * Formats currency differences (e.g., 1000000 -> 1.0M)
 */
export function formatCurrencyDiff(val: unknown): string {
  if (val === null || val === undefined) return "N/A";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  
  if (num >= 1000000) return `฿${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `฿${(num / 1000).toFixed(0)}k`;
  return `฿${num}`;
}

/**
 * Calculates differences in ID collections and returns labels
 * Standardizes inputs by sorting and stringifying to prevent false positives from order changes
 */
export function calculateCollectionDiff(
  oldIds: unknown[],
  newIds: unknown[],
  labels: { id: string; label: string }[]
) {
  // Normalize: Convert all to sorted unique strings
  const normalize = (arr: any[]) => 
    Array.from(new Set((arr || []).map(id => String(id))))
    .sort();

  const normalizedOld = normalize(oldIds);
  const normalizedNew = normalize(newIds);
  
  const addedIds = normalizedNew.filter(id => !normalizedOld.includes(id));
  const removedIds = normalizedOld.filter(id => !normalizedNew.includes(id));
  
  const getLabel = (id: string) => {
    const found = labels.find(l => l.id === id);
    if (found) return found.label;
    // Fallback if label missing
    return `ID:${id.slice(0, 8)}`;
  };

  return {
    hasChanges: addedIds.length > 0 || removedIds.length > 0,
    added: addedIds.map(getLabel),
    removed: removedIds.map(getLabel)
  };
}
