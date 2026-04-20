// Force rebuild
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { HotDealsSkeleton } from "@/components/public/HotDealsSkeleton";
import { MortgageCalculatorSkeleton } from "@/components/public/MortgageCalculatorSkeleton";
import { RecentlyViewedSkeleton } from "@/components/public/RecentlyViewedSkeleton";
import { 
  getPopularAreasAction, 
  getPublicProvincesAction 
} from "@/features/public-data/popular-areas";

// Critical Above-the-Fold components (Stay static for visual stability)
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { StatsBand } from "@/components/public/StatsBand";
import { PartnerSection } from "@/components/public/PartnerSection";

// Lazy loaded components (Scroll-driven or heavy)
const HotDealsSection = dynamic(
  () => import("@/components/public/HotDealsSection").then((mod) => mod.HotDealsSection),
  { loading: () => <HotDealsSkeleton /> }
);

const PopularAreasSection = dynamic(
  () => import("@/components/public/PopularAreasSection").then((mod) => mod.PopularAreasSection),
  // PopularAreasSection has internal loading but we can provide a small shimmer if needed
);

const PropertyListingSection = dynamic(() =>
  import("@/components/public/PropertyListingSection").then((mod) => mod.PropertyListingSection)
);

const RecentlyViewedSection = dynamic(
  () => import("@/components/public/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection),
  { loading: () => <RecentlyViewedSkeleton /> }
);

const MortgageCalculatorSection = dynamic(
  () => import("@/components/public/MortgageCalculatorSection").then((mod) => mod.MortgageCalculatorSection),
  { loading: () => <MortgageCalculatorSkeleton /> }
);

const TrustSection = dynamic(() => import("@/components/public/TrustSection").then((mod) => mod.TrustSection));
const HowItWorksSection = dynamic(() => import("@/components/public/HowItWorksSection").then((mod) => mod.HowItWorksSection));
const DepositPropertySection = dynamic(() => import("@/components/public/DepositPropertySection").then((mod) => mod.DepositPropertySection));
const TestimonialsSection = dynamic(() => import("@/components/public/TestimonialsSection").then((mod) => mod.TestimonialsSection));
const CTASection = dynamic(() => import("@/components/public/CTASection").then((mod) => mod.CTASection));
const BlogSection = dynamic(() => import("@/components/public/BlogSection").then((mod) => mod.BlogSection));
const FAQSection = dynamic(() => import("@/components/public/FAQSection").then((mod) => mod.FAQSection));

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteConfig.name,
    image: `${siteConfig.url}/images/logo.png`,
    description: t("metadata.jsonld_description"),
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.split(",")[0],
      addressLocality: t("metadata.jsonld_address_locality"),
      postalCode: "10110",
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.7563,
      longitude: 100.5018,
    },
    url: siteConfig.url,
    priceRange: "฿฿฿",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* ABOVE THE FOLD: Static for maximum First Impression */}
      <HeroSection />
      <PropertyTypeGrid />
      <StatsBand />
      <PartnerSection />
      
      {/* STRATEGIC CONVERSION: Hot Deals comes first based on Urgency & Conversion Insight */}
      <HotDealsSection />
      
      {/* NAVIGATION & SEO: Popular Areas for Bot Crawling & Layout Flow */}
      <PopularAreasSection initialItems={popularAreas} initialProvinces={provinces} />
      
      {/* BELOW THE FOLD: Dynamic / Lazy */}
      <PropertyListingSection />
      <MortgageCalculatorSection />
      <RecentlyViewedSection />
      <TrustSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <BlogSection />
      <FAQSection />
      <DepositPropertySection />
      <CTASection />
    </div>
  );
}
