import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { cache } from "react";
import { getPublicPropertyDetail as getRawPublicPropertyDetail } from "@/features/properties/actions/fetch-public-property";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { 
  generateMetaTitle, 
  generateMetaDescription, 
  generateMetaKeywords 
} from "@/lib/seo-utils";

export const getPublicPropertyDetail = cache(getRawPublicPropertyDetail);

/**
 * Centered SEO & Metadata Helper for Property Detail Page
 * Refined and Hardened for S-Tier Performance.
 */
export async function generatePropertyMetadataAsync(slug: string): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  const data = await getPublicPropertyDetail(slug);

  if (!data) {
    return {
      title: t("errors.property_not_found_title") || "Property Not Found",
    };
  }

  // 1. Generate SEO Strings
  const pageTitle = generateMetaTitle(data as any, language);
  const pageDesc = generateMetaDescription(data as any, language);
  const keywords = generateMetaKeywords(data as any, language);

  // 2. Resolve Cover Image and Optimize for Social Sharing
  const propertyImages = data.images || [];
  let rawCover =
    propertyImages.find((img) => img.is_cover)?.image_url ||
    propertyImages[0]?.image_url ||
    "/images/hero-realestate.png";

  let COVER_IMAGE = getPublicImageUrl(rawCover) || rawCover;

  if (COVER_IMAGE && !COVER_IMAGE.startsWith("http")) {
    const cleanPath = COVER_IMAGE.startsWith("/") ? COVER_IMAGE : `/${COVER_IMAGE}`;
    COVER_IMAGE = `${siteConfig.url}${cleanPath}`;
  }

  // 3. Dynamic OG Image Params
  const canonicalUrl = `${siteConfig.url}/properties/${encodeURIComponent(data.slug || slug)}`;
  const ogUrl = new URL(`${siteConfig.url}/api/og/property`);
  
  const ogTitle = pageTitle.split(" - ")[0].split(" | ")[0];
  ogUrl.searchParams.set("title", ogTitle.length > 60 ? ogTitle.slice(0, 57) + "..." : ogTitle);
  
  // Price Display Logic (Numerical consistency for GTM and SEO)
  let displayPrice = "";
  if (data.listing_type === "RENT") {
    const p = data.rental_price || data.original_rental_price;
    if (p) displayPrice = `฿ ${p.toLocaleString()}/mo`;
  } else if (data.listing_type === "SALE") {
    const p = data.price || data.original_price;
    if (p) displayPrice = `฿ ${p.toLocaleString()}`;
  } else if (data.listing_type === "SALE_AND_RENT") {
    const sp = data.price || data.original_price;
    const rp = data.rental_price || data.original_rental_price;
    if (sp && rp) displayPrice = `฿ ${sp.toLocaleString()} | ฿ ${rp.toLocaleString()}/mo`;
    else if (sp) displayPrice = `฿ ${sp.toLocaleString()}`;
    else if (rp) displayPrice = `฿ ${rp.toLocaleString()}/mo`;
  }
  
  ogUrl.searchParams.set("price", displayPrice.replace(/[฿|,]/g, "").trim());
  ogUrl.searchParams.set("type", data.property_type ? t(`property_types.${data.property_type.toLowerCase()}`) || data.property_type : "");
  ogUrl.searchParams.set("location", data.popular_area || data.district || "");
  ogUrl.searchParams.set("id", data.id);
  if (COVER_IMAGE && COVER_IMAGE.startsWith("http")) {
    ogUrl.searchParams.set("img", COVER_IMAGE);
  }
  ogUrl.searchParams.set("lang", language);

  const DYNAMIC_OG_IMAGE = ogUrl.toString();

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        th: `${siteConfig.url}/th/properties/${encodeURIComponent(data.slug || slug)}`,
        en: `${siteConfig.url}/en/properties/${encodeURIComponent(data.slug || slug)}`,
        "zh-Hans": `${siteConfig.url}/cn/properties/${encodeURIComponent(data.slug || slug)}`,
        ru: `${siteConfig.url}/ru/properties/${encodeURIComponent(data.slug || slug)}`,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      images: [
        { url: COVER_IMAGE, width: 1200, height: 630, alt: pageTitle },
        { url: DYNAMIC_OG_IMAGE, width: 1200, height: 630, alt: pageTitle },
      ],
      url: canonicalUrl,
      type: "website",
      siteName: siteConfig.name,
      locale: language === "th" ? "th_TH" : language === "cn" ? "zh_CN" : language === "ru" ? "ru_RU" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [COVER_IMAGE, DYNAMIC_OG_IMAGE],
    },
  };
}
