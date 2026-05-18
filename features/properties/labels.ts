import type { Database } from "@/lib/database.types.generated";
import {
  Home,
  Building2,
  Hotel,
  Map as MapIcon,
  Briefcase,
  Warehouse,
  Store,
  Waves,
  Palmtree,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

/** === ENUM TYPES === */
export type PropertyRow = Database["public"]["Tables"]["properties_core"]["Row"];
export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOME" | "LAND" | "COMMERCIAL_BUILDING" | "WAREHOUSE" | "OFFICE_BUILDING" | "VILLA" | "POOL_VILLA" | "OTHER";
export type ListingType = "SALE" | "RENT" | "SALE_AND_RENT";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED";

type MultiLangLabel = { th: string; en: string; cn: string; ru: string };

/** 
 * === MASTER CONFIGURATION ===
 * Unified source for UI, Logic, and DB
 */
export const PROPERTY_TYPE_CONFIG: Record<PropertyType, {
  label: MultiLangLabel;
  dbValue: number;
  icon: LucideIcon;
  gradient: string;
  order: number;
}> = {
  HOUSE: {
    label: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅", ru: "Дом" },
    dbValue: 2,
    icon: Home,
    gradient: "from-purple-500 to-purple-600",
    order: 1
  },
  CONDO: {
    label: { th: "คอนโด", en: "Condo", cn: "公寓", ru: "Конโด" },
    dbValue: 1,
    icon: Building2,
    gradient: "from-blue-500 to-blue-600",
    order: 2
  },
  VILLA: {
    label: { th: "วิลล่า", en: "Villa", cn: "别墅", ru: "Вилла" },
    dbValue: 8,
    icon: Palmtree,
    gradient: "from-rose-500 to-rose-600",
    order: 3
  },
  POOL_VILLA: {
    label: { th: "พูลวิลล่า", en: "Pool Villa", cn: "带泳池别墅", ru: "Вилла с бассейном" },
    dbValue: 9,
    icon: Waves,
    gradient: "from-cyan-500 to-blue-600",
    order: 4
  },
  OFFICE_BUILDING: {
    label: { th: "ออฟฟิศ", en: "Office", cn: "写字楼", ru: "Офис" },
    dbValue: 7,
    icon: Briefcase,
    gradient: "from-sky-500 to-sky-600",
    order: 5
  },
  TOWNHOME: {
    label: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
    dbValue: 3,
    icon: Hotel,
    gradient: "from-orange-500 to-orange-600",
    order: 6
  },
  LAND: {
    label: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" },
    dbValue: 4,
    icon: MapIcon,
    gradient: "from-green-500 to-green-600",
    order: 7
  },
  WAREHOUSE: {
    label: { th: "โกดัง", en: "Warehouse", cn: "仓库", ru: "Склад" },
    dbValue: 6,
    icon: Warehouse,
    gradient: "from-yellow-500 to-yellow-600",
    order: 8
  },
  COMMERCIAL_BUILDING: {
    label: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商铺", ru: "Коммерция" },
    dbValue: 5,
    icon: Store,
    gradient: "from-indigo-500 to-indigo-600",
    order: 9
  },
  OTHER: {
    label: { th: "อื่นๆ", en: "Other", cn: "其他", ru: "Другое" },
    dbValue: 10,
    icon: MoreHorizontal,
    gradient: "from-slate-500 to-slate-600",
    order: 10
  }
};

/** 
 * === STATIC DB MAPPING (ZERO RUNTIME COST) ===
 */
export const PROPERTY_TYPE_DB_VALUE: Record<PropertyType, number> = {
  CONDO: 1, HOUSE: 2, TOWNHOME: 3, LAND: 4, COMMERCIAL_BUILDING: 5, WAREHOUSE: 6, OFFICE_BUILDING: 7, VILLA: 8, POOL_VILLA: 9, OTHER: 10
};

export const LISTING_TYPE_DB_VALUE: Record<ListingType, number> = {
  SALE: 0, RENT: 1, SALE_AND_RENT: 2
};

export const PROPERTY_STATUS_DB_VALUE: Record<PropertyStatus, number> = {
  DRAFT: 0,
  ACTIVE: 1,
  UNDER_OFFER: 2,
  RESERVED: 3,
  SOLD: 4,
  RENTED: 5,
  ARCHIVED: 6,
};

/** === REVERSE MAPPING (O(1)) === */
export const getStatusFromDb = (v: number | null): PropertyStatus => {
  if (v === 0) return "DRAFT";
  if (v === 1) return "ACTIVE";
  if (v === 2) return "UNDER_OFFER";
  if (v === 3) return "RESERVED";
  if (v === 4) return "SOLD";
  if (v === 5) return "RENTED";
  if (v === 6) return "ARCHIVED";
  return "DRAFT";
};

export const getPropertyTypeFromDb = (v: number | null): PropertyType => {
  const map: Record<number, PropertyType> = { 1: "CONDO", 2: "HOUSE", 3: "TOWNHOME", 4: "LAND", 5: "COMMERCIAL_BUILDING", 6: "WAREHOUSE", 7: "OFFICE_BUILDING", 8: "VILLA", 9: "POOL_VILLA", 10: "OTHER" };
  return map[v || 1] || "CONDO";
};

export const getListingTypeFromDb = (v: number | null): ListingType => (v === 1 ? "RENT" : v === 2 ? "SALE_AND_RENT" : "SALE");

/** === UI ORDERING (ZOD COMPATIBLE) === */
export const PROPERTY_TYPE_ORDER = ["HOUSE", "CONDO", "VILLA", "POOL_VILLA", "OFFICE_BUILDING", "TOWNHOME", "LAND", "WAREHOUSE", "COMMERCIAL_BUILDING", "OTHER"] as const satisfies readonly [PropertyType, ...PropertyType[]];
export const LISTING_TYPE_ORDER = ["SALE", "RENT", "SALE_AND_RENT"] as const satisfies readonly [ListingType, ...ListingType[]];
export const PROPERTY_STATUS_ORDER = ["DRAFT", "ACTIVE", "ARCHIVED", "UNDER_OFFER", "RESERVED", "SOLD", "RENTED"] as const satisfies readonly [PropertyStatus, ...PropertyStatus[]];

export const PROPERTY_TYPE_ENUM = PROPERTY_TYPE_ORDER;
export const LISTING_TYPE_ENUM = LISTING_TYPE_ORDER;
export const PROPERTY_STATUS_ENUM = PROPERTY_STATUS_ORDER;

/** === LEGACY COMPATIBILITY === */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, MultiLangLabel> = {
  HOUSE: { th: "บ้านเดี่ยว", en: "House", cn: "独栋别墅", ru: "Дом" },
  CONDO: { th: "คอนโด", en: "Condo", cn: "公寓", ru: "Конโด" },
  VILLA: { th: "วิลล่า", en: "Villa", cn: "别墅", ru: "Вилла" },
  POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "带泳池别墅", ru: "Вилла с бассейном" },
  OFFICE_BUILDING: { th: "ออฟฟิศ", en: "Office", cn: "写字楼", ru: "Офис" },
  TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
  LAND: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" },
  WAREHOUSE: { th: "โกดัง", en: "Warehouse", cn: "仓库", ru: "Склад" },
  COMMERCIAL_BUILDING: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商铺", ru: "Коммерция" },
  OTHER: { th: "อื่นๆ", en: "Other", cn: "其他", ru: "Другое" }
};

