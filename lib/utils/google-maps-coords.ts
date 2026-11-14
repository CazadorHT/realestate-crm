/**
 * Smart Google Maps Short-Link Resolver & Coordinate Extractor
 * - Sanitizes messy pasted text (e.g. LINE chat messages containing URLs)
 * - Resolves shortened URLs (maps.app.goo.gl, goo.gl, share.google) with strict fail-safe timeout
 * - Prioritizes exact red-pin coordinates (!3d<lat>!4d<lng>) over viewport center (@lat,lng)
 * - Enforces Thailand Geographic Bounding Box guardrail to prevent (0,0) or wrong-country pins
 */

export interface ExtractedMapCoordinates {
  lat: number;
  lng: number;
  source: "exact_pin" | "search_or_query" | "raw_coord" | "path_coord" | "viewport";
  cleanInputUrl: string;
  resolvedUrl?: string;
}

// Thailand bounding box with small coastal buffer:
// South (Betong ~5.6) to North (Mae Sai ~20.5), West (Mae Sariang ~97.3) to East (Ubon ~105.7)
export const THAILAND_BOUNDS = {
  minLat: 5.5,
  maxLat: 20.6,
  minLng: 97.3,
  maxLng: 105.7,
} as const;

export function isWithinThailandBounds(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return (
    lat >= THAILAND_BOUNDS.minLat &&
    lat <= THAILAND_BOUNDS.maxLat &&
    lng >= THAILAND_BOUNDS.minLng &&
    lng <= THAILAND_BOUNDS.maxLng
  );
}

/**
 * Extracts a clean URL or raw "lat, lng" pair even if the admin copied extra text from LINE/chat.
 * Example: "โลเคชั่นบ้านครับ https://maps.app.goo.gl/iRNRuu894qCUtPhf9 ซอย 42" -> "https://maps.app.goo.gl/iRNRuu894qCUtPhf9"
 */
export function sanitizeGoogleMapsInput(rawInput: string | null | undefined): string | null {
  if (!rawInput || typeof rawInput !== "string") return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/https?:\/\/[^\s"<>]+/i);
  if (urlMatch) {
    // Strip trailing punctuation sometimes attached in chat messages
    return urlMatch[0].replace(/[),.;]+$/, "");
  }

  const rawCoordMatch = trimmed.match(/(-?\d+\.\d+)\s*,\s*\+?(-?\d+\.\d+)/);
  if (rawCoordMatch) {
    return `${rawCoordMatch[1]},${rawCoordMatch[2]}`;
  }

  return trimmed;
}

export function isShortenedGoogleMapsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps") ||
    lower.includes("goo.gl/") ||
    lower.includes("share.google")
  );
}

/**
 * Unwraps redirection wrappers such as consent.google.com or google.com/url?q=...
 */
export function unwrapGoogleRedirect(url: string): string {
  try {
    const parsed = new URL(url);
    const cont =
      parsed.searchParams.get("continue") ||
      parsed.searchParams.get("url") ||
      parsed.searchParams.get("q");
    if (cont && (cont.startsWith("http://") || cont.startsWith("https://"))) {
      return decodeURIComponent(cont);
    }
  } catch {}
  return url;
}

/**
 * Pure synchronous parser (safe for both Client & Server Components).
 * Returns null if no Thailand-valid coordinates exist in the string.
 */
