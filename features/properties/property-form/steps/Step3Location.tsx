"use client";

import { useFormContext } from "react-hook-form";
import { PropertyFormValues } from "../../schema";
import type { Step3Props } from "../types";
import {
  AddressSection,
  TransitSection,
  NearbyPlacesSection,
} from "../components/step3-parts";

/**
 * Step 3: Location
 * Address fields and transit information
 * Refactored into separate components for easier debugging
 */
export function Step3Location({ mode }: Step3Props) {
  const form = useFormContext<PropertyFormValues>();
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* Address Section */}
      <AddressSection />

      {/* Transportation & Nearby Places Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TransitSection />
        <NearbyPlacesSection />
      </div>
    </div>
  );
}
