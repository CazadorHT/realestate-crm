import type { Database } from "@/lib/database.types";

/** === ENUM TYPES จาก DB === */
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

/** === THAI LABELS (Type-safe: บังคับให้ครบทุกค่า) === */
export const PROPERTY_TYPE_LABELS = {
  HOUSE: "บ้านเดี่ยว",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  OFFICE_BUILDING: "อาคารสำนักงาน",
  WAREHOUSE: "โกดัง",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  OTHER: "อื่น ๆ",
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

/** === ORDER (ต้องเป็น tuple non-empty เพื่อใช้กับ z.enum ได้) === */
export const PROPERTY_TYPE_ORDER = [
  "HOUSE",
  "CONDO",
  "TOWNHOME",
  "LAND",
  "OFFICE_BUILDING",
  "WAREHOUSE",
  "COMMERCIAL_BUILDING",
  "OTHER",
] as const satisfies readonly [PropertyType, ...PropertyType[]];

export const LISTING_TYPE_ORDER = [
  "SALE",
  "RENT",
  "SALE_AND_RENT",
] as const satisfies readonly [ListingType, ...ListingType[]];

export const PROPERTY_STATUS_ORDER = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
  "UNDER_OFFER",
  "RESERVED",
  "SOLD",
  "RENTED",
] as const satisfies readonly [PropertyStatus, ...PropertyStatus[]];

/** ✅ ใช้กับ z.enum ได้ทันที */
export const PROPERTY_TYPE_ENUM = PROPERTY_TYPE_ORDER;
export const LISTING_TYPE_ENUM = LISTING_TYPE_ORDER;
export const PROPERTY_STATUS_ENUM = PROPERTY_STATUS_ORDER;

/** helpers */
export function propertyTypeLabel(v: PropertyType) {
  return PROPERTY_TYPE_LABELS[v];
}
export function listingTypeLabel(v: ListingType) {
  return LISTING_TYPE_LABELS[v];
}
export function propertyStatusLabel(v: PropertyStatus) {
  return PROPERTY_STATUS_LABELS[v];
}
export function safeEnumLabel(map: Record<string, string>, v: any) {
  if (!v) return "-";
  return map[v] ?? String(v);
}
