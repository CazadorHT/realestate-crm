import { CompareProperty } from "./types";

export const formatMoney = (amount: number, locale: string = "th-TH") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getListingTypeKey = (type: string | null) => {
  if (!type) return null;
  if (type === "SALE") return "common.for_sale";
  if (type === "RENT") return "common.for_rent";
  if (type === "SALE_AND_RENT") return "common.rent_buy";
  return null;
};

export const isPetFriendly = (p: CompareProperty) => {
  return p.meta_keywords?.includes("Pet Friendly");
};
