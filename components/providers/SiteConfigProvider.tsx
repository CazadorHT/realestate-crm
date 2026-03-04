"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "@/features/site-settings/actions";
import { SiteSettings } from "@/features/site-settings/schema";

const SiteConfigContext = createContext<SiteSettings | undefined>(undefined);

export function SiteConfigProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: SiteSettings;
}) {
  const [settings] = useState<SiteSettings>(initialSettings);

  // We could potentially add a websocket or periodic poll here if needed,
  // but for now, we'll rely on server-side initial fetch and manual refreshes if any.

  return (
    <SiteConfigContext.Provider value={settings}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error("useSiteConfig must be used within a SiteConfigProvider");
  }
  return context;
}
