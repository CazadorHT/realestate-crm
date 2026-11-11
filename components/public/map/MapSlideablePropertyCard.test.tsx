import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MapSlideablePropertyCard } from "./MapSlideablePropertyCard";
import type { MapLocationGroup } from "./useMapClusters";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} data-priority={props.priority ? "true" : "false"} />;
  },
}));

// Mock LanguageProvider
vi.mock("@/components/providers/LanguageProvider", () => ({
  useLanguage: () => ({
    language: "th",
    langPrefix: "",
    t: (key: string) => key,
  }),
}));

describe("MapSlideablePropertyCard - Performance & Preload Suite (เทสไม่อวย)", () => {
  const mockGroup = {
    groupId: "group-1",
    projectId: "proj-1",
    latitude: 13.75,
    longitude: 100.55,
    unitIds: new Set(["unit-1", "unit-2", "unit-3"]),
    leadPriceLabel: "฿18,000 /ด.",
    leadNumericPrice: 18000,
    leadListingType: "RENT" as const,
    hasAnyDiscount: false,
    hasHotDeal: false,
    units: [
      {
        id: "unit-1",
        title: "Life Asoke - Unit 101",
        image_url: "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-1.webp",
        price: 3500000,
        rental_price: 18000,
        listing_type: "RENT",
        bedrooms: 1,
        bathrooms: 1,
        size_sqm: 35,
        slug: "life-asoke-101",
        latitude: 13.75,
        longitude: 100.55,
      } as any,
      {
        id: "unit-2",
        title: "Life Asoke - Unit 202",
        image_url: "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-2.webp",
        price: 4200000,
        rental_price: 22000,
        listing_type: "RENT",
        bedrooms: 2,
        bathrooms: 1,
        size_sqm: 45,
        slug: "life-asoke-202",
        latitude: 13.75,
        longitude: 100.55,
      } as any,
      {
        id: "unit-3",
        title: "Life Asoke - Unit 303",
        image_url: "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-3.webp",
        price: 5500000,
        rental_price: 28000,
        listing_type: "RENT",
        bedrooms: 2,
        bathrooms: 2,
        size_sqm: 55,
        slug: "life-asoke-303",
        latitude: 13.75,
        longitude: 100.55,
      } as any,
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Should render image with priority=true on the active slide", () => {
    render(<MapSlideablePropertyCard group={mockGroup} onClose={vi.fn()} />);

    const img = screen.getByAltText(/Life Asoke/i);
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(img.getAttribute("src")).toBe("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-1.webp");
  });

  it("2. Should automatically preload next and previous images via window.Image", () => {
    const preloadedSources: string[] = [];
    const originalImage = window.Image;

    // Spy on Image constructor
    window.Image = class MockImage {
      private _src = "";
      set src(val: string) {
        this._src = val;
        preloadedSources.push(val);
      }
      get src() {
        return this._src;
      }
    } as any;

    render(<MapSlideablePropertyCard group={mockGroup} onClose={vi.fn()} />);

    // Should have preloaded unit-2 (next) and unit-3 (prev wrap-around)
    expect(preloadedSources).toContain("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-2.webp");
    expect(preloadedSources).toContain("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-3.webp");

    window.Image = originalImage;
  });

  it("3. Should switch slides instantly when Next arrow is clicked", () => {
    render(<MapSlideablePropertyCard group={mockGroup} onClose={vi.fn()} />);

    const nextBtn = screen.getByRole("button", { name: /Next unit/i });
    expect(nextBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(nextBtn);
    });

    // Unit 2 image should now be displayed
    const img2 = screen.getByAltText(/Life Asoke/i);
    expect(img2.getAttribute("src")).toBe("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-2.webp");
  });

  it("4. (Edge Case: Single Unit) Should not show arrows and not crash on group with only 1 unit", () => {
    const singleGroup = {
      ...mockGroup,
      units: [mockGroup.units[0]],
      unitIds: new Set(["unit-1"]),
    };

    render(<MapSlideablePropertyCard group={singleGroup as any} onClose={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /Next unit/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Previous unit/i })).toBeNull();
  });

  it("5. (Edge Case: Wrap-around) Clicking next 3 times should loop back to unit 1 without error", () => {
    render(<MapSlideablePropertyCard group={mockGroup} onClose={vi.fn()} />);

    const nextBtn = screen.getByRole("button", { name: /Next unit/i });

    // Unit 1 -> 2
    act(() => fireEvent.click(nextBtn));
    // Unit 2 -> 3
    act(() => fireEvent.click(nextBtn));
    // Unit 3 -> 1 (Wrap-around)
    act(() => fireEvent.click(nextBtn));

    const img = screen.getByAltText(/Life Asoke/i);
    expect(img.getAttribute("src")).toBe("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-1.webp");
  });

  it("6. (Edge Case: Broken Image Fallback) Image onError should switch to fallback image", () => {
    render(<MapSlideablePropertyCard group={mockGroup} onClose={vi.fn()} />);

    const img = screen.getByAltText(/Life Asoke/i);
    // Simulate image loading failure
    act(() => {
      fireEvent.error(img);
    });

    const fallbackImg = screen.getByAltText(/Life Asoke/i);
    expect(fallbackImg.getAttribute("src")).toContain("unsplash.com");
  });

  it("7. (Edge Case: Non-existent initialUnitId) Should safely default to index 0", () => {
    render(
      <MapSlideablePropertyCard
        group={mockGroup}
        initialUnitId="non-existent-unit-999"
        onClose={vi.fn()}
      />
    );

    const img = screen.getByAltText(/Life Asoke/i);
    expect(img.getAttribute("src")).toBe("https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-1.webp");
  });
});
