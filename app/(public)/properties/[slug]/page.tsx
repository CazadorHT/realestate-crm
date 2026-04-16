import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { createAdminClient } from "@/lib/supabase/admin";
// Critical LCP components
import { PropertyGallery } from "@/components/public/PropertyGallery";
import {
  generatePropertySEO,
} from "@/lib/seo-utils";
import {
  getPublicImageUrl,
  getPublicAvatarUrl,
} from "@/features/properties/image-utils";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { ShareButtons } from "@/components/public/ShareButtons";
import { MobilePropertyActions } from "@/components/public/MobilePropertyActions";
import { BackToTop } from "@/components/public/BackToTop";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { Database } from "@/lib/database.types";
import { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n";

// New modular components
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { siteConfig } from "@/lib/site-config";
import { getLocaleValue } from "@/lib/utils/locale-utils";

// Lazy loaded components
import { GTMPropertyPageView } from "@/components/providers/GTMPropertyPageView";

const PropertyMapSection = dynamic(() =>
  import("@/components/public/property-detail/PropertyMapSection").then(
    (mod) => mod.PropertyMapSection,
  ),
);
const SimilarPropertiesSection = dynamic(() =>
  import("@/components/public/SimilarPropertiesSection").then(
    (mod) => mod.SimilarPropertiesSection,
  ),
);
const RecentPropertyTracker = dynamic(() =>
  import("@/components/public/RecentPropertyTracker").then(
    (mod) => mod.RecentPropertyTracker,
  ),
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Define strict types for the query result
type PropertyDetail = Database["public"]["Tables"]["properties"]["Row"] & {
  popular_area_en?: string | null; // From separate fetch or join
  popular_area_cn?: string | null;
  title_en?: string | null; // Ensure present
  title_cn?: string | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  property_images: Pick<
    Database["public"]["Tables"]["property_images"]["Row"],
    "id" | "image_url" | "storage_path" | "is_cover" | "sort_order"
  >[];
  assigned_agent: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "phone" | "avatar_url" | "line_id"
  > | null;
  property_features: {
    features: Pick<
      Database["public"]["Tables"]["features"]["Row"],
      "id" | "name" | "name_en" | "name_cn" | "icon_key" | "category"
    > | null;
  }[];
  is_fully_furnished: boolean | null;
  is_bare_shell: boolean | null;
};

export default async function PublicPropertyDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const { language, t } = await getServerTranslations();

  // Decode URL-encoded slug (e.g., %E0%B8%9A... → บ้าน...)
  const slug = decodeURIComponent(rawSlug);

  const supabase = createAdminClient();

  // Try to find by Slug (primary) or ID (fallback for old URLs)
  let query = supabase.from("properties").select(
    `
        *,
        property_images (
          id,
          image_url,
          storage_path,
          is_cover,
          sort_order
        ),
        assigned_agent:profiles!properties_assigned_to_profile_fkey (
           full_name,
           phone,
           avatar_url,
           line_id
        ),
        property_features (
          features (
            id,
            name,
            name_en,
            name_cn,
            icon_key,
            category
          )
        )
      `,
  );

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch (e) {
    // Fallback to raw slug
  }

  if (UUID_RE.test(decodedSlug)) {
    // Fallback: treat as UUID
    query = query.eq("id", decodedSlug);
  } else {
    // Primary: treat as slug (case-insensitive)
    query = query.ilike("slug", decodedSlug);
  }

  // Type assertion for the complex joined result
  const { data: rawData, error } = await query.maybeSingle();

  if (error || !rawData) notFound();

  // Cast to our defined type to ensure safety downstream
  const data = rawData as unknown as PropertyDetail;

  // Fetch Popular Area translations if area exists
  if (data.popular_area) {
    const { data: areaData } = await supabase
      .from("popular_areas")
      .select("name_en, name_cn")
      .eq("name", data.popular_area)
      .maybeSingle();

    if (areaData) {
      data.popular_area_en = areaData.name_en;
      data.popular_area_cn = areaData.name_cn;
    }
  }

  // Normalize images: Resolve public URL from storage_path if image_url is missing/relative
  const images = (rawData.property_images || []).map((img: any) => {
    // 1. If already absolute URL, use as is
    if (img.image_url && img.image_url.startsWith("http")) {
      return img;
    }

    // 2. If storage_path exists, resolve via utility
    if (img.storage_path) {
      return {
        ...img,
        image_url: getPublicImageUrl(img.storage_path),
      };
    }

    // 3. Last fallback
    return {
      ...img,
      image_url: img.image_url || "/images/hero-realestate.png",
    };
  });

  const agent = data.assigned_agent;

  const rawFeatures = data.property_features || [];
  const features = rawFeatures
    .map((pf: { features: any }) => pf.features)
    .filter(
      (f: any): f is NonNullable<typeof f> => f !== null && f !== undefined,
    );

  const { formatPrice: utilFormatPrice } = await import("@/lib/property-utils");
  const formatPrice = (val: number | null) =>
    val ? utilFormatPrice(val, language) : "-";

  // Generate Professional SEO Data (including FAQSchema)
  let seo;
  try {
    seo = generatePropertySEO({
      id: data.id,
      slug: data.slug || slug,
      title: data.title,
      title_en: data.title_en || undefined,
      title_cn: data.title_cn || undefined,
      property_type: data.property_type,
      listing_type: data.listing_type,
      bedrooms: data.bedrooms ?? undefined,
      bathrooms: data.bathrooms ?? undefined,
      size_sqm: data.size_sqm ?? undefined,
      description: data.description ?? undefined,
      address_line1: data.address_line1 ?? undefined,
      district: data.district ?? undefined,
      province: data.province ?? undefined,
      postal_code: data.postal_code || undefined,
      near_transit: !!data.near_transit,
      is_pet_friendly: !!data.meta_keywords?.includes("Pet Friendly"),
      is_fully_furnished: !!data.meta_keywords?.includes("Fully Furnished"),
      is_hot_sale: (data.original_price !== null && data.price !== null && data.original_price > data.price),
      price: data.listing_type === "SALE" ? (data.price || undefined) : undefined,
      rental_price: data.listing_type === "RENT" ? (data.rental_price || undefined) : undefined,
      popular_area: data.popular_area ?? undefined,
      nearby_transits: (data.nearby_transits as any) || [],
      nearby_places: (data.nearby_places as any) || [],
    }, language);
  } catch (err) {
    console.error("SEO Generation failed:", err);
    // Minimal fallback
    seo = {
      slug: data.slug || slug,
      metaTitle: `${data.title} | ${siteConfig.name}`,
      metaDescription: data.title,
      metaKeywords: [],
      structuredData: {},
      faqSchema: null,
    };
  }

  const schemaData = seo.structuredData;

  const shareUrl = `${siteConfig.url}/properties/${encodeURIComponent(data.slug || slug)}`;

  // Helper: Try to resolve short links (server-side)
  async function resolveGoogleMapsLink(url: string | null) {
    if (!url) return null;
    // Check for common shortener patterns
    if (
      url.includes("goo.gl") ||
      url.includes("maps.app.goo.gl") ||
      url.includes("share.google")
    ) {
      try {
        // Fetch with HEAD to follow redirects lightly
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          next: { revalidate: 3600 }, // Cache the resolution for 1 hour
        });
        return res.url;
      } catch (e) {
        console.error("Error resolving Google Maps link:", e);
        return url; // Fallback to original
      }
    }
    return url;
  }

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-20 font-sans">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* 1.1 Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": t("nav.home") || "Home",
                "item": siteConfig.url
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": t("nav.properties") || "Properties",
                "item": `${siteConfig.url}/properties`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": data.property_type ? (t(`property_types.${data.property_type.toLowerCase()}`) || data.property_type) : "Property",
                "item": `${siteConfig.url}/properties?type=${data.property_type}`
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": data.province || "Location",
                "item": `${siteConfig.url}/properties?province=${data.province}`
              },
              {
                "@type": "ListItem",
                "position": 5,
                "name": getLocaleValue(data, "title", language),
                "item": `${siteConfig.url}/properties/${data.slug || data.id}`
              }
            ]
          })
        }}
      />
      {/* 1.2 FAQ Schema */}
      {seo.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.faqSchema) }}
        />
      )}
      <GTMPropertyPageView
        property={{
          id: data.id,
          title: data.title,
          listing_type: data.listing_type || "SALE",
          property_type: data.property_type || "CONDO",
          price: data.price,
          original_price: data.original_price,
          rental_price: data.rental_price,
          original_rental_price: data.original_rental_price,
          province: data.province,
          popular_area: data.popular_area,
        }}
      />
      {/* 1. Header & Breadcrumb */}
      <PropertyHeader property={data} features={features as any} />

      <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8 mx-auto mt-4 lg:mt-8">
        <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-0 mx-auto">
          {/* 2. Gallery (Mosaic) */}
          <section className="mb-6 md:mb-10">
            <PropertyGallery
              images={images}
              title={getLocaleValue(data, "title", language)}
              propertyId={data.id}
              // SEO Alt Tag Strategy: [Title] in [District], [Province]
              imageAlt={`${getLocaleValue(data, "title", language)} ${t("seo.in")} ${data.district || ""}, ${data.province || ""}`}
              isHot={
                (data.original_price !== null &&
                  data.price !== null &&
                  data.original_price > data.price) ||
                (data.original_rental_price !== null &&
                  data.rental_price !== null &&
                  data.original_rental_price > data.rental_price)
              }
              verified={!!data.verified}
              petFriendly={!!data.meta_keywords?.includes("Pet Friendly")}
            />
          </section>
          <RecentPropertyTracker
            property={{
              id: data.id,
              title: data.title,
              title_en: data.title_en,
              title_cn: data.title_cn,
              image_url: images.find((i: any) => i.is_cover)?.image_url || null,
              province: data.province,
              popular_area: data.popular_area,
              popular_area_en: data.popular_area_en,
              popular_area_cn: data.popular_area_cn,
              price_text: (() => {
                // SALE_AND_RENT - Show both prices
                if (data.listing_type === "SALE_AND_RENT") {
                  const parts = [];

                  // Sale price
                  const hasSaleDiscount =
                    data.original_price &&
                    data.price &&
                    data.original_price > data.price;
                  if (hasSaleDiscount) {
                    const discountPercent = Math.round(
                      ((data.original_price! - data.price!) /
                        data.original_price!) *
                        100,
                    );
                    parts.push(
                      `฿${data.price!.toLocaleString()} (-${discountPercent}%)`,
                    );
                  } else if (data.price) {
                    parts.push(formatPrice(data.price));
                  } else if (data.original_price) {
                    parts.push(formatPrice(data.original_price));
                  }

                  // Rental price
                  const hasRentDiscount =
                    data.original_rental_price &&
                    data.rental_price &&
                    data.original_rental_price > data.rental_price;
                  if (hasRentDiscount) {
                    const discountPercent = Math.round(
                      ((data.original_rental_price! - data.rental_price!) /
                        data.original_rental_price!) *
                        100,
                    );
                    parts.push(
                      `฿${data.rental_price!.toLocaleString()}/ด (-${discountPercent}%)`,
                    );
                  } else if (data.rental_price) {
                    parts.push(`${formatPrice(data.rental_price)}/ด`);
                  } else if (data.original_rental_price) {
                    parts.push(`${formatPrice(data.original_rental_price)}/ด`);
                  }

                  return parts.filter(Boolean).join(" | ");
                }

                // Sale price logic
                if (data.listing_type === "SALE") {
                  const hasDiscount =
                    data.original_price &&
                    data.price &&
                    data.original_price > data.price;
                  if (hasDiscount) {
                    const discountPercent = Math.round(
                      ((data.original_price! - data.price!) /
                        data.original_price!) *
                        100,
                    );
                    return `฿${data.price!.toLocaleString()} (-${discountPercent}%)`;
                  } else if (data.price) {
                    return formatPrice(data.price);
                  } else if (data.original_price) {
                    return formatPrice(data.original_price);
                  }
                }

                // Rent price logic
                if (data.listing_type === "RENT") {
                  const hasDiscount =
                    data.original_rental_price &&
                    data.rental_price &&
                    data.original_rental_price > data.rental_price;
                  if (hasDiscount) {
                    const discountPercent = Math.round(
                      ((data.original_rental_price! - data.rental_price!) /
                        data.original_rental_price!) *
                        100,
                    );
                    return `฿${data.rental_price!.toLocaleString()}/ด (-${discountPercent}%)`;
                  } else if (data.rental_price) {
                    return `${formatPrice(data.rental_price)}/ด`;
                  } else if (data.original_rental_price) {
                    return `${formatPrice(data.original_rental_price)}/ด`;
                  }
                }
                return "";
              })(),
              property_type: data.property_type,
              listing_type: data.listing_type,
              slug: data.slug,
              features: features,
            }}
          />

          {/* 3. Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 md:gap-10 lg:gap-16 mb-6 md:mb-10">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-10">
              {/* Specs Grid */}
              <section>
                <PropertySpecs
                  bedrooms={data.bedrooms}
                  bathrooms={data.bathrooms}
                  parking={data.parking_slots}
                  sizeSqm={data.size_sqm}
                  landSize={data.land_size_sqwah}
                  floor={data.floor}
                  type={data.property_type}
                />
              </section>

              <PropertyBadgesSection property={data} />

              <PropertyDescription property={data} />

              <NearbyPlaces
                propertyId={data.id}
                propertyTitle={data.title}
                location={data.popular_area || undefined}
                data={(data.nearby_places as any) || []}
                transits={(data.nearby_transits as any) || []}
              />

              <hr className="border-slate-100" />

              {/* Facilities / Highlights */}
              <PropertyAmenities features={features} />

              <hr className="border-slate-100" />

              {/* Map (Resolved Short Link) */}
              <PropertyMapSection
                propertyId={data.id}
                propertyTitle={data.title}
                googleMapsLink={await resolveGoogleMapsLink(
                  data.google_maps_link,
                )}
              />
            </div>

            {/* Right Sidebar (Sticky) */}
            <aside className="relative flex flex-col md:flex-row xl:flex-col gap-6 md:items-stretch w-full">
              <div className="flex-1 xl:flex-none min-w-0 w-full flex flex-col">
                {/* [NEW] Suitability / Rent vs Buy */}
                <PropertySuitability
                  listingType={data.listing_type || "SALE"}
                  price={data.price}
                  rentalPrice={data.rental_price}
                  propertyType={data.property_type}
                />
              </div>

              <div className="flex-1 xl:flex-none min-w-0 w-full flex flex-col  xl:sticky xl:top-24 self-start">
                <AgentSidebar
                  agentName={agent?.full_name}
                  agentImage={getPublicAvatarUrl(agent?.avatar_url || "")}
                  agentPhone={agent?.phone}
                  agentLine={agent?.line_id}
                  isVerified={true}
                  propertyId={data.id}
                  propertyTitle={data.title}
                  property={{
                    title: data.title,
                    title_en: data.title_en,
                    title_cn: data.title_cn,
                  }}
                  shareUrl={shareUrl}
                />
              </div>
            </aside>
          </div>
          {/* Similar Properties Section */}
          <SimilarPropertiesSection
            currentPropertyId={data.id}
            propertyType={data.property_type}
            province={data.province || undefined}
            compareData={{
              price:
                data.listing_type === "RENT" ? data.rental_price : data.price,
              size: data.size_sqm,
              date: data.created_at,
            }}
          />
        </div>
      </div>

      <MobilePropertyActions
        agentName={agent?.full_name}
        agentImage={getPublicAvatarUrl(agent?.avatar_url || "")}
        agentPhone={agent?.phone}
        agentLine={agent?.line_id}
        propertyId={data.id}
        propertyTitle={data.title}
        property={{
          title: data.title,
          title_en: data.title_en,
          title_cn: data.title_cn,
        }}
      />
      <BackToTop />
    </main>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch (e) {
    // Fallback to raw slug
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("properties")
    .select(
      "id, title, title_en, title_cn, description, description_en, description_cn, slug, listing_type, property_type, price, rental_price, original_price, original_rental_price, bedrooms, bathrooms, size_sqm, province, district, subdistrict, popular_area, property_images(image_url, storage_path, is_cover)",
    );

  if (UUID_RE.test(decodedSlug)) {
    query = query.eq("id", decodedSlug);
  } else {
    query = query.ilike("slug", decodedSlug);
  }

  const { data } = await query.maybeSingle();

  const { t, language } = await getServerTranslations();

  if (!data)
    return {
      title: t("errors.property_not_found_title") || "Property Not Found",
    };

  // Use localized title from SEO data if available
  const localizedTitle =
    language === "cn"
      ? (data as any).title_cn
      : language === "en"
        ? (data as any).title_en
        : data.title;

  const seoData = {
    title: localizedTitle || data.title,
    property_type: data.property_type,
    listing_type: data.listing_type,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    size_sqm: data.size_sqm,
    price: data.price,
    rental_price: data.rental_price,
    popular_area: data.popular_area,
    province: data.province,
    district: data.district,
    subdistrict: data.subdistrict,
  };

  const { generateMetaTitle, generateMetaDescription, generateMetaKeywords } =
    await import("@/lib/seo-utils");

  const pageTitle = generateMetaTitle(seoData as any, language);
  const pageDesc = generateMetaDescription(seoData as any, language);
  const keywords = generateMetaKeywords(seoData as any, language);

  const { getPublicImageUrl: getPublicImageUrlSeo } =
    await import("@/features/properties/image-utils");

  const propertyImages = ((data.property_images as any[]) || []).map((img) => ({
    image_url:
      img.image_url && img.image_url.startsWith("http")
        ? img.image_url
        : img.storage_path
          ? getPublicImageUrlSeo(img.storage_path)
          : img.image_url || "/images/hero-realestate.png",
    is_cover: img.is_cover,
  }));

  let COVER_IMAGE =
    propertyImages?.find((img) => img.is_cover)?.image_url ||
    propertyImages?.[0]?.image_url ||
    "/images/hero-realestate.png";

  // Ensure COVER_IMAGE is an absolute URL for OpenGraph compatibility
  if (COVER_IMAGE && !COVER_IMAGE.startsWith("http")) {
    const cleanPath = COVER_IMAGE.startsWith("/") ? COVER_IMAGE : `/${COVER_IMAGE}`;
    COVER_IMAGE = `${siteConfig.url}${cleanPath}`;
  }

  const canonicalUrl = `${siteConfig.url}/properties/${encodeURIComponent(data.slug || slug)}`;
  const ogUrl = new URL(`${siteConfig.url}/api/og/property`);
  // Truncate title for OG param safety (max 40 chars to keep the total URL short for LINE)
  const ogTitle = pageTitle.split(" - ")[0].split(" | ")[0];
  ogUrl.searchParams.set("title", ogTitle.length > 60 ? ogTitle.slice(0, 57) + "..." : ogTitle);
  
  // Logic to handle Sale + Rent and find the most relevant price
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
  // Sanitize price for OG param safety (remove symbols, the API will re-add them)
  const cleanPrice = displayPrice.replace(/[฿|,]/g, "").trim();
  ogUrl.searchParams.set("price", cleanPrice);
  ogUrl.searchParams.set("type", data.property_type ? (t(`property_types.${data.property_type.toLowerCase()}`) || data.property_type) : "");
  ogUrl.searchParams.set("location", data.popular_area || data.district || "");
  ogUrl.searchParams.set("id", data.id); // Send ID instead of full image URL to keep OG URL short
  ogUrl.searchParams.set("lang", language);

  const DYNAMIC_OG_IMAGE = ogUrl.toString();

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "th-TH": `${canonicalUrl}?lang=th`,
        "en-US": `${canonicalUrl}?lang=en`,
        "zh-CN": `${canonicalUrl}?lang=cn`,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      images: [
        {
          url: COVER_IMAGE, // Primary: Actual property image for maximum reliability
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
        {
          url: DYNAMIC_OG_IMAGE, // Secondary: High-engagement dynamic card
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      url: canonicalUrl,
      type: "website",
      siteName: siteConfig.name,
      locale:
        language === "th" ? "th_TH" : language === "cn" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [COVER_IMAGE, DYNAMIC_OG_IMAGE],
    },
  };
}
