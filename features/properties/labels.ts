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

/** === POPULAR AREAS (ย่านยอดนิยม) === */
export const POPULAR_AREAS = [
  "อ่อนนุช",
  "บางนา",
  "ลาดพร้าว",
  "พระราม9",
  "สุขุมวิท",
  "อารีย์",
  "ทองหล่อ",
  "เอกมัย",
  "สยาม",
  "รัชดา",
  "ปิ่นเกล้า",
  "นนทบุรี",
  "รามอินทรา",
  "สาทร",
  "สีลม",
  "พญาไท",
  "ราชเทวี",
  "สะพานควาย",
  "พหลโยธิน",
  "เจริญกรุง",
  "พัฒนาการ",
  "ศรีนครินทร์",
  "เพชรบุรี",
  "พร้อมพงษ์",
  "นานา",
  "อโศก",
] as const;

/** === TRANSIT TYPES === */
export const TRANSIT_TYPE_ENUM = [
  "BTS",
  "MRT",
  "MRT2",
  "ARL",
  "SRT",
  "SRT2",
  "SRT3",
  "OTHER",
] as const;
export type TransitType = (typeof TRANSIT_TYPE_ENUM)[number];

export const TRANSIT_TYPE_LABELS: Record<TransitType, string> = {
  BTS: "BTS",
  MRT: "MRT",
  ARL: "Airport Rail Link",
  SRT: "รถไฟฟ้า (สายสีแดง)",
  SRT2: "รถไฟฟ้า (สายสีส้ม)",
  SRT3: "รถไฟฟ้า (สายสีชมพู)",
  MRT2: "รถไฟฟ้า (สายสีม่วง)",

  OTHER: "อื่นๆ",
};

export const PROPERTY_TYPE_GRADIENTS = {
  HOUSE: "from-purple-500 to-purple-600",
  CONDO: "from-blue-500 to-blue-600",
  TOWNHOME: "from-orange-500 to-orange-600",
  LAND: "from-green-500 to-green-600",
  OFFICE_BUILDING: "from-sky-500 to-sky-600",
  WAREHOUSE: "from-yellow-500 to-yellow-600",
  COMMERCIAL_BUILDING: "from-indigo-500 to-indigo-600",
  OTHER: "from-slate-500 to-slate-600",
} satisfies Record<PropertyType, string>;

export const NEARBY_PLACE_CATEGORIES = [
  { value: "School", label: "โรงเรียน / มหาวิทยาลัย" },
  { value: "Mall", label: "ห้างสรรพสินค้า / ตลาด" },
  { value: "Hospital", label: "โรงพยาบาล" },
  { value: "Transport", label: "ขนส่งสาธารณะ (BTS/MRT/ทางด่วน)" },
  { value: "Park", label: "สวนสาธารณะ" },
  { value: "Office", label: "สถานที่ทำงาน" },
  { value: "Other", label: "อื่นๆ" },
] as const;
