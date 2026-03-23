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
  OFFICE_BUILDING: "อาคารสำนักงาน/ออฟฟิศ",
  WAREHOUSE: "โกดัง",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  VILLA: "วิลล่า",
  POOL_VILLA: "พูลวิลล่า",
  OTHER: "อื่น ๆ",
} satisfies Record<PropertyType, string>;

export const LISTING_TYPE_LABELS = {
  SALE: "ขาย",
  RENT: "เช่า",
  SALE_AND_RENT: "ขาย/เช่า",
} satisfies Record<ListingType, string>;

export const PROPERTY_STATUS_LABELS = {
  DRAFT: "ร่าง",
  ACTIVE: "ใช้งาน (แสดงหน้าเว็บ)",
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
  "VILLA",
  "POOL_VILLA",
  "OFFICE_BUILDING",
  "TOWNHOME",
  "LAND",
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

/** === STATUS STYLES === */
export const PROPERTY_STATUS_STYLES: Record<
  PropertyStatus,
  { dot: string; bg: string; border: string; text: string }
> = {
  DRAFT: {
    dot: "bg-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
  },
  ACTIVE: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  UNDER_OFFER: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  RESERVED: {
    dot: "bg-purple-500",
    bg: "bg-purple-50 text-purple-700",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  SOLD: {
    dot: "bg-rose-500",
    bg: "bg-rose-50 text-rose-700",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  RENTED: {
    dot: "bg-sky-500",
    bg: "bg-sky-50 text-sky-700",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  ARCHIVED: {
    dot: "bg-slate-600",
    bg: "bg-slate-100 text-slate-700",
    border: "border-slate-300",
    text: "text-slate-700",
  },
};

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
  "พระราม 9",
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
  "MRT3",
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
  MRT3: "รถไฟฟ้า (สายสีเหลือง)",
  OTHER: "อื่นๆ",
};

export const TRANSIT_TYPE_STYLES: Record<
  TransitType,
  { bg: string; text: string; icon: string }
> = {
  BTS: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" },
  MRT: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  MRT2: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: "text-purple-500",
  },
  ARL: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  SRT: { bg: "bg-rose-50", text: "text-rose-700", icon: "text-rose-500" },
  SRT2: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: "text-orange-500",
  },
  SRT3: { bg: "bg-pink-50", text: "text-pink-700", icon: "text-pink-500" },
  MRT3: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-500" },
  OTHER: { bg: "bg-slate-50", text: "text-slate-700", icon: "text-slate-500" },
};

export const PROPERTY_TYPE_GRADIENTS = {
  HOUSE: "from-purple-500 to-purple-600",
  CONDO: "from-blue-500 to-blue-600",
  TOWNHOME: "from-orange-500 to-orange-600",
  LAND: "from-green-500 to-green-600",
  OFFICE_BUILDING: "from-sky-500 to-sky-600",
  WAREHOUSE: "from-yellow-500 to-yellow-600",
  COMMERCIAL_BUILDING: "from-indigo-500 to-indigo-600",
  VILLA: "from-rose-500 to-rose-600",
  POOL_VILLA: "from-cyan-500 to-blue-600",
  OTHER: "from-slate-500 to-slate-600",
} satisfies Record<PropertyType, string>;

// Icons
import {
  Home,
  Building2,
  Hotel,
  Map,
  Briefcase,
  Warehouse,
  Store,
  Waves,
  Palmtree,
  MoreHorizontal,
} from "lucide-react";

export const PROPERTY_TYPE_ICONS = {
  HOUSE: Home,
  CONDO: Building2,
  TOWNHOME: Hotel,
  LAND: Map,
  OFFICE_BUILDING: Briefcase,
  WAREHOUSE: Warehouse,
  COMMERCIAL_BUILDING: Store,
  VILLA: Palmtree,
  POOL_VILLA: Waves,
  OTHER: MoreHorizontal,
} as const;

export const NEARBY_PLACE_CATEGORIES = [
  { value: "School", label: "โรงเรียน / มหาวิทยาลัย" },
  { value: "Mall", label: "ห้างสรรพสินค้า / ตลาด" },
  { value: "Hospital", label: "โรงพยาบาล" },
  { value: "Transport", label: "ทางด่วน" },
  { value: "Park", label: "สวนสาธารณะ" },
  { value: "Office", label: "สถานที่ทำงาน" },
  { value: "Other", label: "อื่นๆ" },
] as const;
