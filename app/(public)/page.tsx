// Force rebuild
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

// Critical components loaded immediately
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { StatsBand } from "@/components/public/StatsBand";
import { PartnerSection } from "@/components/public/PartnerSection";

// Lazy loaded components (below the fold)
const PopularAreasSection = dynamic(() =>
  import("@/components/public/PopularAreasSection").then(
    (mod) => mod.PopularAreasSection,
  ),
);
const PropertyListingSection = dynamic(() =>
  import("@/components/public/PropertyListingSection").then(
    (mod) => mod.PropertyListingSection,
  ),
);
const RecentlyViewedSection = dynamic(() =>
  import("@/components/public/RecentlyViewedSection").then(
    (mod) => mod.RecentlyViewedSection,
  ),
);
const HotDealsSection = dynamic(() =>
  import("@/components/public/HotDealsSection").then(
    (mod) => mod.HotDealsSection,
  ),
);
const TrustSection = dynamic(() =>
  import("@/components/public/TrustSection").then((mod) => mod.TrustSection),
);
const HowItWorksSection = dynamic(() =>
  import("@/components/public/HowItWorksSection").then(
    (mod) => mod.HowItWorksSection,
  ),
);
const DepositPropertySection = dynamic(() =>
  import("@/components/public/DepositPropertySection").then(
    (mod) => mod.DepositPropertySection,
  ),
);
const TestimonialsSection = dynamic(() =>
  import("@/components/public/TestimonialsSection").then(
    (mod) => mod.TestimonialsSection,
  ),
);
const CTASection = dynamic(() =>
  import("@/components/public/CTASection").then((mod) => mod.CTASection),
);
const MortgageCalculatorSection = dynamic(() =>
  import("@/components/public/MortgageCalculatorSection").then(
    (mod) => mod.MortgageCalculatorSection,
  ),
);
const BlogSection = dynamic(() =>
  import("@/components/public/BlogSection").then((mod) => mod.BlogSection),
);
const FAQSection = dynamic(() =>
  import("@/components/public/FAQSection").then((mod) => mod.FAQSection),
);

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("metadata.home_title"),
    description: t("metadata.home_description"),
  };
}

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: siteConfig.name,
    image: `${siteConfig.url}/images/logo.png`,
    description:
      "ศูนย์รวมประกาศอสังหาริมทรัพย์ออนไลน์ ค้นหาง่าย ฝากขายรวดเร็ว พร้อมบริการดูแลโดยมืออาชีพ",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.split(",")[0],
      addressLocality: "Bangkok",
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
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
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
      <HeroSection />
      <PropertyTypeGrid />
      <StatsBand />
      <PartnerSection />
      <PopularAreasSection />
      <HotDealsSection />
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
