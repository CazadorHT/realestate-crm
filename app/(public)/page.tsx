// Force rebuild
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { HotDealsSkeleton } from "@/components/public/HotDealsSkeleton";
import { MortgageCalculatorSkeleton } from "@/components/public/MortgageCalculatorSkeleton";
import { RecentlyViewedSkeleton } from "@/components/public/RecentlyViewedSkeleton";
import { PopularAreasSkeleton } from "@/components/public/PopularAreasSkeleton";
import { SectionSkeleton } from "@/components/public/SectionSkeleton";
import { PropertyCardSkeleton } from "@/components/public/PropertyCardSkeleton";
import { 
  getPopularAreasAction, 
  getPublicProvincesAction 
} from "@/features/public-data/popular-areas";
import { getPublicProperties } from "@/lib/services/properties";

// Critical Above-the-Fold components (Stay static for visual stability)
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { StatsBand } from "@/components/public/StatsBand";
import { PartnerSection } from "@/components/public/PartnerSection";
import { PropertyListingSkeleton } from "@/components/public/PropertyListingSkeleton";

// Lazy loaded components (Scroll-driven or heavy)
const HotDealsSection = dynamic(
  () => import("@/components/public/HotDealsSection").then((mod) => mod.HotDealsSection),
  { loading: () => <HotDealsSkeleton /> }
);

const PopularAreasSection = dynamic(
  () => import("@/components/public/PopularAreasSection").then((mod) => mod.PopularAreasSection),
  { loading: () => <PopularAreasSkeleton /> }
);

const PropertyListingSection = dynamic(
  () => import("@/components/public/PropertyListingSection").then((mod) => mod.PropertyListingSection),
  { loading: () => <PropertyListingSkeleton /> }
);

