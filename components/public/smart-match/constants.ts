import {
  SmartMatchSettings,
  BudgetRange,
} from "@/features/smart-match/config-actions";

// Budget ranges for Rent
export const DEFAULT_RENT_RANGES: BudgetRange[] = [
  {
    id: "rent_1",
    label: "< 1.5 หมื่น",
    min_value: 0,
    max_value: 15000,
    purpose: "RENT",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "rent_2",
    label: "1.5 - 5 หมื่น",
    min_value: 15000,
    max_value: 50000,
    purpose: "RENT",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "rent_3",
    label: "5 หมื่น - 1.5 แสน",
    min_value: 50000,
    max_value: 150000,
    purpose: "RENT",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "rent_4",
    label: "> 1.5 แสน",
    min_value: 150000,
    max_value: 999999999,
    purpose: "RENT",
    sort_order: 4,
    is_active: true,
  },
];

// Budget ranges for Buy
export const DEFAULT_BUY_RANGES: BudgetRange[] = [
  {
    id: "buy_1",
    label: "< 3 ล้าน",
    min_value: 0,
    max_value: 3000000,
    purpose: "BUY",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "buy_2",
    label: "3 - 5 ล้าน",
    min_value: 3000000,
    max_value: 5000000,
    purpose: "BUY",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "buy_3",
    label: "5 - 10 ล้าน",
    min_value: 5000000,
    max_value: 10000000,
    purpose: "BUY",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "buy_4",
    label: "> 10 ล้าน",
    min_value: 10000000,
    max_value: 999999999,
    purpose: "BUY",
    sort_order: 4,
    is_active: true,
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
