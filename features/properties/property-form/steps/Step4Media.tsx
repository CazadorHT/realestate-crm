"use client";

import * as React from "react";
import type { Step4Props } from "../types";
import { MediaSection } from "../components/step4-parts/MediaSection";
import { ManagementSection } from "../components/step4-parts/ManagementSection";
import { AdditionalSection } from "../components/step4-parts/AdditionalSection";

/**
 * Step 4: Media & Management
 * Refactored into sub-components for better maintainability.
 */
export const Step4Media = React.memo(Step4MediaComponent);

function Step4MediaComponent({
  form,
  mode,
  owners,
  agents,
  initialImages,
  uploadSessionId,
  persistImages,
}: Step4Props) {
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Gallery (60%) */}
        <div className="lg:col-span-7 space-y-6">
          <MediaSection
            form={form}
            uploadSessionId={uploadSessionId}
            initialImages={initialImages}
          />
        </div>

        {/* Right Column: Management & Details (40%) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Management (Status, Owner, Agents) */}
          <ManagementSection form={form} owners={owners} agents={agents} />

          {/* Card 2: Source & Co-Agent */}
          <AdditionalSection form={form} />
        </div>
      </div>
    </div>
  );
}
