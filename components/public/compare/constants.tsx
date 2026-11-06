import {
  ShieldCheck,
  Tag,
  Home,
  Maximize,
  Coins,
  MapPin,
  Map,
  Train,
  BedDouble,
  Bath,
  Layers,
  Car,
  PawPrint,
  LayoutGrid,
  FileText,
  Clock,
  Sparkles,
  Compass,
  ArrowUpToLine,
  Sofa,
  Globe2,
  CalendarDays,
  FileCheck2,
  Receipt,
} from "lucide-react";
import { FaAirbnb } from "react-icons/fa6";
import { ComparisonRow } from "./types";

export interface ComparisonSection {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: any;
  rows: ComparisonRow[];
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  // Location & Transit
  { key: "transportation", label: "รถไฟฟ้าที่ใกล้ที่สุด", icon: Train },
  { key: "google_maps_link", label: "ตำแหน่งบนแผนที่ (Google Maps)", icon: MapPin },
  { key: "nearby_places", label: "สถานที่ใกล้เคียง (ห้าง/รพ./รร.)", icon: MapPin },
  { key: "zone", label: "โซน / ย่าน", icon: MapPin },
  { key: "location", label: "ที่อยู่ทำเลที่ตั้ง", icon: Map },
  { key: "province", label: "จังหวัด", icon: Map },

  // Pricing & Terms (Step 2)
  { key: "price", label: "ราคาขาย / ค่าเช่า", icon: Coins },
  { key: "price_per_sqm", label: "ราคาเฉลี่ยต่อ ตร.ม.", icon: Coins },
  { key: "min_contract_months", label: "สัญญาเช่าขั้นต่ำ", icon: CalendarDays },
  { key: "deposit_advance", label: "เงื่อนไขเงินประกัน / ล่วงหน้า", icon: FileCheck2 },
  { key: "common_fee", label: "ค่าส่วนกลาง", icon: Receipt },
  { key: "listing_type", label: "ประเภทประกาศ", icon: Tag },
  { key: "property_type", label: "ประเภทอสังหาฯ", icon: Home },
  { key: "verified", label: "สถานะการตรวจสอบ", icon: ShieldCheck },

  // Specs & Layout (Step 2)
  { key: "property_size", label: "พื้นที่ใช้สอย (ตร.ม.)", icon: Maximize },
  { key: "land_size_sqwah", label: "ขนาดที่ดิน (ตร.วา / ไร่)", icon: Maximize },
  { key: "bedrooms", label: "ห้องนอน", icon: BedDouble },
  { key: "bathrooms", label: "ห้องน้ำ", icon: Bath },
  { key: "floor", label: "ชั้น", icon: Layers },
  { key: "parking_slots", label: "ที่จอดรถ (คัน)", icon: Car },
  { key: "ceiling_height", label: "ความสูงเพดาน (ม.)", icon: ArrowUpToLine },
  { key: "direction", label: "ทิศทางระเบียง / หน้าบ้าน", icon: Compass },
  { key: "furnishing", label: "สถานะเฟอร์นิเจอร์", icon: Sofa },

  // Policies & Amenities (Step 2)
  { key: "petFriendly", label: "นโยบายสัตว์เลี้ยง (Pet Friendly)", icon: PawPrint },
  { key: "allow_airbnb", label: "ปล่อยเช่ารายวัน / Airbnb", icon: FaAirbnb },
  { key: "foreigner_quota", label: "โควต้าต่างชาติ (Foreigner Quota)", icon: Globe2 },
  { key: "features", label: "สิ่งอำนวยความสะดวก & ส่วนกลาง", icon: LayoutGrid },

  // Description
  { key: "description", label: "รายละเอียดทรัพย์", icon: FileText },
  { key: "updated_at", label: "อัปเดตล่าสุด", icon: Clock },
];

