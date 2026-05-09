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
import { getBlogPosts } from "@/lib/services/blog";

// Critical Above-the-Fold components (Stay static for visual stability)
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { StatsBand } from "@/components/public/StatsBand";
import { PartnerSection } from "@/components/public/PartnerSection";
import { PropertyListingSkeleton } from "@/components/public/PropertyListingSkeleton";
import { 
  RecentlyViewedSection, 
  MortgageCalculatorSection, 
  CTASection 
} from "@/components/public/PublicClientSections";

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

  // 5. Hot Deals for Promotion (Pre-loaded)
  const hotDealsData = await getPublicProperties({ filter: 'hot_deals', limit: 4 });
  const hotDeals = hotDealsData.properties;

  // 6. Latest Blog Posts for SSR Performance
  const initialPosts = await getBlogPosts(undefined, 4);

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
        <HeroSection hasProperties={!!(initialProperties && initialProperties.length > 0)} />
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
      {hotDeals && hotDeals.length > 0 && (
        <div className="min-h-[700px] md:min-h-[800px]">
          <HotDealsSection initialProperties={hotDeals} />
        </div>
      )}
      
      {/* NAVIGATION & SEO: Popular Areas */}
      {popularAreas && popularAreas.length > 0 && (
        <div className="min-h-[450px] md:min-h-[500px]">
          <PopularAreasSection initialItems={popularAreas} initialProvinces={provinces} />
        </div>
      )}
      
      {/* BELOW THE FOLD: Dynamic / Lazy with realistic height placeholders */}
      <div className={initialProperties && initialProperties.length > 0 ? "min-h-[1200px] md:min-h-[1400px] flex flex-col" : "py-12 flex flex-col"}>
        {initialProperties && initialProperties.length > 0 ? (
          <PropertyListingSection initialProperties={initialProperties} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 mx-4 md:mx-8">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t("properties.not_found") || "ยังไม่ได้ลงประกาศทรัพย์"}</h3>
            <p className="text-slate-500 max-w-md">
              {t("properties.check_back_later") || "ขณะนี้ยังไม่มีรายการทรัพย์อัปเดตในระบบ โปรดกลับมาตรวจสอบใหม่อีกครั้งในภายหลัง"}
            </p>
          </div>
        )}
      </div>
      
      <div className="min-h-[400px] md:min-h-[450px]">
        <MortgageCalculatorSection />
      </div>
      
      <div>
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
        <BlogSection initialPosts={initialPosts} />
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
