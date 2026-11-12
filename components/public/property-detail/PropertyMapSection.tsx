import { type Language } from "@/lib/i18n";
import { PropertyMapClient } from "./PropertyMapClient";

interface PropertyMapSectionProps {
  googleMapsLink: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyId?: string;
  propertyTitle?: string;
  language?: Language;
  compact?: boolean;
  className?: string;
}

/**
 * Server-Side Link Resolver (Fail-safe with User-Agent & timeout)
 * Only called if latitude/longitude are not pre-stored in the database.
 */
async function resolveGoogleMapsLink(url: string | null) {
  if (!url) return null;
  
  // Only follow redirects for known shortened domains
  if (
    url.includes("goo.gl") ||
    url.includes("maps.app.goo.gl") ||
    url.includes("share.google")
  ) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 86400 }, // Cache resolution for 24 hours
      });
      const location = res.headers.get("location");
      return location || res.url;
    } catch {
      // Quiet fail-safe: never crash or log noisy socket error if external Google redirect drops
      return url;
    }
  }
  return url;
}

/**
 * Property Map Section (Server Component)
 * Uses pre-computed DB coordinates (0ms latency, zero external API call) when available,
 * and falls back gracefully to link resolution if needed.
 */
export async function PropertyMapSection({
  googleMapsLink: rawLink,
  latitude,
  longitude,
  propertyId,
  propertyTitle,
  language,
  compact = false,
  className = "",
}: PropertyMapSectionProps) {
  // If coordinates are already known, skip runtime external fetch to Google completely
  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const googleMapsLink = hasCoordinates ? rawLink : await resolveGoogleMapsLink(rawLink);

  return (
    <section id="map-section" className={`scroll-mt-20 ${className}`}>
      <PropertyMapClient 
        googleMapsLink={googleMapsLink}
        latitude={latitude}
        longitude={longitude}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        language={language}
        compact={compact}
      />
    </section>
  );
}
