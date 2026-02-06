import { SmartMatchSettings } from "@/features/smart-match/config-actions";

export const DEFAULT_BUY_RANGES = [
  { id: "buy_1", label: "< 3 ล้าน", min_value: 0, max_value: 3000000 },
  { id: "buy_2", label: "3 - 5 ล้าน", min_value: 3000000, max_value: 5000000 },
  {
    id: "buy_3",
    label: "5 - 10 ล้าน",
    min_value: 5000000,
    max_value: 10000000,
  },
  {
    id: "buy_4",
    label: "> 10 ล้าน",
    min_value: 10000000,
    max_value: 999999999999,
  },
];

export const DEFAULT_RENT_RANGES = [
  { id: "rent_1", label: "< 1.5 หมื่น", min_value: 0, max_value: 15000 },
  { id: "rent_2", label: "1.5 - 5 หมื่น", min_value: 15000, max_value: 50000 },
  { id: "rent_3", label: "5 - 9 หมื่น", min_value: 50000, max_value: 90000 },
  {
    id: "rent_4",
    label: "> 9 หมื่น",
    min_value: 90000,
    max_value: 999999999999,
  },
];

export const DEFAULT_PROPERTY_TYPES = [
  { label: "🏠 บ้าน", value: "HOUSE" },
  { label: "🏢 คอนโด", value: "CONDO" },
  { label: "🏬 ออฟฟิศ", value: "OFFICE_BUILDING" },
  { label: "👔 อาคารสำนักงาน", value: "OFFICE_BUILDING" },
  { label: "🏡 โฮมออฟฟิศ", value: "TOWNHOME" },
];

export const DEFAULT_SETTINGS: SmartMatchSettings = {
  transit_question_enabled: true,
  wizard_title: "วันนี้คุณกำลังมองหา...",
  loading_text: "กำลังวิเคราะห์ข้อมูล...",
  pdpa_text: "ข้อมูลของคุณจะถูกเก็บเป็นความลับตามนโยบาย PDPA",
};
