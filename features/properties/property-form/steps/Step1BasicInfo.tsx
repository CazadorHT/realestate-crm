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
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:col-span-2 gap-6">

        {/* Branch Section */}
        <BranchSection branches={branches} />
        {/* Listing Type Section */}
        <ListingTypeSection />
        </div>
 
        {/* Property Type Section */}
        <PropertyTypeSection
          onPropertyTypeSelect={() => {
            setIsQuickInfoOpen(true);
            setTimeout(() => {
              const el = document.getElementById("quick-info-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                const firstInput = el.querySelector("input");
                if (firstInput) {
                  firstInput.focus({ preventScroll: true });
                }
              }
            }, 100);
          }}
        />
 
        {/* Quick Info Section */}
        {isQuickInfoOpen && (
          <div id="quick-info-section" className="pt-2 col-span-1 md:col-span-2 scroll-mt-6">
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
