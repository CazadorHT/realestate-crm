import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecentPropertyTracker } from "@/components/public/RecentPropertyTracker";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { Badge } from "@/components/ui/badge";
import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import {
  Box,
  MapPin,
  ArrowLeft,
  Clock,
  ShieldCheck,
  PawPrint,
} from "lucide-react";
import { ShareButtons } from "@/components/public/ShareButtons";
import { SimilarPropertiesSection } from "@/components/public/SimilarPropertiesSection";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { MobilePropertyActions } from "@/components/public/MobilePropertyActions";
import { Database } from "@/lib/database.types";
import { Metadata } from "next";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Define strict types for the query result
type PropertyDetail = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images: Pick<
    Database["public"]["Tables"]["property_images"]["Row"],
    "id" | "image_url" | "is_cover" | "sort_order"
  >[];
  assigned_agent: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "phone" | "avatar_url" | "line_id"
  > | null;
  property_features: {
    features: Pick<
      Database["public"]["Tables"]["features"]["Row"],
      "id" | "name" | "icon_key" | "category"
    > | null;
  }[];
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
            icon_key,
            category
          )
        )
      `
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

  const images = data.property_images || [];
  const agent = data.assigned_agent;

  const rawFeatures = data.property_features || [];
  const features = rawFeatures
    .map((pf) => pf.features)
    .filter((f): f is NonNullable<typeof f> => f !== null && f !== undefined);

  const locationParts = [
    data.popular_area,
    data.subdistrict,
    data.district,
    data.province,
  ]
    .filter(Boolean)
    .join(", ");

  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-4);
    return `${d}/${m}/${y}`;
  };

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
      url: `https://your-domain.com/properties/${data.slug || data.id}`,
    },
  };

  const shareUrl = `https://your-domain.com/properties/${data.slug || slug}`;

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-20 font-sans">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* 1. Header & Breadcrumb */}
      <div className="pt-20 md:pt-24 px-5 md:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Back Link */}
            <div className="flex justify-between items-center">
              <Link
                href="/properties"
                className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                ย้อนกลับไปหน้ารวมทรัพย์
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3 flex-grow min-w-0 max-w-[800px]">
                {/* Badge and ID in one line */}
                <div className="flex items-center gap-3">
                  <Badge
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                      data.listing_type === "SALE"
                        ? "bg-emerald-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {data.listing_type === "SALE" ? "ขาย" : "เช่า"}
                  </Badge>
                  <span className="text-slate-400 text-xs font-medium">
                    #{data.id.slice(0, 8)}
                  </span>
                </div>

                {/* Title with line clamp */}
                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight line-clamp-2">
                  {data.title}
                </h2>

                {/* Location */}
                <div className="flex items-center text-slate-600 gap-2 font-normal text-sm">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {locationParts || "ไม่ระบุทำเล"}
                  </span>
                </div>
              </div>
              {/* Price Section */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:items-end gap-2">
                  {(() => {
                    const renderPriceBlock = (
                      price: number | null,
                      originalPrice: number | null,
                      label: string,
                      isRent: boolean
                    ) => {
                      const displayPrice = price ?? originalPrice;

                      // Fallback for no price
                      if (
                        displayPrice === null ||
                        displayPrice === undefined ||
                        displayPrice === 0
                      ) {
                        return (
                          <div className="flex items-center gap-2">
                            {label && (
                              <span className="text-sm text-slate-500 font-medium">
                                {label}
                              </span>
                            )}
                            <span className="text-xl md:text-2xl font-bold text-blue-600">
                              {isRent ? "สอบถามค่าเช่า" : "สอบถามราคา"}
                            </span>
                          </div>
                        );
                      }

                      const hasDiscount =
                        price !== null &&
                        originalPrice !== null &&
                        originalPrice > price;

                      if (hasDiscount) {
                        const discountPercent = Math.round(
                          ((originalPrice! - price!) / originalPrice!) * 100
                        );

                        return (
                          <div className="flex flex-col items-end gap-1">
                            {/* Original Price */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                              <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
                                -{discountPercent}%
                              </span>
                            </div>

                            {/* Current Price */}
                            <div className="flex items-center gap-2">
                              {label && (
                                <span className="text-sm text-slate-500 font-medium">
                                  {label}
                                </span>
                              )}
                              <span className="text-xl md:text-2xl font-bold text-rose-600">
                                {formatPrice(price)}
                              </span>
                              {isRent && (
                                <span className="text-sm text-slate-500">
                                  /เดือน
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Regular price
                      return (
                        <div className="flex items-center gap-2">
                          {label && (
                            <span className="text-sm text-slate-500 font-medium">
                              {label}
                            </span>
                          )}
                          <span className="text-xl md:text-2xl font-bold text-slate-900">
                            {formatPrice(displayPrice)}
                          </span>
                          {isRent && (
                            <span className="text-sm text-slate-500">
                              /เดือน
                            </span>
                          )}
                        </div>
                      );
                    };

                    if (data.listing_type === "SALE_AND_RENT") {
                      return (
                        <>
                          {renderPriceBlock(
                            data.price,
                            data.original_price,
                            "ขาย",
                            false
                          )}
                          {renderPriceBlock(
                            data.rental_price,
                            data.original_rental_price,
                            "เช่า",
                            true
                          )}
                        </>
                      );
                    }

                    if (data.listing_type === "RENT") {
                      return renderPriceBlock(
                        data.rental_price,
                        data.original_rental_price,
                        "",
                        true
                      );
                    }

                    // SALE or Default
                    return renderPriceBlock(
                      data.price,
                      data.original_price,
                      "",
                      false
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4 md:mt-8">
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
            image_url: images.find((i: any) => i.is_cover)?.image_url || null,
            province: data.province,
            popular_area: data.popular_area,
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
                      100
                  );
                  parts.push(
                    `฿${data.original_price!.toLocaleString()} (-${discountPercent}%)`
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
                      100
                  );
                  parts.push(
                    `฿${data.original_rental_price!.toLocaleString()}/ด (-${discountPercent}%)`
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
                      100
                  );
                  return `฿${data.original_price!.toLocaleString()} (-${discountPercent}%)`;
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
                      100
                  );
                  return `฿${data.original_rental_price!.toLocaleString()}/ด (-${discountPercent}%)`;
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
            <section className="space-y-4">
              {/* Badges and Meta in horizontal layout */}
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-4">
                {/* Listing Type Badge */}
                <Badge
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    data.listing_type === "SALE"
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                >
                  {data.listing_type === "SALE" ? "ขาย" : "เช่า"}
                </Badge>

                {/* Created Date */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>สร้างเมื่อ {formatDate(data.created_at)}</span>
                </div>
              </div>
            </section>
            {/* Description */}
            <section>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
                รายละเอียดทรัพย์
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-7 md:leading-8 whitespace-pre-wrap text-sm md:text-base max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {data.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Facilities / Highlights (Mock or Real Field) */}
            {/* Facilities / Highlights */}
            {features.length > 0 && (
              <section>
                <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                  สิ่งอำนวยความสะดวก
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-y-4 md:gap-x-8">
                  {features.map((item: any, i: number) => {
                    const Icon = ICON_MAP[item.icon_key] || DEFAULT_ICON;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-slate-600"
                      >
                        <div className="p-1.5 md:p-2 rounded-full bg-blue-50 text-blue-600">
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <hr className="border-slate-100" />

            {/* Map */}
            <section>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                แผนที่ & ทำเลที่ตั้ง
              </h2>
              <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden space-y-3 md:space-y-4">
                {data.google_maps_link ? (
                  <>
                    <div className="bg-white p-3 md:p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                    </div>
                    <p className="text-sm md:text-base text-slate-600 font-medium max-w-md text-center">
                      ดูตำแหน่งที่ตั้งทรัพย์สินนี้บน Google Maps
                    </p>
                    <a
                      href={data.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดดูใน Google Maps
                    </a>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-3 md:p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
                    </div>
                    <p className="text-sm md:text-base">
                      ไม่พบข้อมูลพิกัดแผนที่
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar (Sticky) */}
          <aside className="relative">
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

  const supabase = createAdminClient();
  let query = supabase
    .from("properties")
    .select(
      "title, description, slug, listing_type, province, property_images(image_url, is_cover)"
    );

  if (UUID_RE.test(slug)) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data } = await query.maybeSingle();

  if (!data) return { title: "ไม่พบทรัพย์" };

  // Helper for better title
  const typeLabel = data.listing_type === "RENT" ? "เช่า" : "ขาย";
  const locationLabel = data.province ? ` - ${data.province}` : "";
  const pageTitle = `${typeLabel} ${data.title}${locationLabel} | Real Estate CRM`;

  const propertyImages = data.property_images as unknown as {
    image_url: string;
    is_cover: boolean;
  }[];

  const COVER_IMAGE =
    propertyImages?.find((img) => img.is_cover)?.image_url ||
    propertyImages?.[0]?.image_url ||
    "/images/og-default.jpg";

  const cleanDesc =
    data.description?.replace(/<[^>]*>?/gm, "").slice(0, 160) ||
    "รายละเอียดทรัพย์";
  const canonicalUrl = `https://your-domain.com/properties/${
    data.slug || slug
  }`;

  return {
    title: pageTitle,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: cleanDesc,
      images: [COVER_IMAGE],
      url: canonicalUrl,
      type: "website",
      siteName: "Real Estate CRM", // Branding
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: cleanDesc,
      images: [COVER_IMAGE],
    },
  };
}
