import { getSiteSettings } from "@/features/site-settings/actions";
import { SiteSettingsProvider } from "./SiteSettingsProvider";
import { BRAND_PROFILES } from "@/lib/brand-profiles";

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

  // Create the CSS variable overrides
  const styles = `
    :root {
      --primary: ${primary};
      --secondary: ${secondary};
      --brand-gradient-from: ${gradientFrom};
      --brand-gradient-to: ${gradientTo};
    }
  `;

  return (
    <SiteSettingsProvider settings={settings}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {children}
    </SiteSettingsProvider>
  );
}
