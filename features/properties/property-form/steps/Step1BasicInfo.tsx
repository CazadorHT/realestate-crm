"use client";

import { useFormContext } from "react-hook-form";
import {
  ListingTypeSection,
  PropertyTypeSection,
  BranchSection,
} from "../components/step1-parts";
import { QuickInfoSection } from "@/features/properties/property-form/sections/QuickInfoSection";
import type { Step1Props } from "../types";
import { PropertyFormValues } from "../../schema";

/**
 * Step 1: Basic Info
 * Listing type, property type, and quick info section
 * Refactored into separate components
 */
export function Step1BasicInfo({
  mode,
  popularAreas,
  isAddingArea,
  newArea,
  setNewAreaAction,
  newAreaEn,
  setNewAreaEnAction,
  newAreaCn,
  setNewAreaCnAction,
  newAreaRu,
  setNewAreaRuAction,
  onAddAreaAction,
  isQuickInfoOpen,
  setIsQuickInfoOpen,
  branches,
}: Step1Props) {
  const form = useFormContext<PropertyFormValues>();
  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 origin-top"
      style={{ zoom: "0.80" }}
    >
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Branch Section */}
        <BranchSection branches={branches} />

        {/* Listing Type Section */}
        <ListingTypeSection />
 
        {/* Property Type Section */}
        <PropertyTypeSection
          onPropertyTypeSelect={() => setIsQuickInfoOpen(true)}
        />
 
        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <div className="pt-2 col-span-1 md:col-span-1 lg:col-span-3">
            <QuickInfoSection
              popularAreas={popularAreas}
              isAddingArea={isAddingArea}
              newArea={newArea}
              setNewAreaAction={setNewAreaAction}
              newAreaEn={newAreaEn}
              setNewAreaEnAction={setNewAreaEnAction}
              newAreaCn={newAreaCn}
              setNewAreaCnAction={setNewAreaCnAction}
              newAreaRu={newAreaRu}
              setNewAreaRuAction={setNewAreaRuAction}
              onAddAreaAction={onAddAreaAction}
            />
          </div>
        )}
      </section>
    </div>
  );
}
