"use client";

import dynamic from "next/dynamic";

const CookieConsent = dynamic(() => import("@/components/common/CookieConsent").then(mod => mod.CookieConsent), { ssr: false });
const GTMScrollTracker = dynamic(() => import("@/components/providers/GTMScrollTracker").then(mod => mod.GTMScrollTracker), { ssr: false });

export function DynamicClientProviders() {
  return (
    <>
      <CookieConsent />
      <GTMScrollTracker />
    </>
  );
}
