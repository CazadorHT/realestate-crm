// Force rebuild
import { PublicNav } from "@/components/public/PublicNav";
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { MortgageCalculatorSkeleton } from "@/components/public/MortgageCalculatorSkeleton";
import { HotDealsSkeleton } from "@/components/public/HotDealsSkeleton";
import dynamic from "next/dynamic";

// Lazy load below-the-fold components for better performance
const PopularAreasSection = dynamic(
  () =>
    import("@/components/public/PopularAreasSection").then((mod) => ({
      default: mod.PopularAreasSection,
    })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse" /> }
);

const PropertyListingSection = dynamic(
  () =>
    import("@/components/public/PropertyListingSection").then((mod) => ({
      default: mod.PropertyListingSection,
    })),
  { loading: () => <div className="h-screen bg-white animate-pulse" /> }
);

const RecentlyViewedSection = dynamic(
  () =>
    import("@/components/public/RecentlyViewedSection").then((mod) => ({
      default: mod.RecentlyViewedSection,
    })),
  { loading: () => <div className="h-96 bg-white animate-pulse" /> }
);

const HotDealsSection = dynamic(
  () =>
    import("@/components/public/HotDealsSection").then((mod) => ({
      default: mod.HotDealsSection,
    })),
  { loading: () => <HotDealsSkeleton /> }
);

const StatsBand = dynamic(
  () =>
    import("@/components/public/StatsBand").then((mod) => ({
      default: mod.StatsBand,
    })),
  { loading: () => <div className="h-32 bg-slate-50 animate-pulse" /> }
);

const TrustSection = dynamic(
  () =>
    import("@/components/public/TrustSection").then((mod) => ({
      default: mod.TrustSection,
    })),
  { loading: () => <div className="h-64 bg-white animate-pulse" /> }
);

const HowItWorksSection = dynamic(
  () =>
    import("@/components/public/HowItWorksSection").then((mod) => ({
      default: mod.HowItWorksSection,
    })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse" /> }
);

const DepositPropertySection = dynamic(
  () =>
    import("@/components/public/DepositPropertySection").then((mod) => ({
      default: mod.DepositPropertySection,
    })),
  { loading: () => <div className="h-64 bg-white animate-pulse" /> }
);

const TestimonialsSection = dynamic(
  () =>
    import("@/components/public/TestimonialsSection").then((mod) => ({
      default: mod.TestimonialsSection,
    })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse" /> }
);

const CTASection = dynamic(
  () =>
    import("@/components/public/CTASection").then((mod) => ({
      default: mod.CTASection,
    })),
  { loading: () => <div className="h-64 bg-blue-50 animate-pulse" /> }
);

const PublicFooter = dynamic(
  () =>
    import("@/components/public/PublicFooter").then((mod) => ({
      default: mod.PublicFooter,
    })),
  { loading: () => <div className="h-96 bg-slate-900 animate-pulse" /> }
);

const PartnerSection = dynamic(
  () =>
    import("@/components/public/PartnerSection").then((mod) => ({
      default: mod.PartnerSection,
    })),
  { loading: () => <div className="h-32 bg-white animate-pulse" /> }
);

const MortgageCalculatorSection = dynamic(
  () =>
    import("@/components/public/MortgageCalculatorSection").then((mod) => ({
      default: mod.MortgageCalculatorSection,
    })),
  { loading: () => <MortgageCalculatorSkeleton /> }
);

const BlogSection = dynamic(
  () =>
    import("@/components/public/BlogSection").then((mod) => ({
      default: mod.BlogSection,
    })),
  { loading: () => <div className="h-96 bg-slate-50 animate-pulse" /> }
);

const FAQSection = dynamic(
  () =>
    import("@/components/public/FAQSection").then((mod) => ({
      default: mod.FAQSection,
    })),
  { loading: () => <div className="h-96 bg-white animate-pulse" /> }
);

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค้นหาบ้าน คอนโด ที่ดิน สำนักงาน ขาย/เช่า | Real Estate CRM",
  description:
    "แหล่งรวมประกาศขาย/เช่า บ้าน คอนโด ที่ดิน สำนักงาน อสังหาริมทรัพย์คุณภาพ ตรวจสอบแล้ว 100% พร้อมระบบ Smart Match ช่วยค้นหาบ้านในฝันของคุณ",
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Real Estate CRM",
    image: "https://your-domain.com/images/logo.png", // Replace with actual domain/logo
    description: "แพลตฟอร์มบริหารงานขายอสังหาริมทรัพย์ครบวงจร",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Business Road",
      addressLocality: "Bangkok",
      postalCode: "10110",
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.7563,
      longitude: 100.5018,
    },
    url: "https://your-domain.com", // Replace with actual domain
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Above the fold - load immediately */}
      <PublicNav />
      <HeroSection />
      <PropertyTypeGrid />

      {/* Below the fold - lazy load */}
      <PartnerSection />
      <PopularAreasSection />
      <HotDealsSection />
      <PropertyListingSection />
      <MortgageCalculatorSection />
      <RecentlyViewedSection />
      <StatsBand />
      <TrustSection />
      <HowItWorksSection />
      <BlogSection />
      <FAQSection />
      <DepositPropertySection />
      <TestimonialsSection />
      <CTASection />
      <PublicFooter />
    </div>
  );
}
