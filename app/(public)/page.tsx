// Force rebuild
import { HeroTitle } from "@/components/public/HeroTitle";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import { PropertyListingSection } from "@/components/public/PropertyListingSection";

import { PublicNav } from "@/components/public/PublicNav";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { StatsBand } from "@/components/public/StatsBand";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { TrustSection } from "@/components/public/TrustSection";
import { HeroSection } from "@/components/public/HeroSection";
import { CTASection } from "@/components/public/CTASection";
import { PopularAreasSection } from "@/components/public/PopularAreasSection";
import { DepositPropertySection } from "@/components/public/DepositPropertySection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <PublicNav />

      <HeroSection />
      <PropertyTypeGrid />
      <PopularAreasSection />
      <PropertyListingSection />
      <StatsBand />
      <TrustSection />
      <HowItWorksSection />
      <DepositPropertySection />
      <TestimonialsSection />
      <CTASection />
      <PublicFooter />
    </div>
  );
}
