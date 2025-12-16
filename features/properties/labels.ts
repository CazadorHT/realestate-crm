import type { Database } from "@/lib/database.types";

/** === ENUM TYPES จาก DB === */
export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

/** === THAI LABELS (Type-safe: บังคับให้ครบทุกค่า) === */
export const PROPERTY_TYPE_LABELS = {
  HOUSE: "บ้านเดี่ยว",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  OTHER: "อื่น ๆ",
  OFFICE_BUILDING: "อาคารสำนักงาน",
  WAREHOUSE: "โกดัง",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
} satisfies Record<PropertyType, string>;

export const LISTING_TYPE_LABELS = {
  SALE: "ขาย",
  RENT: "เช่า",
  SALE_AND_RENT: "ขาย/เช่า",
} satisfies Record<ListingType, string>;

export const PROPERTY_STATUS_LABELS = {
  DRAFT: "ร่าง",
  ACTIVE: "ใช้งาน",
  ARCHIVED: "เก็บถาวร",
  UNDER_OFFER: "ติดจอง/มีข้อเสนอ",
  RESERVED: "จองแล้ว",
  SOLD: "ขายแล้ว",
  RENTED: "เช่าแล้ว",
} satisfies Record<PropertyStatus, string>;

/** === ORDER (ตาม sort_order ที่คุณกำหนด) === */
export const PROPERTY_TYPE_ORDER: PropertyType[] = [
  "HOUSE",
  "CONDO",
  "TOWNHOME",
  "LAND",
  "OTHER",
  "OFFICE_BUILDING",
  "WAREHOUSE",
  "COMMERCIAL_BUILDING",
];

export const LISTING_TYPE_ORDER: ListingType[] = [
  "SALE",
  "RENT",
  "SALE_AND_RENT",
];

export const PROPERTY_STATUS_ORDER: PropertyStatus[] = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
  "UNDER_OFFER",
  "RESERVED",
  "SOLD",
  "RENTED",
];

/** helpers (ใช้สะดวก + type-safe) */
export function propertyTypeLabel(v: PropertyType) {
  return PROPERTY_TYPE_LABELS[v];
}
export function listingTypeLabel(v: ListingType) {
  return LISTING_TYPE_LABELS[v];
}
export function propertyStatusLabel(v: PropertyStatus) {
  return PROPERTY_STATUS_LABELS[v];
}

/** fallback เผื่อเจอ string แปลก/ข้อมูลเก่า/null */
export function safeEnumLabel(map: Record<string, string>, v: any) {
  if (!v) return "-";
  return map[v] ?? String(v);
}