export const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    id: "transit_location",
    titleKey: "compare_page.sections.transit_location",
    defaultTitle: "ทำเลและการเดินทาง (LOCATION & TRANSIT)",
    icon: Train,
    rows: [
      { key: "transportation", label: "รถไฟฟ้าที่ใกล้ที่สุด", icon: Train },
      { key: "google_maps_link", label: "ตำแหน่งบนแผนที่ (Google Maps)", icon: MapPin },
      { key: "nearby_places", label: "สถานที่ใกล้เคียง (ห้าง/รพ./รร.)", icon: MapPin },
      { key: "zone", label: "โซน / ย่าน", icon: MapPin },
      { key: "location", label: "ที่อยู่ทำเลที่ตั้ง", icon: Map },
      { key: "province", label: "จังหวัด", icon: Map },
    ],
  },
  {
    id: "pricing_overview",
    titleKey: "compare_page.sections.pricing_overview",
    defaultTitle: "ราคาและเงื่อนไขสัญญา (PRICING & TERMS)",
    icon: Coins,
    rows: [
      { key: "price", label: "ราคาขาย / ค่าเช่า", icon: Coins },
      { key: "price_per_sqm", label: "ราคาเฉลี่ยต่อ ตร.ม.", icon: Coins },
      { key: "min_contract_months", label: "สัญญาเช่าขั้นต่ำ", icon: CalendarDays },
      { key: "deposit_advance", label: "เงื่อนไขเงินประกัน / ล่วงหน้า", icon: FileCheck2 },
      { key: "common_fee", label: "ค่าส่วนกลาง", icon: Receipt },
      { key: "listing_type", label: "ประเภทประกาศ", icon: Tag },
      { key: "property_type", label: "ประเภทอสังหาฯ", icon: Home },
      { key: "verified", label: "สถานะการตรวจสอบ", icon: ShieldCheck },
    ],
  },
  {
    id: "space_layout",
    titleKey: "compare_page.sections.space_layout",
    defaultTitle: "ขนาดและสเปกห้องพัก (SPACE & LAYOUT)",
    icon: Maximize,
    rows: [
      { key: "property_size", label: "พื้นที่ใช้สอย (ตร.ม.)", icon: Maximize },
      { key: "land_size_sqwah", label: "ขนาดที่ดิน (ตร.วา / ไร่)", icon: Maximize },
      { key: "bedrooms", label: "ห้องนอน", icon: BedDouble },
      { key: "bathrooms", label: "ห้องน้ำ", icon: Bath },
      { key: "floor", label: "ชั้น", icon: Layers },
      { key: "parking_slots", label: "ที่จอดรถ (คัน)", icon: Car },
      { key: "ceiling_height", label: "ความสูงเพดาน (ม.)", icon: ArrowUpToLine },
      { key: "direction", label: "ทิศทางระเบียง / หน้าบ้าน", icon: Compass },
      { key: "furnishing", label: "สถานะเฟอร์นิเจอร์", icon: Sofa },
    ],
  },
  {
    id: "amenities_policies",
    titleKey: "compare_page.sections.amenities_policies",
    defaultTitle: "นโยบายและสิ่งอำนวยความสะดวก (POLICIES & AMENITIES)",
    icon: Sparkles,
    rows: [
      { key: "petFriendly", label: "นโยบายสัตว์เลี้ยง (Pet Friendly)", icon: PawPrint },
      { key: "allow_airbnb", label: "ปล่อยเช่ารายวัน / Airbnb", icon: FaAirbnb },
      { key: "foreigner_quota", label: "โควต้าต่างชาติ (Foreigner Quota)", icon: Globe2 },
      { key: "features", label: "สิ่งอำนวยความสะดวก & ส่วนกลาง", icon: LayoutGrid },
    ],
  },
  {
    id: "details",
    titleKey: "compare_page.sections.details",
    defaultTitle: "รายละเอียดและประวัติประกาศ (DESCRIPTION & TIMELINE)",
    icon: FileText,
    rows: [
      { key: "description", label: "รายละเอียดทรัพย์", icon: FileText },
      { key: "updated_at", label: "อัปเดตล่าสุด", icon: Clock },
    ],
  },
];
