"use server";

import { requireAuthContext } from "@/lib/authz";
import {
  resolveAndExtractCoordinates,
  sanitizeGoogleMapsInput,
} from "@/lib/utils/google-maps-coords";

/**
 * Authenticated helper action for Admin Property & Project forms
 * Resolves shortened Google Maps links (e.g. https://maps.app.goo.gl/...) on paste/blur
 * so admins get instant visual confirmation of extracted coordinates.
 */
export async function resolveMapCoordinatesAction(rawInput: string): Promise<{
  success: boolean;
  lat?: number;
  lng?: number;
  cleanUrl?: string | null;
}> {
  try {
    await requireAuthContext();
    const cleanUrl = sanitizeGoogleMapsInput(rawInput);
    if (!cleanUrl) return { success: false, cleanUrl: null };

    const extracted = await resolveAndExtractCoordinates(cleanUrl, 1800);
    if (!extracted) {
      return { success: false, cleanUrl };
    }

    return {
      success: true,
      lat: extracted.lat,
      lng: extracted.lng,
      cleanUrl: extracted.cleanInputUrl,
    };
  } catch {
    return { success: false };
  }
}
