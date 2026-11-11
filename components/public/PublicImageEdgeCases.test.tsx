import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ComparePropertyHeader } from "./compare/ComparePropertyHeader";
import { CompareAppleHero } from "./compare/CompareAppleHero";
import { RecentlyViewedCard } from "./RecentlyViewedCard";
import type { CompareProperty } from "./compare/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} data-priority={props.priority ? "true" : "false"} data-testid="next-image" />;
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

describe("Public Image Edge Cases Suite (เทสไม่อวยทุกท่า /public)", () => {
  const mockProperty: CompareProperty = {
    id: "prop-123",
    slug: "condo-prime-asoke",
    title: "Condo Prime Asoke",
    property_type: "CONDO",
    listing_type: "RENT",
    price: 3500000,
    rental_price: 25000,
    image_url: "https://cdn.vccasset.com/storage/v1/object/public/property-images/broken-photo.webp",
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 35,
    floor: 12,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. ComparePropertyHeader Edge Cases", () => {
    it("should render with priority and fall back to FALLBACK_IMG on 404 error", () => {
      render(<ComparePropertyHeader property={mockProperty} onRemove={vi.fn()} />);

      const img = screen.getByTestId("next-image");
      expect(img.getAttribute("data-priority")).toBe("true");
      expect(img.getAttribute("src")).toContain("broken-photo.webp");

      // Trigger 404 error
      act(() => {
        fireEvent.error(img);
      });

      // Should switch to Unsplash fallback
      expect(img.getAttribute("src")).toContain("unsplash.com");
    });

    it("should handle property with null image_url safely", () => {
      const propNoImg = { ...mockProperty, image_url: null };
      render(<ComparePropertyHeader property={propNoImg as any} onRemove={vi.fn()} />);

      const img = screen.getByTestId("next-image");
      expect(img.getAttribute("src")).toContain("unsplash.com");
    });
  });

  describe("2. CompareAppleHero Edge Cases", () => {
    it("should render AppleHeroImage and fallback on error", () => {
      render(<CompareAppleHero properties={[mockProperty]} onRemove={vi.fn()} />);

      const img = screen.getByTestId("next-image");
      expect(img.getAttribute("data-priority")).toBe("true");

      act(() => {
        fireEvent.error(img);
      });

      expect(img.getAttribute("src")).toContain("unsplash.com");
    });

    it("should handle empty property array without crash", () => {
      const { container } = render(<CompareAppleHero properties={[]} onRemove={vi.fn()} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("3. RecentlyViewedCard Edge Cases", () => {
    it("should convert legacy Supabase URL in localStorage to CDN URL", () => {
      const legacyItem = {
        id: "rec-1",
        title: "Legacy Condo",
        image_url: "https://qaihjhvdwfafawezxivb.supabase.co/storage/v1/object/public/property-images/photo.webp",
        price: 3000000,
        rental_price: 15000,
        slug: "legacy-condo",
        property_type: "CONDO",
        listing_type: "RENT",
        viewed_at: Date.now(),
      };

      render(
        <RecentlyViewedCard
          item={legacyItem as any}
          language="th"
          t={(k) => k}
          isDragging={false}
        />
      );

      const img = screen.getByTestId("next-image");
      expect(img.getAttribute("src")).toContain("cdn.vccasset.com");
    });

    it("should show Sparkles fallback icon when image_url is missing", () => {
      const noImgItem = {
        id: "rec-2",
        title: "No Image Condo",
        image_url: null,
        price: 3000000,
        slug: "no-img-condo",
        property_type: "CONDO",
        listing_type: "SALE",
        viewed_at: Date.now(),
      };

      const { container } = render(
        <RecentlyViewedCard
          item={noImgItem as any}
          language="th"
          t={(k) => k}
          isDragging={false}
        />
      );

      expect(screen.queryByTestId("next-image")).toBeNull();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
