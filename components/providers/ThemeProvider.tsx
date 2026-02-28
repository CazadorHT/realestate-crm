"use client";

import React, { useEffect } from "react";
import { useTenant } from "./TenantProvider";
import { hexToHslValues, generateColorScale } from "@/lib/theme-utils";

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
      const scale = generateColorScale(theme.primary);

      if (scale) {
        Object.entries(scale).forEach(([step, value]) => {
          document.documentElement.style.setProperty(
            `--brand-${step}`,
            value as string,
          );
        });
      }

      // Legacy support for --primary
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
      const scale = generateColorScale(theme.secondary);
      if (scale) {
        Object.entries(scale).forEach(([step, value]) => {
          document.documentElement.style.setProperty(
            `--secondary-${step}`,
            value as string,
          );
        });
      }
      // Legacy support
      document.documentElement.style.setProperty(
        "--secondary",
        hexToHslValues(theme.secondary),
      );
    }

    if (theme.neutral) {
      const scale = generateColorScale(theme.neutral);
      if (scale) {
        Object.entries(scale).forEach(([step, value]) => {
          document.documentElement.style.setProperty(
            `--neutral-${step}`,
            value as string,
          );
        });
      }
      // Legacy support
      document.documentElement.style.setProperty(
        "--background",
        hexToHslValues(theme.neutral),
      );
    }
  }, [activeTenant]);

  return <>{children}</>;
}