const RecentlyViewedSection = dynamic(
  () => import("@/components/public/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection),
  { loading: () => <RecentlyViewedSkeleton /> }
);

const MortgageCalculatorSection = dynamic(
  () => import("@/components/public/MortgageCalculatorSection").then((mod) => mod.MortgageCalculatorSection),
  { loading: () => <MortgageCalculatorSkeleton /> }
);

const TrustSection = dynamic(
  () => import("@/components/public/TrustSection").then((mod) => mod.TrustSection),
  { loading: () => <SectionSkeleton /> }
);

const HowItWorksSection = dynamic(
  () => import("@/components/public/HowItWorksSection").then((mod) => mod.HowItWorksSection),
  { loading: () => <SectionSkeleton /> }
);

const DepositPropertySection = dynamic(
  () => import("@/components/public/DepositPropertySection").then((mod) => mod.DepositPropertySection),
  { loading: () => <SectionSkeleton /> }
);

const TestimonialsSection = dynamic(
  () => import("@/components/public/TestimonialsSection").then((mod) => mod.TestimonialsSection),
  { loading: () => <SectionSkeleton /> }
);

const CTASection = dynamic(
  () => import("@/components/public/CTASection").then((mod) => mod.CTASection),
  { loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse" /> }
);

const BlogSection = dynamic(
  () => import("@/components/public/BlogSection").then((mod) => mod.BlogSection),
  { loading: () => <SectionSkeleton /> }
);

const FAQSection = dynamic(
  () => import("@/components/public/FAQSection").then((mod) => mod.FAQSection),
  { loading: () => <SectionSkeleton /> }
);

// S-Tier Scaling: Static generation with one-day revalidation (The Long-Cache Hardening)
export const revalidate = 86400;

/**
 * [S-Tier] Hardened Metadata Generator
 * Dynamically switches locale and canonicals for global-grade SEO.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t, language } = await getServerTranslations();
  
  // Dynamic Locale Mapping
  const localeMap: Record<string, string> = {
    th: "th_TH",
    en: "en_US",
    cn: "zh_CN",
    ru: "ru_RU",
  };
  const currentLocale = localeMap[language] || "th_TH";

  return {
    title: t("metadata.home_title", { siteName: siteConfig.name }),
    description: t("metadata.home_description"),
    openGraph: {
      type: "website",
      locale: currentLocale,
      url: siteConfig.url,
      title: t("metadata.home_title", { siteName: siteConfig.name }),
      description: t("metadata.home_description"),
      siteName: siteConfig.name,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.home_title", { siteName: siteConfig.name }),
      description: t("metadata.home_description"),
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
    alternates: {
      canonical: siteConfig.url,
      languages: {
        "th-TH": `${siteConfig.url}?lang=th`,
        "en-US": `${siteConfig.url}?lang=en`,
        "zh-CN": `${siteConfig.url}?lang=cn`,
        "ru-RU": `${siteConfig.url}?lang=ru`,
        "x-default": siteConfig.url,
      },
    },
    other: {
      "tiktok-developers-site-verification": siteConfig.verificationTokens.tiktok,
      "tiktok-site-verification": siteConfig.verificationTokens.tiktok,
    },
  };
}

export default async function LandingPage() {
  const { t } = await getServerTranslations();

  // 1. Edge-Cached Province Data
  const provinces = await getPublicProvincesAction();
  
  // 2. Resolve Initial Province (Prefer BKK)
  const bkkIndex = provinces.findIndex(p => p.display === "Bangkok" || p.id === "กรุงเทพมหานคร");
  const initialProvinceId = bkkIndex !== -1 ? provinces[bkkIndex].id : provinces[0]?.id;
  
  // 3. Edge-Cached Popular Areas
  const popularAreas = await getPopularAreasAction(initialProvinceId);

  // 4. Initial Properties for SSR Speed (S-Tier Performance)
  const initialPropertiesData = await getPublicProperties({ limit: 8 });
  const initialProperties = initialPropertiesData.properties;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteConfig.name,
    image: `${siteConfig.url}/images/logo.png`,
    description: t("metadata.jsonld_description"),
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    priceRange: "฿฿฿",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.split(",")[0] || "99/99 Sukhumvit Road", // ใส่ที่อยู่จริงได้ที่นี่
      addressLocality: t("metadata.jsonld_address_locality") || "Bangkok",
      addressRegion: "Bangkok",
      postalCode: "10110",
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.7563,
      longitude: 100.5018,
    },
    sameAs: [
      siteConfig.links.facebook,
      siteConfig.links.instagram,
      siteConfig.links.line,
      siteConfig.links.tiktok,
    ].filter(Boolean),
    areaServed: {
      "@type": "Country",
      name: "Thailand",
    },
    serviceType: [
      t("home.property_types.house"),
      t("home.property_types.condo"),
      t("home.property_types.office"),
      t("home.property_types.townhome"),
      "Real Estate Brokerage",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: 1250,
      bestRating: 5,
      worstRating: 1,
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "K. Somchai" },
        datePublished: "2024-12-01",
        reviewBody: "บริการดีเยี่ยมมากครับ หาคอนโดได้ตรงใจมาก",
        reviewRating: { "@type": "Rating", ratingValue: 5 }
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "K. Patchara" },
        datePublished: "2025-01-15",
        reviewBody: "ดูแลดีทุกขั้นตอน ตั้งแต่ดูบ้านจนถึงโอนกรรมสิทธิ์",
        reviewRating: { "@type": "Rating", ratingValue: 5 }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden scroll-smooth selection:bg-blue-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* ABOVE THE FOLD: Static for maximum First Impression & Zero CLS */}
      <div className="relative">
        <HeroSection />
      </div>
      
      <div className="min-h-[300px] md:min-h-[350px]">
        <PropertyTypeGrid />
      </div>
      
      <div className="min-h-[80px] md:min-h-[100px]">
        <StatsBand />
      </div>
      
      <div className="min-h-[150px] md:min-h-[200px]">
        <PartnerSection />
      </div>
      
      {/* STRATEGIC CONVERSION: Hot Deals with optimized skeleton height */}
      <div className="min-h-[700px] md:min-h-[800px]">
        <HotDealsSection />
      </div>
      
      {/* NAVIGATION & SEO: Popular Areas */}
      <div className="min-h-[450px] md:min-h-[500px]">
        <PopularAreasSection initialItems={popularAreas} initialProvinces={provinces} />
      </div>
      
      {/* BELOW THE FOLD: Dynamic / Lazy with realistic height placeholders */}
      <div className="min-h-[1200px] md:min-h-[1400px]">
        <PropertyListingSection initialProperties={initialProperties} />
      </div>
      
      <div className="min-h-[400px] md:min-h-[450px]">
        <MortgageCalculatorSection />
      </div>
      
      <div className="min-h-[450px] md:min-h-[500px]">
        <RecentlyViewedSection />
      </div>
      
      <div className="min-h-[500px] md:min-h-[600px]">
        <TrustSection />
      </div>
      
      <div className="min-h-[500px] md:min-h-[600px]">
        <HowItWorksSection />
      </div>
      
      <div className="min-h-[500px] md:min-h-[600px]">
        <TestimonialsSection />
      </div>
      
      <div className="min-h-[500px] md:min-h-[600px]">
        <BlogSection />
      </div>
      
      <div className="min-h-[400px] md:min-h-[500px]">
        <FAQSection />
      </div>
      
      <div className="min-h-[500px] md:min-h-[600px]">
        <DepositPropertySection />
      </div>
      
      <div className="min-h-[350px] md:min-h-[400px]">
        <CTASection />
      </div>
    </div>
  );
}
