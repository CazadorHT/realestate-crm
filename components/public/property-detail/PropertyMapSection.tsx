"use client";

import { MapPin } from "lucide-react";
import { LuMap } from "react-icons/lu";
interface PropertyMapSectionProps {
  googleMapsLink: string | null;
}

export function PropertyMapSection({
  googleMapsLink,
}: PropertyMapSectionProps) {
  // Helper to extract location query from various Google Maps URL formats
  const extractQuery = (url: string | null) => {
    if (!url) return null;

    // If it's not a URL (doesn't start with http), it's likely a raw address or place name
    if (!url.startsWith("http")) return url;

    try {
      // 1. Check for standard q= or query= parameters in standard URLs
      const urlObj = new URL(url);
      const q =
        urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
      if (q) return q;

      // 2. Check for /place/ADDRESS/ pattern (Common in long URLs)
      const placeMatch = url.match(/\/place\/([^\/]+)/);
      if (placeMatch && placeMatch[1])
        return decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");

      // 3. Check for /search/QUERY/ pattern
      const searchMatch = url.match(/\/search\/([^\/]+)/);
      if (searchMatch && searchMatch[1])
        return decodeURIComponent(searchMatch[1]).replace(/\+/g, " ");

      // 4. Check for @LAT,LNG coordinates
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;

      // 5. Shortened links (maps.app.goo.gl) - Cannot be parsed easily on client-side
      // We return the URL and hope Google resolves it, but warn in documentation
      return url;
    } catch (e) {
      return url;
    }
  };

  const locationQuery = extractQuery(googleMapsLink);
  const embedUrl = locationQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : null;

  return (
    <section>
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <LuMap className="w-5 h-5 text-blue-600" /> แผนที่ & ทำเลที่ตั้ง
      </h3>

      <div className="space-y-4">
        <div className="w-full h-[300px] md:h-[450px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
          {googleMapsLink && embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={embedUrl}
              className="grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-700"
              title="Property Location"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <MapPin className="h-10 w-10 text-slate-300" />
              <p className="text-sm">ไม่พบข้อมูลพิกัดแผนที่</p>
            </div>
          )}
        </div>

        {googleMapsLink && (
          <div className="flex justify-center">
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group"
            >
              <MapPin className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              เปิดดูใน Google Maps
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
