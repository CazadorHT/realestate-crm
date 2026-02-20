import { getSiteSettings } from "@/features/site-settings/actions";
import { SiteSettingsProvider } from "./SiteSettingsProvider";
import { BRAND_PROFILES } from "@/lib/brand-profiles";

// Map border radius settings to CSS values
const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

// Map button radius to CSS values
const BTN_RADIUS_MAP: Record<string, string> = {
  square: "0px",
  rounded: "0.5rem",
  pill: "9999px",
};

// Convert font name to Google Fonts URL format
function fontToGoogleUrl(fontName: string): string {
  return fontName.replace(/\s+/g, "+");
}

export default async function BrandThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  // Determine which colors to use based on profile
  let primary = settings.brand_primary_color;
  let secondary = settings.brand_secondary_color;
  let gradientFrom = settings.brand_gradient_from;
  let gradientTo = settings.brand_gradient_to;

  if (settings.brand_active_profile !== "custom") {
    const profile = BRAND_PROFILES[settings.brand_active_profile];
    if (profile) {
      primary = profile.primary;
      secondary = profile.secondary;
      gradientFrom = profile.gradientFrom;
      gradientTo = profile.gradientTo;
    }
  }

  // Phase 1: Typography
  const headingFont = settings.brand_heading_font || "Prompt";
  const bodyFont = settings.brand_body_font || "Noto Sans Thai";

  // Phase 1: Border Radius
  const radiusValue = RADIUS_MAP[settings.brand_border_radius] || "0.5rem";

  // Phase 1: Button Geometry — per-style radius
  const solidRadius = BTN_RADIUS_MAP[settings.brand_solid_radius] || "0.5rem";
  const outlineRadius =
    BTN_RADIUS_MAP[settings.brand_outline_radius] || "0.5rem";
  const ghostRadius = BTN_RADIUS_MAP[settings.brand_ghost_radius] || "0.5rem";

  // Create the CSS variable overrides
  const styles = `
    :root {
      --primary: ${primary};
      --brand-primary: ${primary};
      --secondary: ${secondary};
      --brand-secondary: ${secondary};
      --brand-gradient-from: ${gradientFrom};
      --brand-gradient-to: ${gradientTo};
      --radius: ${radiusValue};
      --font-heading: '${headingFont}', 'Prompt', sans-serif;
      --font-body: '${bodyFont}', 'Noto Sans Thai', sans-serif;
      --btn-solid-radius: ${solidRadius};
      --btn-outline-radius: ${outlineRadius};
      --btn-ghost-radius: ${ghostRadius};

      /* Color Scales (50-900) using color-mix */
      /* Primary Scale */
      --brand-primary-50: color-mix(in srgb, hsl(var(--brand-primary)), white 95%);
      --brand-primary-100: color-mix(in srgb, hsl(var(--brand-primary)), white 90%);
      --brand-primary-200: color-mix(in srgb, hsl(var(--brand-primary)), white 70%);
      --brand-primary-300: color-mix(in srgb, hsl(var(--brand-primary)), white 50%);
      --brand-primary-400: color-mix(in srgb, hsl(var(--brand-primary)), white 20%);
      --brand-primary-500: hsl(var(--brand-primary));
      --brand-primary-600: color-mix(in srgb, hsl(var(--brand-primary)), black 10%);
      --brand-primary-700: color-mix(in srgb, hsl(var(--brand-primary)), black 25%);
      --brand-primary-800: color-mix(in srgb, hsl(var(--brand-primary)), black 40%);
      --brand-primary-900: color-mix(in srgb, hsl(var(--brand-primary)), black 60%);

      /* Secondary Scale */
      --brand-secondary-100: color-mix(in srgb, hsl(var(--brand-secondary)), white 90%);
      --brand-secondary-200: color-mix(in srgb, hsl(var(--brand-secondary)), white 70%);
      --brand-secondary-500: hsl(var(--brand-secondary));
      --brand-secondary-600: color-mix(in srgb, hsl(var(--brand-secondary)), black 10%);
      --brand-secondary-700: color-mix(in srgb, hsl(var(--brand-secondary)), black 25%);
    }
  `;

  // Build Google Fonts link for custom fonts
  const fontsToLoad = new Set([headingFont, bodyFont]);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${[...fontsToLoad]
    .map(
      (f) =>
        `family=${fontToGoogleUrl(f)}:wght@100;200;300;400;500;600;700;800;900`,
    )
    .join("&")}&display=swap`;

  return (
    <SiteSettingsProvider settings={settings}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={googleFontsUrl} />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {children}
    </SiteSettingsProvider>
  );
}
