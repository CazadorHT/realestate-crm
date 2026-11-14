import { describe, expect, it } from "vitest";
import {
  isShortenedGoogleMapsUrl,
  isWithinThailandBounds,
  parseCoordinatesFromUrlSync,
  sanitizeGoogleMapsInput,
} from "./google-maps-coords";
import {
  getPinProjectOrPropertyHeadline,
  resolvePinPrice,
} from "@/components/public/map/map-price-utils";
import type { SlimMapPin } from "@/lib/services/map-pins";

describe("google-maps-coords & map-price-utils", () => {
  it("sanitizes messy LINE copy-paste messages without losing URLs", () => {
    const raw =
      "โลเคชั่นคอนโดครับพี่ https://maps.app.goo.gl/iRNRuu894qCUtPhf9?g_st=il). ขอบคุณครับ";
    expect(sanitizeGoogleMapsInput(raw)).toBe(
      "https://maps.app.goo.gl/iRNRuu894qCUtPhf9?g_st=il"
    );
    expect(
      isShortenedGoogleMapsUrl(
        "https://maps.app.goo.gl/iRNRuu894qCUtPhf9?g_st=il"
      )
    ).toBe(true);
  });

  it("prioritizes exact !3d/!4d pin over shifted @lat,lng camera viewport", () => {
    const expanded =
      "https://www.google.com/maps/place/Ashton+Asoke/@13.736717,100.558123,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29ee!8m2!3d13.738125!4d100.560891!16s";
    const parsed = parseCoordinatesFromUrlSync(expanded);
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("exact_pin");
    expect(parsed?.lat).toBeCloseTo(13.738125, 6);
    expect(parsed?.lng).toBeCloseTo(100.560891, 6);
  });

  it("parses Google Plus Codes inside Thailand accurately", () => {
    const plusUrl =
      "https://www.google.com/maps/place/VHQG%2BR4R+Motique+Chaengwattana+10+Pak+Kret";
    const parsed = parseCoordinatesFromUrlSync(plusUrl);
    expect(parsed).not.toBeNull();
    expect(isWithinThailandBounds(parsed!.lat, parsed!.lng)).toBe(true);
    expect(parsed!.lat).toBeGreaterThan(13.85);
    expect(parsed!.lat).toBeLessThan(13.95);
  });

  it("parses DMS single-quote URLs in Thailand", () => {
    const dmsUrl =
      "https://www.google.com/maps/place/12%C2%B055'42.1%22N+100%C2%B053'15.2%22E/@12.9283611,100.8875556,17z";
    const parsed = parseCoordinatesFromUrlSync(dmsUrl);
    expect(parsed).not.toBeNull();
    expect(parsed?.lat).toBeCloseTo(12.928361, 4);
    expect(parsed?.lng).toBeCloseTo(100.887555, 4);
  });

  it("rejects (0,0) and out-of-Thailand coordinates", () => {
    expect(isWithinThailandBounds(0, 0)).toBe(false);
    expect(isWithinThailandBounds(100.56, 13.74)).toBe(false); // swapped lat/lng
    expect(isWithinThailandBounds(35.6895, 139.6917)).toBe(false); // Tokyo
    expect(parseCoordinatesFromUrlSync("https://maps.google.com/?q=0,0")).toBeNull();
  });

  it("unwraps Google consent redirect URLs and parses embedded coordinates instantly", () => {
    const consentUrl =
      "https://consent.google.com/m?continue=https%3A%2F%2Fwww.google.com%2Fmaps%2Fplace%2F%4013.7747818%2C100.6034188%2C17z%2Fdata%3D%213m1%214b1%214m6%213m5%211s0x0%218m2%213d13.7747818%214d100.6034188&gl=TH&m=0";
    const parsed = parseCoordinatesFromUrlSync(consentUrl);
    expect(parsed).not.toBeNull();
    expect(parsed?.lat).toBeCloseTo(13.7747818, 5);
    expect(parsed?.lng).toBeCloseTo(100.6034188, 5);
    expect(parsed?.source).toBe("exact_pin");
  });

  it("resolves all price variables (normal, original discount, rent switch, office sqm, POA)", () => {
    const basePin: SlimMapPin = {
      id: "unit-1",
      title: "ขายขาดทุน Ashton Asoke ชั้นสูง",
      title_en: "Hot Sale Ashton Asoke High Floor",
      listing_type: "SALE_AND_RENT",
      property_type: "CONDO",
      price: 8_500_000,
      original_price: 10_000_000,
      rental_price: 35_000,
      original_rental_price: 42_000,
      project_name: "แอชตัน อโศก",
      projects: {
        name_th: "แอชตัน อโศก",
        name_en: "Ashton Asoke",
        slug: "ashton-asoke",
      },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      latitude: 13.7381,
      longitude: 100.5608,
    };

    // Default / SALE mode -> shows ฿ 8.5M + discount
    const saleResolved = resolvePinPrice(basePin, "ALL", "th");
    expect(saleResolved.displayLabel).toBe("฿ 8.5M");
    expect(saleResolved.hasDiscount).toBe(true);
    expect(saleResolved.discountPercent).toBe(15);

    // RENT filter mode -> switches pill to ฿ 35K /ด. + rental discount!
    const rentResolved = resolvePinPrice(basePin, "RENT", "th");
    expect(rentResolved.displayLabel).toBe("฿ 35K /ด.");
    expect(rentResolved.hasDiscount).toBe(true);
    expect(rentResolved.originalNumericValue).toBe(42_000);

    // Office building calculated from rent_price_per_sqm * size_sqm
    const officePin: SlimMapPin = {
      id: "office-1",
      title: "ออฟฟิศติดเพลินจิต",
      listing_type: "RENT",
      property_type: "OFFICE_BUILDING",
      price: 0,
      rental_price: 0,
      rent_price_per_sqm: 900,
      size_sqm: 200,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      latitude: 13.743,
      longitude: 100.549,
    };
    const officeResolved = resolvePinPrice(officePin, "ALL", "en");
    expect(officeResolved.numericValue).toBe(180_000);
    expect(officeResolved.displayLabel).toBe("฿ 180K /mo");

    // Zero price -> POA / สอบถามราคา (never ฿0)
    const poaPin: SlimMapPin = {
      id: "poa-1",
      title: "ที่ดินแปลงสวย",
      listing_type: "SALE",
      property_type: "LAND",
      price: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      latitude: 13.75,
      longitude: 100.56,
    };
    expect(resolvePinPrice(poaPin, "ALL", "th").displayLabel).toBe("สอบถามราคา");
    expect(resolvePinPrice(poaPin, "ALL", "en").displayLabel).toBe("POA");

    // Headline: Project Name primary, Property Title fallback when no project
    const withProj = getPinProjectOrPropertyHeadline(basePin, "en");
    expect(withProj.primaryTitle).toBe("Ashton Asoke");
    expect(withProj.isProjectHeadline).toBe(true);

    const noProj = getPinProjectOrPropertyHeadline(poaPin, "th");
    expect(noProj.primaryTitle).toBe("ที่ดินแปลงสวย");
    expect(noProj.isProjectHeadline).toBe(false);
  });
});
