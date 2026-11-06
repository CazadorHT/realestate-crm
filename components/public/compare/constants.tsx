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
} from "lucide-react";
import { ComparisonRow } from "./types";

export interface ComparisonSection {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: any;
  rows: ComparisonRow[];
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { key: "title", label: "หัวข้อ", icon: FileText },
  { key: "verified", label: "สถานะ", icon: ShieldCheck },
  { key: "listing_type", label: "ประเภทประกาศ", icon: Tag },
  { key: "property_type", label: "ประเภทอสังหาฯ", icon: Home },
  { key: "property_size", label: "พื้นที่ใช้สอย", icon: Maximize },
  { key: "land_size_sqwah", label: "ขนาดที่ดิน", icon: Maximize },
  { key: "price", label: "ราคา", icon: Coins },
  { key: "zone", label: "โซน/ย่าน", icon: MapPin },
  { key: "location", label: "ทำเลที่ตั้ง", icon: Map },
  { key: "google_maps_link", label: "แผนที่", icon: MapPin },
  { key: "transportation", label: "รถไฟฟ้า", icon: Train },
  { key: "bedrooms", label: "ห้องนอน", icon: BedDouble },
  { key: "bathrooms", label: "ห้องน้ำ", icon: Bath },
  { key: "floor", label: "ชั้น", icon: Layers },
  { key: "parking_slots", label: "ที่จอดรถ", icon: Car },
  { key: "petFriendly", label: "สัตว์เลี้ยง", icon: PawPrint },
  { key: "features", label: "สิ่งอำนวยความสะดวก", icon: LayoutGrid },
  { key: "nearby_places", label: "สถานที่ใกล้เคียง", icon: MapPin },
  { key: "province", label: "จังหวัด", icon: Map },
  { key: "description", label: "รายละเอียด", icon: FileText },
  { key: "updated_at", label: "อัปเดตล่าสุด", icon: Clock },
];

export const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    id: "transit_location",
    titleKey: "compare_page.sections.transit_location",
    defaultTitle: "ทำเลและการเดินทาง (Location & Transit)",
    icon: Train,
    rows: [
      { key: "transportation", label: "รถไฟฟ้า", icon: Train },
      { key: "zone", label: "โซน/ย่าน", icon: MapPin },
      { key: "location", label: "ทำเลที่ตั้ง", icon: Map },
      { key: "google_maps_link", label: "แผนที่", icon: MapPin },
      { key: "nearby_places", label: "สถานที่ใกล้เคียง", icon: MapPin },
      { key: "province", label: "จังหวัด", icon: Map },
    ],
  },
  {
    id: "pricing_overview",
    titleKey: "compare_page.sections.pricing_overview",
    defaultTitle: "ราคาและประเภทประกาศ (Pricing & Category)",
    icon: Coins,
    rows: [
      { key: "price", label: "ราคา", icon: Coins },
      { key: "listing_type", label: "ประเภทประกาศ", icon: Tag },
      { key: "property_type", label: "ประเภทอสังหาฯ", icon: Home },
      { key: "verified", label: "สถานะการตรวจสอบ", icon: ShieldCheck },
    ],
  },
  {
    id: "space_layout",
    titleKey: "compare_page.sections.space_layout",
    defaultTitle: "พื้นที่และขนาดห้อง (Space & Layout)",
    icon: Maximize,
    rows: [
      { key: "property_size", label: "พื้นที่ใช้สอย", icon: Maximize },
      { key: "land_size_sqwah", label: "ขนาดที่ดิน", icon: Maximize },
      { key: "bedrooms", label: "ห้องนอน", icon: BedDouble },
      { key: "bathrooms", label: "ห้องน้ำ", icon: Bath },
      { key: "floor", label: "ชั้น", icon: Layers },
      { key: "parking_slots", label: "ที่จอดรถ", icon: Car },
    ],
  },
  {
    id: "amenities_policies",
    titleKey: "compare_page.sections.amenities_policies",
    defaultTitle: "สิ่งอำนวยความสะดวก & นโยบาย (Amenities & Policies)",
    icon: Sparkles,
    rows: [
      { key: "petFriendly", label: "สัตว์เลี้ยง", icon: PawPrint },
      { key: "features", label: "สิ่งอำนวยความสะดวก", icon: LayoutGrid },
    ],
  },
  {
    id: "details",
    titleKey: "compare_page.sections.details",
    defaultTitle: "รายละเอียดเพิ่มเติม (Details)",
    icon: FileText,
    rows: [
      { key: "description", label: "รายละเอียด", icon: FileText },
      { key: "updated_at", label: "อัปเดตล่าสุด", icon: Clock },
    ],
  },
];
