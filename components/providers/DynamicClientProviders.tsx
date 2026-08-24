"use client";

import dynamic from "next/dynamic";
import { ThirdPartyStubs } from "./ThirdPartyStubs";
import { GTMInteractionLoader } from "./GTMInteractionLoader";

const CookieConsent = dynamic(() => import("@/components/common/CookieConsent").then(mod => mod.CookieConsent), { ssr: false });
const GTMScrollTracker = dynamic(() => import("@/components/providers/GTMScrollTracker").then(mod => mod.GTMScrollTracker), { ssr: false });

export function DynamicClientProviders({ gtmId }: { gtmId?: string | null }) {
  return (
    <>
      <ThirdPartyStubs />
      {gtmId ? <GTMInteractionLoader gtmId={gtmId} /> : null}
      <CookieConsent />
      <GTMScrollTracker />
    </>
  );
}

