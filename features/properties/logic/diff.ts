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
  details: Record<string, { old: any; new: any }>;
  image_changes?: { added: string[]; removed: string[] };
  word_counts?: Record<string, { old: number; new: number; delta: number }>;
  oldState: any;
  newState: any;
}

export function getPropertyDiff(
  oldData: Partial<PropertyFormValues>,
  newData: Partial<PropertyFormValues>,
  context: {
    allAgents?: { id: string; full_name: string }[];
    allFeatures?: { id: string; label: string }[];
  } = {}
): PropertyDiffResult {
  const diff: PropertyDiffResult = {
    changed_fields: [],
    summary: [],
    details: {},
    oldState: oldData,
    newState: newData,
  };

  const trackField = (
    key: keyof PropertyFormValues, 
    label: string, 
    formatter?: (v: any) => string,
    isLongText: boolean = false
  ) => {
    const oldVal = (oldData as any)[key];
    const newVal = (newData as any)[key];

    // Loose equality check for numeric strings vs numbers
    if (oldVal != newVal) {
      diff.changed_fields.push(key);
      const oldFormatted = formatter ? formatter(oldVal) : String(oldVal ?? "N/A");
      const newFormatted = formatter ? formatter(newVal) : String(newVal ?? "N/A");
      
      let summaryText = `${label}: ${oldFormatted} → ${newFormatted}`;
      
      if (isLongText && oldVal && newVal) {
        const oldWords = String(oldVal).split(/\s+/).filter(Boolean).length;
        const newWords = String(newVal).split(/\s+/).filter(Boolean).length;
        const delta = newWords - oldWords;
        const deltaText = delta >= 0 ? `(+${delta} words)` : `(${delta} words)`;
        summaryText = `${label}: แก้ไขเนื้อหา ${deltaText}`;
        
        if (!diff.word_counts) diff.word_counts = {};
        diff.word_counts[key] = { old: oldWords, new: newWords, delta };
      }

      diff.summary.push(summaryText);
      diff.details[key] = { old: oldVal, new: newVal };
    }
  };

  // Helper for Enum Localization
  const enumFormatter = (labels: Record<string, string>) => (val: any) => labels[val] || String(val ?? "N/A");

  // --- 1. CORE FIELDS ---
  trackField("price", "ราคาขายปัจจุบัน", formatCurrencyDiff);
  trackField("original_price", "ราคาตั้งขาย", formatCurrencyDiff);
  trackField("rental_price", "ราคาเช่าปัจจุบัน", formatCurrencyDiff);
  trackField("original_rental_price", "ราคาตั้งเช่า", formatCurrencyDiff);
  trackField("status", "สถานะ", enumFormatter(PROPERTY_STATUS_LABELS));
  trackField("listing_type", "ประเภทประกาศ", enumFormatter(LISTING_TYPE_LABELS));
  trackField("property_type", "ประเภททรัพย์", enumFormatter(PROPERTY_TYPE_LABELS));
  trackField("title", "ชื่อทรัพย์");
  trackField("title_en", "ชื่อทรัพย์ (EN)");
  
  // --- 2. DESCRIPTIONS (Long Text) ---
  trackField("description", "รายละเอียดทรัพย์", undefined, true);
  trackField("description_en", "รายละเอียดทรัพย์ (EN)", undefined, true);

  // --- 3. OWNERSHIP & FINANCIALS ---
  trackField("owner_id", "เจ้าของทรัพย์ (Owner)");
  trackField("assigned_to", "เอเจนท์ผู้ดูแลหลัก");
  trackField("commission_sale_percentage", "ค่าคอมมิชชั่นการขาย (%)");
  trackField("commission_rent_months", "ค่าคอมมิชชั่นการเช่า (เดือน)");
  trackField("maintenance_fee", "ค่าส่วนกลาง");
  trackField("total_units", "จำนวนยูนิตทั้งหมด");
  trackField("sold_units", "จำนวนที่ขายแล้ว");

  // --- 4. PHYSICAL SPECS ---
  trackField("bedrooms", "ห้องนอน");
  trackField("bathrooms", "ห้องน้ำ");
  trackField("size_sqm", "พื้นที่ใช้สอย (ตร.ม.)");
  trackField("land_size_sqwah", "พื้นที่ดิน (ตร.ว.)");
  trackField("floor", "ชั้น");
  trackField("orientation", "ทิศทาง");
  trackField("parking_slots", "ที่จอดรถ");

  // --- 5. LOCATION ---
  trackField("address_line1", "ที่อยู่/โครงการ");
  trackField("google_maps_link", "ลิงก์แผนที่");
  trackField("province", "จังหวัด");
  trackField("district", "เขต/อำเภอ");

  // --- 6. BOOLEAN FLAGS (TAGS) ---
  const booleanFields: (keyof PropertyFormValues)[] = [
    "is_exclusive", "is_pet_friendly", "is_fully_furnished", "is_renovated", 
    "verified", "requires_ai_review", "is_co_agent", "has_private_pool",
    "is_selling_with_tenant", "is_bare_shell", "has_garden_view", "has_pool_view",
    "has_city_view", "has_river_view", "is_cbd", "is_smart_home"
  ];
  booleanFields.forEach(f => trackField(f, String(f), (v) => v ? "ใช่" : "ไม่ใช่"));

  // --- 7. JUNCTION: IMAGES (Visual Tracking) ---
  const oldImgs = oldData.images || [];
  const newImgs = newData.images || [];
  if (JSON.stringify(oldImgs) !== JSON.stringify(newImgs)) {
    const added = newImgs.filter(url => !oldImgs.includes(url));
    const removed = oldImgs.filter(url => !newImgs.includes(url));
    
    if (added.length > 0 || removed.length > 0) {
      diff.changed_fields.push("images");
      diff.image_changes = { added, removed };
      
      let imgSum = "รูปภาพ: ";
      if (added.length) imgSum += `เพิ่ม ${added.length} รูป `;
      if (removed.length) imgSum += `ลบ ${removed.length} รูป`;
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
    if (agentDiff.added.length) diff.summary.push(`เพิ่มเอเจนท์: ${agentDiff.added.join(", ")}`);
    if (agentDiff.removed.length) diff.summary.push(`ถอดเอเจนท์: ${agentDiff.removed.join(", ")}`);
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
    if (featureDiff.added.length) diff.summary.push(`เพิ่มฟีเจอร์: ${featureDiff.added.join(", ")}`);
    if (featureDiff.removed.length) diff.summary.push(`ถอดฟีเจอร์: ${featureDiff.removed.join(", ")}`);
    diff.details.feature_ids = { old: oldData.feature_ids, new: newData.feature_ids };
  }

  return diff;
}

/**
 * Formats currency differences (e.g., 1000000 -> 1.0M)
 */
export function formatCurrencyDiff(val: any): string {
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
  oldIds: (string | any)[],
  newIds: (string | any)[],
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
