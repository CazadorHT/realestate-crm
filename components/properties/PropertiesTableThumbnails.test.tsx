import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TableThumbnailImage, MobileThumbnailImage } from "./PropertiesTable";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} data-testid="table-next-image" />;
  },
}));

describe("CRM PropertiesTable Thumbnails - Edge Cases & Fallback Suite (เทสไม่อวย)", () => {
  const sampleStorageWebp = "https://cdn.vccasset.com/storage/v1/object/public/property-images/condo-cover.webp";
  const sampleExternalWebp = "https://images.unsplash.com/photo-luxury.webp";
  const sampleJpg = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo.jpg";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Desktop TableThumbnailImage", () => {
    it("1. Should initially use -thumb.webp for internal WebP images", () => {
      render(<TableThumbnailImage src={sampleStorageWebp} alt="Condo" />);
      const img = screen.getByTestId("table-next-image");
      expect(img.getAttribute("src")).toContain("condo-cover-thumb.webp");
    });

    it("2. (Edge Case: Missing Thumb 404) Should fall back to original src when thumb fails", () => {
      render(<TableThumbnailImage src={sampleStorageWebp} alt="Condo" />);
      const img = screen.getByTestId("table-next-image");

      act(() => {
        fireEvent.error(img);
      });

      // Should now be the original full-res URL
      expect(img.getAttribute("src")).toBe(sampleStorageWebp);
    });

    it("3. (Edge Case: Broken Image) Should render ImageIcon placeholder if original also fails", () => {
      const { container } = render(<TableThumbnailImage src={sampleStorageWebp} alt="Condo" />);
      const img = screen.getByTestId("table-next-image");

      // First error (thumb missing)
      act(() => {
        fireEvent.error(img);
      });
      // Second error (original missing/404)
      act(() => {
        fireEvent.error(img);
      });

      // Next image should be unmounted, replaced by fallback container
      expect(screen.queryByTestId("table-next-image")).toBeNull();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("4. (Edge Case: Props change on pagination/filter) Should reset to new thumb on src change", () => {
      const { rerender } = render(<TableThumbnailImage src={sampleStorageWebp} alt="Condo 1" />);
      expect(screen.getByTestId("table-next-image").getAttribute("src")).toContain("condo-cover-thumb.webp");

      const newSrc = "https://cdn.vccasset.com/storage/v1/object/public/property-images/new-condo.webp";
      rerender(<TableThumbnailImage src={newSrc} alt="Condo 2" />);

      expect(screen.getByTestId("table-next-image").getAttribute("src")).toContain("new-condo-thumb.webp");
    });

    it("5. (Edge Case: External WebP) Should not append -thumb.webp to external images", () => {
      render(<TableThumbnailImage src={sampleExternalWebp} alt="Unsplash" />);
      const img = screen.getByTestId("table-next-image");
      expect(img.getAttribute("src")).toBe(sampleExternalWebp);
    });

    it("6. (Edge Case: JPG Images) Should remain JPG without error", () => {
      render(<TableThumbnailImage src={sampleJpg} alt="Jpg photo" />);
      const img = screen.getByTestId("table-next-image");
      expect(img.getAttribute("src")).toBe(sampleJpg);
    });
  });

  describe("Mobile MobileThumbnailImage", () => {
    it("7. Should render native lazy loading and async decoding", () => {
      render(<MobileThumbnailImage src={sampleStorageWebp} alt="Mobile Condo" />);
      const img = screen.getByRole("img");
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("decoding")).toBe("async");
      expect(img.getAttribute("src")).toContain("condo-cover-thumb.webp");
    });

    it("8. (Edge Case: Double Error) Mobile should gracefully fallback to placeholder", () => {
      const { container } = render(<MobileThumbnailImage src={sampleStorageWebp} alt="Mobile Condo" />);
      const img = screen.getByRole("img");

      // Thumb 404
      act(() => fireEvent.error(img));
      // Original 404
      act(() => fireEvent.error(img));

      expect(screen.queryByRole("img")).toBeNull();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });
});
