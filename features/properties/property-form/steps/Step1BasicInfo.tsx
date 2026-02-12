"use client";

import * as React from "react";
import {
  ListingTypeSection,
  PropertyTypeSection,
} from "../components/step1-parts";
import { QuickInfoSection } from "@/features/properties/property-form/sections/QuickInfoSection";
import type { Step1Props } from "../types";

/**
 * Step 1: Basic Info
 * Listing type, property type, and quick info section
 * Refactored into separate components
 */
export function Step1BasicInfo({
  form,
  mode,
  popularAreas,
  isAddingArea,
  newArea,
  setNewArea,
  onAddArea,
  isQuickInfoOpen,
  setIsQuickInfoOpen,
}: Step1Props) {
  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 origin-top"
      style={{ zoom: "0.80" }}
    >
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Listing Type Section */}
        <ListingTypeSection form={form} />

        {/* Property Type Section */}
        <PropertyTypeSection
          form={form}
          onPropertyTypeSelect={() => setIsQuickInfoOpen(true)}
        />

        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <div className="pt-2 col-span-1 md:col-span-2 lg:col-span-3">
            <QuickInfoSection
              form={form}
              popularAreas={popularAreas}
              isAddingArea={isAddingArea}
              newArea={newArea}
              setNewArea={setNewArea}
              onAddArea={onAddArea}
            />
          </div>
        )}
      </section>
    </div>
  );
}
