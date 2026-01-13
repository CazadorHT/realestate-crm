// Force rebuild
import { PublicNav } from "@/components/public/PublicNav";
import { HeroSection } from "@/components/public/HeroSection";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { MortgageCalculatorSkeleton } from "@/components/public/MortgageCalculatorSkeleton";
import { HotDealsSkeleton } from "@/components/public/HotDealsSkeleton";
import { PartnerSection } from "@/components/public/PartnerSection";
import { PopularAreasSection } from "@/components/public/PopularAreasSection";
import { PropertyListingSection } from "@/components/public/PropertyListingSection";
import { RecentlyViewedSection } from "@/components/public/RecentlyViewedSection";
import { HotDealsSection } from "@/components/public/HotDealsSection";
import { StatsBand } from "@/components/public/StatsBand";
import { TrustSection } from "@/components/public/TrustSection";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { DepositPropertySection } from "@/components/public/DepositPropertySection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { CTASection } from "@/components/public/CTASection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MortgageCalculatorSection } from "@/components/public/MortgageCalculatorSection";
import { BlogSection } from "@/components/public/BlogSection";
import { FAQSection } from "@/components/public/FAQSection";

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
      {/* Awareness (ช่วงต้น: ดึงดูดสายตาและสร้างความเชื่อมั่นทันที) */}
      <PublicNav />
      <HeroSection />
      <PropertyTypeGrid />
      <StatsBand />
      <PartnerSection />

      {/* Interest (ช่วงกลาง: กระตุ้นความอยากดูต่อ) */}
      <PopularAreasSection />
      <HotDealsSection />
      <PropertyListingSection />

      {/* Desire & Utility (ช่วงเสริม: ช่วยในการตัดสินใจ) */}
      <MortgageCalculatorSection />
      <RecentlyViewedSection />
      <TrustSection />
      <HowItWorksSection />

      {/* Social Proof & Content (ช่วงสร้างความมั่นใจ) */}
      <TestimonialsSection />
      <BlogSection />
      <FAQSection />

      {/* Action (ช่วงสุดท้าย: กระตุ้นการกระทำ) */}
      <DepositPropertySection />
      <CTASection />
    </div>
  );
}