export function parseCoordinatesFromUrlSync(
  rawUrl: string | null | undefined
): Omit<ExtractedMapCoordinates, "resolvedUrl"> | null {
  const cleaned = sanitizeGoogleMapsInput(rawUrl);
  if (!cleaned) return null;

  const unwrapped = unwrapGoogleRedirect(cleaned);
  let decoded = unwrapped;
  try {
    decoded = decodeURIComponent(unwrapped);
  } catch {}

  const candidates = Array.from(new Set([decoded, unwrapped, cleaned]));

  for (const candidate of candidates) {
    // 1. Highest Precision: Exact Google Maps Red Pin (!3d<lat>!4d<lng>)
    const pinMatches = [...candidate.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g)];
    if (pinMatches.length > 0) {
      const last = pinMatches[pinMatches.length - 1];
      const lat = parseFloat(last[1]);
      const lng = parseFloat(last[2]);
      if (isWithinThailandBounds(lat, lng)) {
        return { lat, lng, source: "exact_pin", cleanInputUrl: cleaned };
      }
    }

    // 2. Mobile Pin Drop / Search Query (/maps/search/lat,+lng or ?q=lat,lng / ll=lat,lng / destination=lat,lng)
    const searchOrQuery =
      candidate.match(/\/maps\/(?:search|place)\/(-?\d+\.\d+),\s*\+?(-?\d+\.\d+)/i) ||
      candidate.match(/[?&](?:q|query|ll|daddr|destination|center)=(-?\d+\.\d+)(?:,|%2C)\s*\+?(-?\d+\.\d+)/i);
    if (searchOrQuery) {
      const lat = parseFloat(searchOrQuery[1]);
      const lng = parseFloat(searchOrQuery[2]);
      if (isWithinThailandBounds(lat, lng)) {
        return { lat, lng, source: "search_or_query", cleanInputUrl: cleaned };
      }
    }

    // 3. Raw "lat, lng" input
    const rawCoord = candidate.match(/^(-?\d+\.\d+),\s*\+?(-?\d+\.\d+)$/);
    if (rawCoord) {
      const lat = parseFloat(rawCoord[1]);
      const lng = parseFloat(rawCoord[2]);
      if (isWithinThailandBounds(lat, lng)) {
        return { lat, lng, source: "raw_coord", cleanInputUrl: cleaned };
      }
    }

    // 4. Viewport Center (@lat,lng) — fallback when URL has no !3d/!4d pin
    const atMatch = candidate.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isWithinThailandBounds(lat, lng)) {
        return { lat, lng, source: "viewport", cleanInputUrl: cleaned };
      }
    }

    // 5. Generic path "/lat,lng"
    const pathMatch = candidate.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      const lat = parseFloat(pathMatch[1]);
      const lng = parseFloat(pathMatch[2]);
      if (isWithinThailandBounds(lat, lng)) {
        return { lat, lng, source: "path_coord", cleanInputUrl: cleaned };
      }
    }

    // 6. Google Open Location Code (Plus Code) in /maps/place/XXXX+XX... URLs (pure math, 3m precision)
    const plusMatch = candidate.match(
      /\/place\/([23456789CFGHJMPQRVWX]{4,8})(?:\+|%2B)([23456789CFGHJMPQRVWX]{2,3})\b/i
    );
    if (plusMatch) {
      const plusCoords = decodeThailandPlusCode(plusMatch[1], plusMatch[2], candidate);
      if (plusCoords && isWithinThailandBounds(plusCoords.lat, plusCoords.lng)) {
        return { lat: plusCoords.lat, lng: plusCoords.lng, source: "exact_pin", cleanInputUrl: cleaned };
      }
    }
  }

  return null;
}

const OLC_ALPHABET = "23456789CFGHJMPQRVWX";
const THAI_REGION_REFS: Array<{ pattern: RegExp; lat: number; lng: number }> = [
  { pattern: /phuket|ภูเก็ต/i, lat: 7.8804, lng: 98.3923 },
  { pattern: /chiang\s*mai|เชียงใหม่/i, lat: 18.7883, lng: 98.9853 },
  { pattern: /pattaya|chon\s*buri|พัทยา|ชลบุรี/i, lat: 12.9236, lng: 100.8825 },
  { pattern: /rayong|ระยอง/i, lat: 12.6814, lng: 101.2816 },
  { pattern: /hua\s*hin|prachuap|หัวหิน|ประจวบ/i, lat: 12.5684, lng: 99.9577 },
  { pattern: /samui|surat|สมุย|สุราษฎร์/i, lat: 9.512, lng: 100.0136 },
  { pattern: /khon\s*kaen|ขอนแก่น/i, lat: 16.4322, lng: 102.8236 },
  { pattern: /korat|nakhon\s*ratchasima|โคราช|นครราชสีมา/i, lat: 14.9799, lng: 102.0978 },
  { pattern: /nonthaburi|นนทบุรี/i, lat: 13.8591, lng: 100.5217 },
  { pattern: /pathum\s*thani|ปทุมธานี/i, lat: 14.0208, lng: 100.525 },
  { pattern: /samut\s*prakan|สมุทรปราการ/i, lat: 13.5991, lng: 100.5968 },
  { pattern: /bangkok|krung\s*thep|lak\s*si|กรุงเทพ/i, lat: 13.7563, lng: 100.5018 },
];

