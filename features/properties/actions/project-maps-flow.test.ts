import { describe, expect, it } from "vitest";
import {
  sanitizeGoogleMapsInput,
  parseCoordinatesFromUrlSync,
  isShortenedGoogleMapsUrl,
} from "@/lib/utils/google-maps-coords";

describe("Project Maps Flow & User Error Prevention", () => {
  describe("User Error Prevention in URL Input", () => {
    it("cleans messy copy-paste from chat/LINE correctly", () => {
      const rawChatMsg = "พิกัดโครงการครับ https://maps.app.goo.gl/giW3tMbV8GRhPGTB7 ซอย 10 ขอบคุณครับ";
      expect(sanitizeGoogleMapsInput(rawChatMsg)).toBe("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7");
    });

    it("strips trailing punctuation from pasted URL", () => {
      expect(sanitizeGoogleMapsInput("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7.")).toBe("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7");
      expect(sanitizeGoogleMapsInput("(https://maps.app.goo.gl/giW3tMbV8GRhPGTB7)")).toBe("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7");
    });

    it("identifies short Google Maps URLs properly", () => {
      expect(isShortenedGoogleMapsUrl("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7")).toBe(true);
      expect(isShortenedGoogleMapsUrl("https://goo.gl/maps/abc")).toBe(true);
      expect(isShortenedGoogleMapsUrl("https://www.google.com/maps/place/13.7745,100.612")).toBe(false);
    });
  });

  describe("QuickCreateProjectDialog Coords & URL Resolution Logic", () => {
    function resolveProjectPayload(inputUrl: string, aiData: any) {
      const cleanUserUrl = sanitizeGoogleMapsInput(inputUrl) || inputUrl.trim();
      const cleanAiUrl = sanitizeGoogleMapsInput(aiData?.googleMapsUrl) || aiData?.googleMapsUrl?.trim();
      const isUsingAiUrl = !!(cleanUserUrl && cleanAiUrl && cleanUserUrl === cleanAiUrl);

      const syncCoords = cleanUserUrl ? parseCoordinatesFromUrlSync(cleanUserUrl) : null;
      let finalLat: number | null = null;
      let finalLng: number | null = null;

      if (syncCoords) {
        finalLat = syncCoords.lat;
        finalLng = syncCoords.lng;
      } else if (isUsingAiUrl || (!cleanUserUrl && cleanAiUrl)) {
        if (aiData?.latitude && aiData?.longitude) {
          finalLat = Number(aiData.latitude);
          finalLng = Number(aiData.longitude);
        }
      }

      const finalMapsUrl = cleanUserUrl || cleanAiUrl || null;

      return {
        latitude: finalLat,
        longitude: finalLng,
        google_maps_url: finalMapsUrl,
      };
    }

    const mockAiData = {
      googleMapsUrl: "https://www.google.com/maps/place/13.7745,100.612",
      latitude: 13.7745,
      longitude: 100.612,
    };

    it("Case A: User did not enter any URL (uses AI generated URL and coords)", () => {
      const result = resolveProjectPayload("", mockAiData);
      expect(result.google_maps_url).toBe("https://www.google.com/maps/place/13.7745,100.612");
      expect(result.latitude).toBe(13.7745);
      expect(result.longitude).toBe(100.612);
    });

    it("Case B: User kept the AI generated URL unchanged (uses AI coords)", () => {
      const result = resolveProjectPayload("https://www.google.com/maps/place/13.7745,100.612", mockAiData);
      expect(result.google_maps_url).toBe("https://www.google.com/maps/place/13.7745,100.612");
      expect(result.latitude).toBe(13.7745);
      expect(result.longitude).toBe(100.612);
    });

    it("Case C: User overwrote with their own shortened URL (must NOT fallback to AI coords)", () => {
      const userShortUrl = "https://maps.app.goo.gl/giW3tMbV8GRhPGTB7";
      const result = resolveProjectPayload(userShortUrl, mockAiData);
      expect(result.google_maps_url).toBe("https://maps.app.goo.gl/giW3tMbV8GRhPGTB7");
      // Must be null so the server action knows to resolve the real pin!
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it("Case D: User overwrote with a full URL containing coordinates (uses exact pin from user's URL)", () => {
      const userFullUrl = "https://www.google.com/maps/place/Baan+Klang+Muang/@13.791234,100.621234,17z/data=!3m1!4b1!4m6!3m5!1s0x0!8m2!3d13.791555!4d100.621888!16s";
      const result = resolveProjectPayload(userFullUrl, mockAiData);
      expect(result.google_maps_url).toBe(userFullUrl);
      expect(result.latitude).toBeCloseTo(13.791555, 5);
      expect(result.longitude).toBeCloseTo(100.621888, 5);
    });
  });

  describe("syncProjectAddress Logic in Property Create/Update", () => {
    function shouldUpdateProject(project: { google_maps_url: string | null }, newPropertyLink: string) {
      const cleanMapsLink = sanitizeGoogleMapsInput(newPropertyLink);
      if (!cleanMapsLink) return false;
      const isAiFallbackUrl = !!(project.google_maps_url && /\/maps\/place\/-?\d+\.\d+,-?\d+\.\d+/.test(project.google_maps_url));
      const linkChanged = project.google_maps_url !== cleanMapsLink;
      return linkChanged && (!project.google_maps_url || isAiFallbackUrl);
    }

    it("updates project when previous URL was an AI fallback placeholder", () => {
      const project = { google_maps_url: "https://www.google.com/maps/place/13.7745,100.612" };
      const newLink = "https://maps.app.goo.gl/giW3tMbV8GRhPGTB7";
      expect(shouldUpdateProject(project, newLink)).toBe(true);
    });

    it("updates project when project had no google_maps_url yet", () => {
      const project = { google_maps_url: null };
      const newLink = "https://maps.app.goo.gl/giW3tMbV8GRhPGTB7";
      expect(shouldUpdateProject(project, newLink)).toBe(true);
    });

    it("does not override an established custom project URL with a different one", () => {
      const project = { google_maps_url: "https://maps.app.goo.gl/established_project_link" };
      const newLink = "https://maps.app.goo.gl/unit_specific_link";
      expect(shouldUpdateProject(project, newLink)).toBe(false);
    });
  });
});
