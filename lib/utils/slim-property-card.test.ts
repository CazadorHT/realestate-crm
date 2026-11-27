import { describe, it, expect } from "vitest";
import { slimPropertyForCard } from "./slim-property-card";

describe("slimPropertyForCard", () => {
  it("handles null, undefined, and primitive values safely", () => {
    expect(slimPropertyForCard(null)).toBeNull();
    expect(slimPropertyForCard(undefined)).toBeUndefined();
    expect(slimPropertyForCard("raw")).toBe("raw");
  });

  it("strips unused/duplicate blobs while preserving card-rendered fields including features", () => {
    const raw = {
      id: "prop-1",
      slug: "luxury-condo-thonglor",
      title: "คอนโดหรู ทองหล่อ",
      title_en: "Luxury Condo Thonglor",
      price: 15000000,
      rental_price: 65000,
      allow_airbnb: true,
      is_pet_friendly: true,
      latitude: 13.73,
      longitude: 100.58,
      features: [{ id: "f1", name: "สระว่ายน้ำ", icon_key: "pool" }],
      description: "long thai desc",
      description_en: "long en desc",
      description_cn: "long cn desc",
      description_ru: "long ru desc",
      meta_keywords: "condo, bangkok",
      meta_data: { bumped_at: "2026-01-01" },
      google_maps_link: "https://maps.google.com/?q=13.73,100.58",
      address_line1: "123 ถนนสุขุมวิท",
      address_line1_en: "123 Sukhumvit Rd",
      property_images: [{ image_url: "dup.jpg" }],
      nearby_places: [{ name: "EmQuartier" }],
      transit_info: { transits: [{ name: "BTS Thong Lo" }] },
      amenities: { ceiling_height: 3.2, allow_airbnb: true },
      nearby_transits: [
        { name: "BTS Thong Lo", distance: 300 },
        { name: "BTS Phrom Phong", distance: 900 },
      ],
      images: ["https://cdn.example.com/1.webp"],
    };

    const slim = slimPropertyForCard(raw);

    // Stripped fields
    expect(slim.description).toBeUndefined();
    expect(slim.description_en).toBeUndefined();
    expect(slim.description_cn).toBeUndefined();
    expect(slim.description_ru).toBeUndefined();
    expect(slim.meta_keywords).toBeUndefined();
    expect(slim.meta_data).toBeUndefined();
    expect(slim.google_maps_link).toBeUndefined();
    expect(slim.address_line1).toBeUndefined();
    expect(slim.address_line1_en).toBeUndefined();
    expect(slim.property_images).toBeUndefined();
    expect(slim.nearby_places).toBeUndefined();
    expect(slim.transit_info).toBeUndefined();
    expect(slim.amenities).toBeUndefined();

    // Preserved card fields
    expect(slim.id).toBe("prop-1");
    expect(slim.title_en).toBe("Luxury Condo Thonglor");
    expect(slim.allow_airbnb).toBe(true);
    expect(slim.is_pet_friendly).toBe(true);
    expect(slim.latitude).toBe(13.73);
    expect(slim.longitude).toBe(100.58);
    expect(slim.features).toEqual([{ id: "f1", name: "สระว่ายน้ำ", icon_key: "pool" }]);
    expect(slim.nearby_transits).toEqual([{ name: "BTS Thong Lo", distance: 300 }]);
  });

  it("sorts cover-first, caps at 15, flattens image objects to URL strings, and does not mutate input", () => {
    const rawImages = Array.from({ length: 20 }, (_, i) => ({
      image_url: `https://cdn.example.com/raw-${i}.webp`,
      storage_path: `properties/raw-${i}.webp`,
      url: `https://cdn.example.com/img-${i}.webp`,
      is_cover: i === 18,
      sort_order: 20 - i,
    }));
    const snapshot = rawImages.map((x) => ({ ...x }));

    const slim = slimPropertyForCard({ id: "p2", images: rawImages });

    // Input array was not mutated
    expect(rawImages).toEqual(snapshot);

    // Flattened to plain strings, capped at 15, cover image placed first even though it was at index 18
    expect(slim.images).toHaveLength(15);
    expect(slim.total_images).toBe(20);
    expect(slim.images[0]).toBe("https://cdn.example.com/img-18.webp");
    expect(slim.images.every((u: unknown) => typeof u === "string")).toBe(true);
    // Second item should be lowest sort_order among non-cover (i=19 has sort_order=1)
    expect(slim.images[1]).toBe("https://cdn.example.com/img-19.webp");

    // Idempotent when called twice: keeps total_images=20
    const slimAgain = slimPropertyForCard(slim);
    expect(slimAgain.images).toHaveLength(15);
    expect(slimAgain.total_images).toBe(20);
  });

  it("handles mixed string/object/null/empty entries in images gracefully", () => {
    const slim = slimPropertyForCard({
      id: "p3",
      images: [
        null,
        undefined,
        "",
        "   ",
        { url: "", image_url: "https://cdn.example.com/fallback-image-url.webp" },
        { storage_path: "properties/only-path.webp" },
        "https://cdn.example.com/plain.webp",
      ],
    });

    expect(slim.images).toEqual([
      "https://cdn.example.com/fallback-image-url.webp",
      "properties/only-path.webp",
      "https://cdn.example.com/plain.webp",
    ]);
    expect(slim.total_images).toBe(3);
  });

  it("handles weird total_images (NaN/Infinity/negative), empty arrays, and mostly-empty 20-item arrays safely", () => {
    // 20 entries where 8 are junk -> only 12 valid -> total_images MUST be 12 (no fake +5 slide)
    const mostlyJunk = [
      ...Array.from({ length: 12 }, (_, i) => `https://cdn.example.com/${i}.webp`),
      null,
      undefined,
      "",
      "   ",
      {},
      { url: "" },
      { image_url: "" },
      { storage_path: "" },
    ];
    const slimJunk = slimPropertyForCard({ id: "p4", images: mostlyJunk, total_images: Number.NaN });
    expect(slimJunk.images).toHaveLength(12);
    expect(slimJunk.total_images).toBe(12);

    // Infinity or negative total_images falls back safely
    const slimInf = slimPropertyForCard({ id: "p5", images: ["a.webp"], total_images: Number.POSITIVE_INFINITY });
    expect(slimInf.total_images).toBe(1);

    const slimNeg = slimPropertyForCard({ id: "p6", images: ["a.webp", "b.webp"], total_images: -10 });
    expect(slimNeg.total_images).toBe(2);

    // Empty images array
    const slimEmpty = slimPropertyForCard({ id: "p7", images: [] });
    expect(slimEmpty.images).toEqual([]);
    expect(slimEmpty.total_images).toBe(0);
  });
});
