"use client";

import { useFormContext } from "react-hook-form";
import { PropertyFormValues } from "../../schema";
import type { Step2Props } from "../types";
import { PriceSection } from "../components/step2-parts/PriceSection";
import { SpecsSection } from "../components/step2-parts/SpecsSection";
import { DescriptionSection } from "../components/step2-parts/DescriptionSection";
import { SpecialFeaturesSection } from "@/features/properties/property-form/components/step2-parts/SpecialFeaturesSection";
import { CommissionSection } from "../components/step2-parts/CommissionSection";

export const Step2Details = Step2DetailsComponent;

function Step2DetailsComponent({ mode }: Step2Props) {
  const form = useFormContext<PropertyFormValues>();
  const listingType = form.watch("listing_type");
  // Check if mode is unsupported "view" or "readonly" (future proofing, though types restrict it now)
  const isReadOnly =
    (mode as string) === "view" || (mode as string) === "readonly";

  const showSale = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRent = listingType === "RENT" || listingType === "SALE_AND_RENT";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-6 duration-500">
      {/* Price & Conditions */}
      <PriceSection
        isReadOnly={isReadOnly}
        showSale={showSale}
        showRent={showRent}
      />
 
      {/* Specs & Size */}
      <SpecsSection isReadOnly={isReadOnly} />
 
      {/* Description & Special Features */}
      <div className="grid grid-cols-1 sm:gap-6 lg:grid-cols-6">
        <DescriptionSection isReadOnly={isReadOnly} />
        <SpecialFeaturesSection isReadOnly={isReadOnly} />
      </div>
 
      {/* Commission */}
      <CommissionSection
        isReadOnly={isReadOnly}
        showSale={showSale}
        showRent={showRent}
      />
    </div>
  );
}
