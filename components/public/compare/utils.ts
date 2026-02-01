import { CompareProperty } from "./types";

export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const cleanListingType = (type: string | null) => {
  if (!type) return "-";
  if (type === "SALE") return "ขาย";
  if (type === "RENT") return "เช่า";
  if (type === "SALE_AND_RENT") return "ขาย/เช่า";
  return type;
};

export const isPetFriendly = (p: CompareProperty) => {
  return p.meta_keywords?.includes("Pet Friendly");
};
