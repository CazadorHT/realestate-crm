import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Metadata } from "next";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

// Logic & Helpers
import { getPublicPropertyDetail } from "./property-metadata-helper";
import { generatePropertyMetadataAsync } from "./property-metadata-helper";
import { generatePropertySEO } from "@/lib/seo-utils";
import { getPublicAvatarUrl } from "@/features/properties/image-utils";
import { getSafeNearbyPlaces } from "@/lib/property-hardened-utils";
import { getServerTranslations } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { isCbdProperty } from "@/lib/property-utils";

// Static Components
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { PropertyMapSection } from "@/components/public/property-detail/PropertyMapSection";
import { PropertyFloorPlan } from "@/components/public/property-detail/PropertyFloorPlan";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { MobilePropertyActions } from "@/components/public/MobilePropertyActions";
import {
  MapSkeleton,
  SimilarPropertiesSkeleton,
} from "@/components/public/property-detail/PropertyDetailSkeletons";

// Dynamic / Non-critical Components
const RecentPropertyTracker = dynamic(() =>
  import("@/components/public/RecentPropertyTracker").then(
    (mod) => mod.RecentPropertyTracker,
  ),
);
const SimilarPropertiesSection = dynamic(() =>
  import("@/components/public/SimilarPropertiesSection").then(
    (mod) => mod.SimilarPropertiesSection,
  ),
);
const GTMPropertyPageView = dynamic(() =>
  import("@/components/providers/GTMPropertyPageView").then(
    (mod) => mod.GTMPropertyPageView,
  ),
);

/**
 * [S-Tier] Public Property Detail Page
 * Refactored via "The Lean Page Strategy"
 */
export default async function PublicPropertyDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const { language, t } = await getServerTranslations();

  // 1. Centralized Data Fetching (Single Source of Truth)
  const data = await getPublicPropertyDetail(slug);
  if (!data) notFound();

  // SEO 301 Permanent Redirect: If user accessed via an old/historical slug or UUID, redirect to canonical slug
  if (data.slug && data.slug !== slug) {
    redirect(`/properties/${encodeURIComponent(data.slug)}`);
  }

  const agent = data.assigned_agent;
  const features = (data.property_features || [])
    .map((pf) => pf.features)
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => ({
      ...f,
      icon_key: (f.icon_key || "check").toString().toLowerCase(),
    }));
  const shareUrl = `${siteConfig.url}/properties/${encodeURIComponent(data.slug || slug)}`;

  // 2. SEO & Schema Generation
  const seo = generatePropertySEO(data, language);

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-20 font-sans">
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structuredData) }}
      />
      {seo.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.faqSchema) }}
        />
      )}
      {seo.breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.breadcrumbSchema) }}
        />
      )}

      <GTMPropertyPageView
        property={{ ...data, popular_area: data.popular_area ?? null }}
      />

      {/* 1 & 2. Responsive Hero Section: On Mobile (<lg) Gallery comes first; On Desktop (lg+) Header comes first */}
      <div className="flex flex-col">
        {/* Header: order-2 on mobile, order-1 on desktop */}
        <div className="order-2 lg:order-1">
          <PropertyHeader
            property={data}
            features={features as any[]}
            className="pt-3 lg:pt-24"
          />
        </div>

        {/* Gallery: order-1 on mobile, order-2 on desktop */}
        <div className="order-1 lg:order-2 pt-16 lg:pt-0">
          <div className="max-w-screen-2xl mx-auto px-4 xs:px-6 sm:px-10 md:px-10 lg:px-12 xl:px-14 2xl:px-8 mt-0 lg:mt-8">
            <section className="mb-0">
              <PropertyGallery
                images={data.images}
                title={getLocaleValue(data, "title", language)}
                propertyId={data.id}
                imageAlt={`${getLocaleValue(data, "title", language)} ${t("seo.in")} ${data.district || ""}, ${data.province || ""}`}
                isHot={!!data.is_hot_deal}
                verified={!!data.verified}
                isCbd={!!data.is_cbd || isCbdProperty(data)}
                petFriendly={!!data.is_pet_friendly}
                allowAirbnb={!!data.allow_airbnb}
                isTaxRegistered={!!data.is_tax_registered}
              />
            </section>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 xs:px-6 sm:px-10 md:px-10 lg:px-12 xl:px-14 2xl:px-8 mt-4 lg:mt-8">
        <RecentPropertyTracker
          property={{
            ...data,
            features,
            image_url: data.images.find((i) => i.is_cover)?.image_url || null,
          }}
        />

        {/* 3. Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 md:gap-10 lg:gap-16 mb-6 md:mb-10">
          {/* Left Content */}
          <div className="space-y-6">
            <PropertySpecs
              {...data}
              type={data.property_type}
              parking={data.parking_slots}
              sizeSqm={data.size_sqm}
              landSize={data.land_size_sqwah}
              office_capacity={data.office_capacity}
            />
            <PropertyBadgesSection property={data} />
            <PropertyDescription property={data} />
            <PropertyFloorPlan floorPlanUrl={data.floor_plan_url} />
            <NearbyPlaces
              propertyId={data.id}
              propertyTitle={data.title}
              location={data.popular_area || undefined}
              data={data.nearby_places}
              transits={data.nearby_transits}
            />
            <hr className="border-slate-100" />
            <PropertyAmenities features={features} />
            <hr className="border-slate-100" />
            <Suspense fallback={<MapSkeleton />}>
              <PropertyMapSection
                propertyId={data.id}
                propertyTitle={data.title}
                googleMapsLink={data.google_maps_link}
                language={language as any}
              />
            </Suspense>
          </div>

          {/* Right Sidebar */}
          <aside className="relative flex flex-col lg:flex-row xl:flex-col gap-6 md:items-stretch w-full">
            <PropertySuitability
              listingType={data.listing_type || "SALE"}
              price={data.price}
              rentalPrice={data.rental_price}
              propertyType={data.property_type}
              allowAirbnb={data.allow_airbnb}
              airbnbDailyPrice={data.airbnb_daily_price}
              airbnbMonthlyPrice={data.airbnb_monthly_price}
              airbnbMinContract={data.airbnb_min_contract}
            />
            <div className="flex-1 xl:flex-none min-w-0 w-full flex flex-col xl:sticky xl:top-24 self-start">
              <AgentSidebar
                agentName={agent?.full_name}
                agentImage={getPublicAvatarUrl(agent?.avatar_url || "")}
                agentPhone={agent?.phone}
                agentLine={agent?.line_id}
                agentWechat={agent?.wechat_user_id}
                agentWhatsapp={agent?.whatsapp_user_id}
                isVerified={true}
                propertyId={data.id}
                propertyTitle={data.title}
                property={data}
                shareUrl={shareUrl}
              />
            </div>
          </aside>
        </div>

        <Suspense fallback={<SimilarPropertiesSkeleton />}>
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
        </Suspense>
      </div>

      <MobilePropertyActions
        agentName={agent?.full_name}
        agentImage={getPublicAvatarUrl(agent?.avatar_url || "")}
        agentPhone={agent?.phone}
        agentLine={agent?.line_id}
        agentWechat={agent?.wechat_user_id}
        agentWhatsapp={agent?.whatsapp_user_id}
        propertyId={data.id}
        propertyTitle={data.title}
        property={data}
      />
    </main>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  return generatePropertyMetadataAsync(slug);
}