export const LISTING_TYPE_LABELS: Record<ListingType, MultiLangLabel> = {
  SALE: { th: "ขาย", en: "Sale", cn: "出售", ru: "Продажа" },
  RENT: { th: "เช่า", en: "Rent", cn: "出租", ru: "Аренда" },
  SALE_AND_RENT: { th: "ขาย/เช่า", en: "Sale/Rent", cn: "出售/出租", ru: "Продажа/Аренда" }
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, MultiLangLabel> = {
  DRAFT: { th: "ร่าง", en: "Draft", cn: "草稿", ru: "Черновик" },
  ACTIVE: { th: "ใช้งาน", en: "Active", cn: "发布中", ru: "Активно" },
  ARCHIVED: { th: "เก็บถาวร", en: "Archived", cn: "已归档", ru: "В архиве" },
  UNDER_OFFER: { th: "ติดจอง", en: "Under Offer", cn: "预订中", ru: "Под предложением" },
  RESERVED: { th: "จองแล้ว", en: "Reserved", cn: "已预订", ru: "Забронировано" },
  SOLD: { th: "ขายแล้ว", en: "Sold", cn: "已售出", ru: "Продано" },
  RENTED: { th: "เช่าแล้ว", en: "Rented", cn: "已出租", ru: "Сдано" }
};

export const PROPERTY_TYPE_ICONS: Record<PropertyType, LucideIcon> = { HOUSE: Home, CONDO: Building2, VILLA: Palmtree, POOL_VILLA: Waves, OFFICE_BUILDING: Briefcase, TOWNHOME: Hotel, LAND: MapIcon, WAREHOUSE: Warehouse, COMMERCIAL_BUILDING: Store, OTHER: MoreHorizontal };
export const PROPERTY_TYPE_GRADIENTS: Record<PropertyType, string> = { HOUSE: "from-purple-500 to-purple-600", CONDO: "from-blue-500 to-blue-600", VILLA: "from-rose-500 to-rose-600", POOL_VILLA: "from-cyan-500 to-blue-600", OFFICE_BUILDING: "from-sky-500 to-sky-600", TOWNHOME: "from-orange-500 to-orange-600", LAND: "from-green-500 to-green-600", WAREHOUSE: "from-yellow-500 to-yellow-600", COMMERCIAL_BUILDING: "from-indigo-500 to-indigo-600", OTHER: "from-slate-500 to-slate-600" };

interface StatusStyle {
  dot: string;
  bg: string;
  hover: string;
  border: string;
  text: string;
}

export const PROPERTY_STATUS_STYLES: Record<PropertyStatus, StatusStyle> = {
  DRAFT: { dot: "bg-slate-400", bg: "bg-slate-50", hover: "hover:bg-slate-100", border: "border-slate-200", text: "text-slate-600" },
  ACTIVE: { dot: "bg-emerald-500", bg: "bg-emerald-50", hover: "hover:bg-emerald-100", border: "border-emerald-200", text: "text-emerald-700" },
  RESERVED: { dot: "bg-purple-500", bg: "bg-purple-50", hover: "hover:bg-purple-100", border: "border-purple-200", text: "text-purple-700" },
  UNDER_OFFER: { dot: "bg-amber-500", bg: "bg-amber-50", hover: "hover:bg-amber-100", border: "border-amber-200", text: "text-amber-700" },
  RENTED: { dot: "bg-sky-500", bg: "bg-sky-50", hover: "hover:bg-sky-100", border: "border-sky-200", text: "text-sky-700" },
  SOLD: { dot: "bg-rose-500", bg: "bg-rose-50", hover: "hover:bg-rose-100", border: "border-rose-200", text: "text-rose-700" },
  ARCHIVED: { dot: "bg-slate-600", bg: "bg-slate-100", hover: "hover:bg-slate-200", border: "border-slate-300", text: "text-slate-700" }
};

/** Helpers */
export const propertyTypeLabel = (v: PropertyType, lang: keyof MultiLangLabel = "th") => PROPERTY_TYPE_CONFIG[v]?.label[lang] || v;
export const propertyStatusLabel = (v: PropertyStatus, lang: keyof MultiLangLabel = "th"): string => PROPERTY_STATUS_LABELS[v]?.[lang] || v;
export const listingTypeLabel = (v: ListingType, lang: keyof MultiLangLabel = "th") => LISTING_TYPE_LABELS[v]?.[lang] || v;
export const safeEnumLabel = (map: Record<string, string>, v: string | null | undefined) => v ? (map[v] ?? String(v)) : "-";

/** === TRANSIT LABELS (NOW DYNAMIC IN V3) === 
 * These are kept for legacy styles, but the list is now fetched from `ref_master_data`
 */
export const TRANSIT_TYPE_ENUM = ["BTS", "MRT", "MRT2", "ARL", "SRT", "SRT2", "SRT3", "MRT3", "OTHER"] as const;
export type TransitType = (typeof TRANSIT_TYPE_ENUM)[number];

export const TRANSIT_TYPE_LABELS: Record<TransitType, MultiLangLabel> = {
  BTS: { th: "รถไฟฟ้า BTS", en: "BTS Skytrain", cn: "曼谷大众运输系统 (BTS)", ru: "Надземное метро BTS" },
  MRT: { th: "รถไฟฟ้า MRT (สายสีน้ำเงิน)", en: "MRT Blue Line", cn: "曼谷地铁 (MRT)", ru: "Метро MRT" },
  MRT2: { th: "รถไฟฟ้า (สายสีม่วง)", en: "MRT Purple Line", cn: "地铁紫线", ru: "Фиолетовая линия MRT" },
  ARL: { th: "Airport Rail Link", en: "Airport Rail Link", cn: "机场快铁 (ARL)", ru: "Аэроэкспресс ARL" },
  SRT: { th: "รถไฟฟ้า (สายสีแดง)", en: "SRT Red Line", cn: "曼谷通勤铁路红线", ru: "Красная линия SRT" },
  SRT2: { th: "รถไฟฟ้า (สายสีส้ม)", en: "SRT Orange Line", cn: "地铁橙线", ru: "Оранжевая линия SRT" },
  SRT3: { th: "รถไฟฟ้า (สายสีชมพู)", en: "SRT Pink Line", cn: "地铁粉线", ru: "Розовая линия SRT" },
  MRT3: { th: "รถไฟฟ้า (สายสีเหลือง)", en: "MRT Yellow Line", cn: "地铁黄线", ru: "Желтая линия MRT" },
  OTHER: { th: "อื่นๆ", en: "Other", cn: "其他", ru: "Другое" }
};

export const TRANSIT_TYPE_STYLES: Record<TransitType, { bg: string; text: string; icon: string }> = {
  BTS: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" },
  MRT: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
  MRT2: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
  ARL: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  SRT: { bg: "bg-rose-50", text: "text-rose-700", icon: "text-rose-500" },
  SRT2: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-500" },
  SRT3: { bg: "bg-pink-50", text: "text-pink-700", icon: "text-pink-500" },
  MRT3: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-500" },
  OTHER: { bg: "bg-slate-50", text: "text-slate-700", icon: "text-slate-500" },
};

export const NEARBY_PLACE_CATEGORIES = [
  { value: "School", label: "โรงเรียน / มหาวิทยาลัย" }, { value: "Mall", label: "ห้างสรรพสินค้า / ตลาด" }, { value: "Hospital", label: "โรงพยาบาล" }, { value: "Transport", label: "ทางด่วน" }, { value: "Park", label: "สวนสาธารณะ" }, { value: "Office", label: "สถานที่ทำงาน" }, { value: "Other", label: "อื่นๆ" }
] as const;

export const POPULAR_AREAS = [
  "อ่อนนุช", "บางนา", "ลาดพร้าว", "พระราม 9", "สุขุมวิท", "อารีย์", "ทองหล่อ", "เอกมัย", "สยาม", "รัชดา", "ปิ่นเกล้า", "นนทบุรี", "รามอินทรา", "สาทร", "สีลม", "พญาไท", "ราชเทวี", "สะพานควาย", "พหลโยธิน", "เจริญกรุง", "พัฒนาการ", "ศรีนครินทร์", "เพชรบุรี", "พร้อมพงษ์", "นานา", "อโศก"
] as const;
