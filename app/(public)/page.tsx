// Force rebuild
import dynamic from "next/dynamic";

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

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ค้นหาบ้าน คอนโด ออฟฟิศ ขาย/เช่า | OMA Asset",
  description:
    "แหล่งรวมประกาศขาย/เช่า บ้าน คอนโด ออฟฟิศ ที่ดิน สำนักงาน อสังหาริมทรัพย์คุณภาพ ตรวจสอบแล้ว 100% พร้อมระบบ Smart Match ช่วยค้นหาบ้านในฝันของคุณ",
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "OMA Asset",
    image: `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com"}/images/logo.png`, // Replace with actual domain/logo
    description:
      "ศูนย์รวมประกาศอสังหาริมทรัพย์ออนไลน์ ค้นหาง่าย ฝากขายรวดเร็ว พร้อมบริการดูแลโดยมืออาชีพ",
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
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com", // Replace with actual domain
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
      {/* Awareness (ช่วงต้น: ดึงดูดสายตาและสร้างความเชื่อมั่นทันที) */}
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
