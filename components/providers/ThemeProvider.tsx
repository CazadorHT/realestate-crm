"use client";

import React, { useEffect } from "react";
import { useTenant } from "./TenantProvider";
import { hexToHslValues } from "@/lib/theme-utils";

/**
 * ThemeProvider injects dynamic CSS variables into the document root
 * Based on the active tenant's branding settings.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeTenant } = useTenant();

  useEffect(() => {
    if (!activeTenant?.settings) return;

    const theme = (activeTenant.settings as any).theme;
    if (!theme) {
      // Clear overrides if no theme
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      return;
    }

    if (theme.primary) {
      const hsl = hexToHslValues(theme.primary);
      document.documentElement.style.setProperty("--primary", hsl);

      // Basic accessibility: set foreground based on lightness
      const lightness = parseInt(hsl.split(" ")[2]);
      document.documentElement.style.setProperty(
        "--primary-foreground",
        lightness > 60 ? "222 47% 11%" : "210 40% 98%",
      );
    }

    if (theme.secondary) {
      document.documentElement.style.setProperty(
        "--secondary",
        hexToHslValues(theme.secondary),
      );
    }

    // You can add more variables here as needed (e.g. radius, background etc.)
  }, [activeTenant]);

  return <>{children}</>;
}
