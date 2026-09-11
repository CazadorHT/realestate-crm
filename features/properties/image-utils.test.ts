import { describe, it, expect } from "vitest";
import { getThumbnailUrl, getPublicImageUrl } from "./image-utils";

describe("image-utils - getThumbnailUrl", () => {
  it("should return empty string for empty, null, or undefined input", () => {
    expect(getThumbnailUrl("")).toBe("");
    expect(getThumbnailUrl(null)).toBe("");
    expect(getThumbnailUrl(undefined)).toBe("");
  });

  it("should convert a .webp storage path or URL to -thumb.webp", () => {
    const storagePath = "properties/user-123/session-456/photo.webp";
    const thumbUrl = getThumbnailUrl(storagePath);
    expect(thumbUrl).toContain("photo-thumb.webp");
  });

  it("should not double-append -thumb if already a thumbnail", () => {
    const thumbUrl = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-thumb.webp";
    expect(getThumbnailUrl(thumbUrl)).toBe(thumbUrl);
  });

  it("should leave non-webp extensions unchanged as fallback", () => {
    const jpgUrl = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo.jpg";
    expect(getThumbnailUrl(jpgUrl)).toBe(jpgUrl);
  });

  it("should correctly handle webp URLs with query parameters", () => {
    const webpWithQuery = "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo.webp?t=123456";
    expect(getThumbnailUrl(webpWithQuery)).toBe(
      "https://cdn.vccasset.com/storage/v1/object/public/property-images/photo-thumb.webp?t=123456"
    );
  });
});
