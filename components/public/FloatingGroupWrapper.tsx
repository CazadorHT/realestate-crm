"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const FloatingRightGroup = dynamic(
  () => import("@/components/public/FloatingRightGroup").then(mod => mod.FloatingRightGroup),
  { ssr: false }
);

// We use a safe client-side wrapper to avoid SSR issues with dynamic(ssr: false)
export function FloatingGroupWrapper() {
  return (
    <Suspense fallback={null}>
      <FloatingRightGroup />
    </Suspense>
  );
}
