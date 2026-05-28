import { RecentProperty } from "@/lib/recent-properties";
import { RecommendedProperty } from "@/features/properties/recommended-actions";
import { formatPrice as utilFormatPrice } from "@/lib/property-utils";

export function convertToRecentProperty(
  prop: RecommendedProperty,
  t: (key: string, params?: Record<string, string | number>) => string,
  language: string,
): RecentProperty {
  let price_text = "";

  if (prop.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (prop.price) {
      const hasDiscount =
        prop.original_price && prop.original_price > prop.price;
      if (hasDiscount) {
        const discountPercent = Math.round(
          ((prop.original_price! - prop.price) / prop.original_price!) * 100,
        );
        parts.push(
          `${utilFormatPrice(prop.price, language)} (-${discountPercent}%)`,
        );
      } else {
        parts.push(utilFormatPrice(prop.price, language));
      }
    }
    if (prop.rental_price) {
      const hasDiscount =
        prop.original_rental_price &&
        prop.original_rental_price > prop.rental_price;
      if (hasDiscount) {
        const discountPercent = Math.round(
          ((prop.original_rental_price! - prop.rental_price) /
            prop.original_rental_price!) *
            100,
        );
        parts.push(
          `${utilFormatPrice(prop.rental_price, language)}${t(
            "recently_viewed.per_month_short",
          )} (-${discountPercent}%)`,
        );
      } else {
        parts.push(
          `${utilFormatPrice(prop.rental_price, language)}${t(
            "recently_viewed.per_month_short",
          )}`,
        );
      }
    }
    price_text = parts.join(" | ");
  } else if (prop.listing_type === "SALE") {
    const hasDiscount =
      prop.original_price && prop.price && prop.original_price > prop.price;
    if (hasDiscount) {
      const discountPercent = Math.round(
        ((prop.original_price! - prop.price!) / prop.original_price!) * 100,
      );
      price_text = `${utilFormatPrice(
        prop.price!,
        language,
      )} (-${discountPercent}%)`;
    } else if (prop.price) {
      price_text = utilFormatPrice(prop.price, language);
    }
  } else if (prop.listing_type === "RENT") {
    const hasDiscount =
      prop.original_rental_price &&
      prop.rental_price &&
      prop.original_rental_price > prop.rental_price;
    if (hasDiscount) {
      const discountPercent = Math.round(
        ((prop.original_rental_price! - prop.rental_price!) /
          prop.original_rental_price!) *
          100,
      );
      price_text = `${utilFormatPrice(
        prop.rental_price!,
        language,
      )}${t("recently_viewed.per_month_short")} (-${discountPercent}%)`;
    } else if (prop.rental_price) {
      price_text = `${utilFormatPrice(prop.rental_price, language)}${t(
        "recently_viewed.per_month_short",
      )}`;
    }
  }

  return {
    id: prop.id,
    title: prop.title,
    title_en: prop.title_en,
    title_cn: prop.title_cn,
    title_ru: prop.title_ru,
    image_url: prop.image_url,
    price: prop.price,
    original_price: prop.original_price,
    rental_price: prop.rental_price,
    original_rental_price: prop.original_rental_price,
    price_per_sqm: prop.price_per_sqm,
    rent_price_per_sqm: prop.rent_price_per_sqm,
    size_sqm: prop.size_sqm,
    price_text,
    province: prop.province,
    popular_area: prop.popular_area,
    popular_area_en: prop.popular_area_en,
    popular_area_cn: prop.popular_area_cn,
    popular_area_ru: prop.popular_area_ru,
    property_type: prop.property_type,
    listing_type: prop.listing_type,
    slug: prop.slug,
    ts: Date.now(),
  };
}

export function getCardPrice(
  item: RecentProperty,
  t: (key: string, params?: Record<string, string | number>) => string,
  language: string,
) {
  const hasNewFields =
    item.price !== undefined ||
    item.rental_price !== undefined ||
    item.original_price !== undefined;

  if (!hasNewFields) {
    return item.price_text || t("common.contact_for_price");
  }

  const isSale =
    item.listing_type === "SALE" || item.listing_type === "SALE_AND_RENT";
  const isRent =
    item.listing_type === "RENT" || item.listing_type === "SALE_AND_RENT";

  const getPriceValue = (listingType: string) => {
    const isR = listingType === "RENT";
    const mainP = isR ? item.rental_price : item.price;
    const originP = isR ? item.original_rental_price : item.original_price;
    const sqmP = isR ? item.rent_price_per_sqm : item.price_per_sqm;

    if (
      item.property_type === "OFFICE_BUILDING" &&
      !mainP &&
      sqmP &&
      item.size_sqm
    ) {
      return sqmP * item.size_sqm;
    }
    return mainP ?? originP;
  };

  const saleP = isSale ? getPriceValue("SALE") : null;
  const rentP = isRent ? getPriceValue("RENT") : null;

  if (item.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (saleP) parts.push(utilFormatPrice(saleP, language));
    if (rentP)
      parts.push(
        `${utilFormatPrice(rentP, language)}${t(
          "recently_viewed.per_month_short",
        )}`,
      );
    return (
      parts.join(" | ") || item.price_text || t("common.contact_for_price")
    );
  }

  if (isSale && saleP) return utilFormatPrice(saleP, language);
  if (isRent && rentP)
    return `${utilFormatPrice(rentP, language)}${t(
      "recently_viewed.per_month_short",
    )}`;

  return item.price_text || t("common.contact_for_price");
}
