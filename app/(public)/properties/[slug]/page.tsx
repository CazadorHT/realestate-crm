import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { createAdminClient } from "@/lib/supabase/admin";
// Critical LCP components
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { ShareButtons } from "@/components/public/ShareButtons";
import { MobilePropertyActions } from "@/components/public/MobilePropertyActions";
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

// Lazy loaded components
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

  if (UUID_RE.test(slug)) {
    // Fallback: treat as UUID
    query = query.eq("id", slug);
  } else {
    // Primary: treat as slug (case-insensitive)
    query = query.ilike("slug", slug);
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
    // 1. If already absolute URL, use as is (matching pickCoverImage logic)
    if (img.image_url && img.image_url.startsWith("http")) {
      return {
        ...img,
        image_url: img.image_url,
      };
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

  // Debug logs to help identify why images might be missing
  // console.log(
  //   `[SlugPage] Rendering property: ${data.id} (${slug})`,
  //   JSON.stringify({
  //     foundImages: images.length,
  //     rawImages: rawData.property_images?.map((i: any) => ({
  //       id: i.id,
  //       url: i.image_url,
  //       path: i.storage_path,
  //     })),
  //   }),
  // );
  // if (images.length > 0) {
  //   console.log(`[SlugPage] Normalized First Image: ${images[0].image_url}`);
  // }

  const agent = data.assigned_agent;

  const rawFeatures = data.property_features || [];
  const features = rawFeatures
    .map((pf) => pf.features)
    .filter((f): f is NonNullable<typeof f> => f !== null && f !== undefined);

  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  // Schema.org RealEstateListing
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product", // Consider RealEstateListing if Schema supports it fully, but Product is standard for Google
    name: data.title,
    description: data.description,
    image: images.map((img) => img.image_url),
    offers: {
      "@type": "Offer",
      priceCurrency: "THB",
      price: data.listing_type === "RENT" ? data.rental_price : data.price,
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/properties/${data.slug || data.id}`,
    },
  };

  const shareUrl = `${siteConfig.url}/properties/${data.slug || slug}`;

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
      {/* 1. Header & Breadcrumb */}
      <PropertyHeader property={data} features={features as any} />

      <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8 mx-auto mt-4 md:mt-8">
        {/* 2. Gallery (Mosaic) */}
        <section className="mb-6 md:mb-10">
          <PropertyGallery
            images={images as any[]}
            title={data.title}
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 md:gap-10 lg:gap-16 mb-6 md:mb-10">
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
              location={data.popular_area || undefined}
              data={(data.nearby_places as any[]) || []}
              transits={(data.nearby_transits as any[]) || []}
            />

            <hr className="border-slate-100" />

            {/* Facilities / Highlights */}
            <PropertyAmenities features={features} />

            <hr className="border-slate-100" />

            {/* Map (Resolved Short Link) */}
            <PropertyMapSection
              googleMapsLink={await resolveGoogleMapsLink(
                data.google_maps_link,
              )}
            />
          </div>

          {/* Right Sidebar (Sticky) */}
          <aside className="relative space-y-6">
            {/* [NEW] Suitability / Rent vs Buy */}
            <PropertySuitability
              listingType={data.listing_type || "SALE"}
              price={data.price}
              rentalPrice={data.rental_price}
              propertyType={data.property_type}
            />

            <AgentSidebar
              agentName={agent?.full_name}
              agentImage={agent?.avatar_url}
              agentPhone={agent?.phone}
              isVerified={true}
              propertyId={data.id}
              propertyTitle={data.title}
              shareUrl={shareUrl}
            />
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

      <MobilePropertyActions
        agentName={agent?.full_name}
        agentImage={agent?.avatar_url}
        agentPhone={agent?.phone}
        agentLine={agent?.line_id}
        propertyId={data.id}
        propertyTitle={data.title}
      />
    </main>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug); // Fix for Thai characters

  const supabase = createAdminClient();
  let query = supabase
    .from("properties")
    .select(
      "title, title_en, title_cn, description, description_en, description_cn, slug, listing_type, property_type, price, rental_price, bedrooms, bathrooms, size_sqm, province, district, subdistrict, popular_area, property_images(image_url, storage_path, is_cover)",
    );

  if (UUID_RE.test(decodedSlug)) {
    query = query.eq("id", decodedSlug);
  } else {
    query = query.eq("slug", decodedSlug);
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

  const COVER_IMAGE =
    propertyImages?.find((img) => img.is_cover)?.image_url ||
    propertyImages?.[0]?.image_url ||
    "/images/hero-realestate.png";

  const canonicalUrl = `${siteConfig.url}/properties/${data.slug || slug}`;

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      images: [COVER_IMAGE],
      url: canonicalUrl,
      type: "website",
      siteName: "Real Estate CRM", // Branding
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [COVER_IMAGE],
    },
  };
}
