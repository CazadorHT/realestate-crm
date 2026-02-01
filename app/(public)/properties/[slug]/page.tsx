import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecentPropertyTracker } from "@/components/public/RecentPropertyTracker";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { ShareButtons } from "@/components/public/ShareButtons";
import { SimilarPropertiesSection } from "@/components/public/SimilarPropertiesSection";
import { MobilePropertyActions } from "@/components/public/MobilePropertyActions";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { Database } from "@/lib/database.types";
import { Metadata } from "next";

// New modular components
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { PropertyMapSection } from "@/components/public/property-detail/PropertyMapSection";

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

  // Generate Key Selling Points with Icons (Prioritize unit-specific flags and "คุณสมบัติพิเศษ", limit to 5)
  const unitSpecialFeatures = [
    data.is_pet_friendly && {
      name: "เลี้ยงสัตว์ได้ ",
      icon: "dog",
    },
    data.is_corner_unit && { name: "ห้องมุม ", icon: "layout" },
    data.is_renovated && { name: "รีโนเวทใหม่ ", icon: "sparkles" },
    data.is_fully_furnished && {
      name: "ตกแต่งครบ ",
      icon: "armchair",
    },
    (data.floor || 0) > 15 && {
      name: `วิวสวยชั้นสูง (ชั้น ${data.floor})`,
      icon: "building-2",
    },
    data.has_city_view && { name: "วิวเมือง ", icon: "building-2" },
    data.has_pool_view && { name: "วิวสระว่ายน้ำ ", icon: "waves" },
    data.has_garden_view && { name: "วิวสวน ", icon: "trees" },
    data.is_selling_with_tenant && { name: "ขายพร้อมผู้เช่า", icon: "users-2" },
    data.is_foreigner_quota && {
      name: "โควต้าต่างชาติ ",
      icon: "globe",
    },
  ].filter((f): f is { name: string; icon: string } => !!f);

  const keySellingPoints = [
    ...unitSpecialFeatures,
    ...features
      .filter((f) => f.category === "คุณสมบัติพิเศษ")
      .map((f) => ({ name: f.name, icon: f.icon_key })),
    ...features
      .filter((f) => f.category !== "คุณสมบัติพิเศษ")
      .map((f) => ({ name: f.name, icon: f.icon_key })),
  ]
    .filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i) // Deduplicate by name
    .slice(0, 6);

  const shareUrl = `https://your-domain.com/properties/${data.slug || slug}`;

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-20 font-sans">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* 1. Header & Breadcrumb */}
      <PropertyHeader
        property={data}
        locationParts={locationParts}
        keySellingPoints={keySellingPoints}
      />

      <div className="max-w-7xl mx-auto mt-4 md:mt-8">
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
                      100,
                  );
                  parts.push(
                    `฿${data.original_price!.toLocaleString()} (-${discountPercent}%)`,
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
                    `฿${data.original_rental_price!.toLocaleString()}/ด (-${discountPercent}%)`,
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
                      100,
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

            <PropertyBadgesSection property={data} />

            <PropertyDescription description={data.description} />

            <NearbyPlaces
              location={data.popular_area || undefined}
              data={(data.nearby_places as any[]) || []}
              transits={(data.nearby_transits as any[]) || []}
            />

            <hr className="border-slate-100" />

            {/* Facilities / Highlights */}
            <PropertyAmenities features={features} />

            <hr className="border-slate-100" />

            {/* Map */}
            <PropertyMapSection googleMapsLink={data.google_maps_link} />
          </div>

          {/* Right Sidebar (Sticky) */}
          <aside className="relative space-y-6">
            {/* [NEW] Suitability / Rent vs Buy */}
            <PropertySuitability
              listingType={data.listing_type || "SALE"}
              price={data.price}
              rentalPrice={data.rental_price}
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

  const supabase = createAdminClient();
  let query = supabase
    .from("properties")
    .select(
      "title, description, slug, listing_type, province, property_images(image_url, is_cover)",
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
