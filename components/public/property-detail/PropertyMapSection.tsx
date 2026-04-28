import { type Language } from "@/lib/i18n";
import { PropertyMapClient } from "./PropertyMapClient";

interface PropertyMapSectionProps {
  googleMapsLink: string | null;
  propertyId?: string;
  propertyTitle?: string;
  language?: Language;
}

/**
 * Server-Side Link Resolver
 * Follows redirects for shortened Google Maps links to get the original 
 * URL which contains query parameters for embedding.
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
      // Use HEAD request to follow redirects without downloading content
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        next: { revalidate: 86400 }, // Cache resolution for 24 hours
      });
      return res.url;
    } catch (e) {
      console.warn("Could not resolve shortened Google Maps link:", url);
      return url;
    }
  }
  return url;
}

/**
 * Property Map Section (Server Component)
 * Handles link resolution and passes data to the client-side viewer.
 */
export async function PropertyMapSection({
  googleMapsLink: rawLink,
  propertyId,
  propertyTitle,
  language,
}: PropertyMapSectionProps) {
  // Resolve link on server to avoid client-side CORS issues
  const googleMapsLink = await resolveGoogleMapsLink(rawLink);

  return (
    <section id="map-section" className="scroll-mt-20">
      <PropertyMapClient 
        googleMapsLink={googleMapsLink}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        language={language}
      />
    </section>
  );
}