function decodeThailandPlusCode(
  prefixRaw: string,
  suffixRaw: string,
  contextText: string
): { lat: number; lng: number } | null {
  const prefix = prefixRaw.toUpperCase();
  const suffix = suffixRaw.toUpperCase();

  // Full 8-digit prefix OLC (global)
  if (prefix.length === 8) {
    const code = prefix + suffix;
    const weights = [20, 1, 0.05, 0.0025, 0.000125];
    let lat = -90;
    let lng = -180;
    for (let i = 0; i < 5; i++) {
      lat += OLC_ALPHABET.indexOf(code[i * 2]) * weights[i];
      lng += OLC_ALPHABET.indexOf(code[i * 2 + 1]) * weights[i];
    }
    let latRes = 0.000125;
    let lngRes = 0.000125;
    if (code.length >= 11) {
      const idx = OLC_ALPHABET.indexOf(code[10]);
      latRes /= 5;
      lngRes /= 4;
      lat += Math.floor(idx / 4) * latRes;
      lng += (idx % 4) * lngRes;
    }
    return { lat: lat + latRes / 2, lng: lng + lngRes / 2 };
  }

  // Short 4-digit prefix OLC (locality-relative, 1x1 degree tile)
  if (prefix.length === 4) {
    const ref =
      THAI_REGION_REFS.find((r) => r.pattern.test(contextText)) ||
      THAI_REGION_REFS[THAI_REGION_REFS.length - 1];
    const code = prefix + suffix;
    let latOff =
      OLC_ALPHABET.indexOf(code[0]) * 0.05 +
      OLC_ALPHABET.indexOf(code[2]) * 0.0025 +
      OLC_ALPHABET.indexOf(code[4]) * 0.000125;
    let lngOff =
      OLC_ALPHABET.indexOf(code[1]) * 0.05 +
      OLC_ALPHABET.indexOf(code[3]) * 0.000125 * 20 +
      OLC_ALPHABET.indexOf(code[5]) * 0.000125;
    let latRes = 0.000125;
    let lngRes = 0.000125;
    if (code.length >= 7) {
      const idx = OLC_ALPHABET.indexOf(code[6]);
      latRes /= 5;
      lngRes /= 4;
      latOff += Math.floor(idx / 4) * latRes;
      lngOff += (idx % 4) * lngRes;
    }
    latOff += latRes / 2;
    lngOff += lngRes / 2;
    const lat = Math.round(ref.lat - latOff) + latOff;
    const lng = Math.round(ref.lng - lngOff) + lngOff;
    return { lat, lng };
  }

  return null;
}

/**
 * Server-side short-link resolver + coordinate extractor with strict fail-safe timeout.
 * - Multi-hop HEAD follow (up to 3 hops) completes in < 400ms for 301/302 redirects
 * - Automatically unwraps consent.google.com and redirection query params
 * - Never throws: returns null on timeout, network failure, non-map URL, or out-of-Thailand coordinates.
 */
export async function resolveAndExtractCoordinates(
  rawInput: string | null | undefined,
  timeoutMs: number = 1800
): Promise<ExtractedMapCoordinates | null> {
  const cleaned = sanitizeGoogleMapsInput(rawInput);
  if (!cleaned) return null;

  // Fast path: if full link or raw coordinates already contain valid pin, zero network call needed
  if (!isShortenedGoogleMapsUrl(cleaned)) {
    const direct = parseCoordinatesFromUrlSync(cleaned);
    return direct ? { ...direct, resolvedUrl: cleaned } : null;
  }

  if (!cleaned.startsWith("http")) return null;

  let currentUrl = cleaned;
  try {
    const BROWSER_HEADERS = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    };

    // Fast multi-hop HEAD resolver (max 3 hops)
    // 99% of Google short links resolve in 1-2 hops via 301/302 Location header in < 400ms
    for (let hop = 0; hop < 3; hop++) {
      const parsedDirect = parseCoordinatesFromUrlSync(currentUrl);
      if (parsedDirect) {
        return {
          ...parsedDirect,
          cleanInputUrl: cleaned,
          resolvedUrl: currentUrl,
        };
      }

      const headRes = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const loc = headRes.headers.get("location");
      if (!loc) {
        if (headRes.url && headRes.url !== currentUrl) {
          currentUrl = unwrapGoogleRedirect(headRes.url);
        }
        break;
      }

      currentUrl = unwrapGoogleRedirect(new URL(loc, currentUrl).toString());
    }

    // Check if HEAD hops resolved the URL to coordinates
    const parsedAfterHead = parseCoordinatesFromUrlSync(currentUrl);
    if (parsedAfterHead) {
      return {
        ...parsedAfterHead,
        cleanInputUrl: cleaned,
        resolvedUrl: currentUrl,
      };
    }

    // Fallback: If HEAD didn't yield coordinates, attempt a fast GET with remaining time
    const getRes = await fetch(cleaned, {
      method: "GET",
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(Math.min(timeoutMs, 1000)),
    });
    try {
      await getRes.body?.cancel();
    } catch {}

    const finalUrl = unwrapGoogleRedirect(getRes.url || currentUrl);
    const parsedGet = parseCoordinatesFromUrlSync(finalUrl);
    if (parsedGet) {
      return {
        ...parsedGet,
        cleanInputUrl: cleaned,
        resolvedUrl: finalUrl,
      };
    }
  } catch {
    // Strict fail-safe: never block property/project save if Google redirect times out
    return null;
  }

  return null;
}
