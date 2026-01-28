"use client";

import React from "react";
import type { Step2Props } from "../types";
import { PriceSection } from "../components/step2-parts/PriceSection";
import { SpecsSection } from "../components/step2-parts/SpecsSection";
import { DescriptionSection } from "../components/step2-parts/DescriptionSection";
import { SpecialFeaturesSection } from "../components/step2-parts/SpecialFeaturesSection";
import { CommissionSection } from "../components/step2-parts/CommissionSection";

export const Step2Details = Step2DetailsComponent;

function Step2DetailsComponent({ form, mode }: Step2Props) {
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
        form={form}
        isReadOnly={isReadOnly}
        showSale={showSale}
        showRent={showRent}
      />

      {/* Specs & Size */}
      <SpecsSection form={form} isReadOnly={isReadOnly} />

      {/* Description & Special Features */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DescriptionSection form={form} isReadOnly={isReadOnly} />
        <SpecialFeaturesSection form={form} isReadOnly={isReadOnly} />
      </div>

      {/* Commission */}
      <CommissionSection
        form={form}
        isReadOnly={isReadOnly}
        showSale={showSale}
        showRent={showRent}
      />
    </div>
  );
}
