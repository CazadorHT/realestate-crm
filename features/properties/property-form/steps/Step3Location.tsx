"use client";

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
export function Step3Location({ form, mode }: Step3Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* Address Section */}
      <AddressSection form={form} />

      {/* Transportation & Nearby Places Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TransitSection form={form} />
        <NearbyPlacesSection form={form} />
      </div>
    </div>
  );
}
