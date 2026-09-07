import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadAllImagesButton } from "./DownloadAllImagesButton";

// Mock dependencies
vi.mock("@/components/providers/LanguageProvider", () => ({
  useLanguage: () => ({ language: "th" }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DownloadAllImagesButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders download button with correct image count", () => {
    const images = [
      "https://example.com/img1.jpg",
      "https://example.com/img2.png",
      { url: "https://example.com/img3.webp" },
    ];

    render(
      <DownloadAllImagesButton
        images={images}
        propertyId="prop-12345678"
        propertyTitle="Luxury Condo Sukhumvit"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(button.textContent).toContain("3");
  });

  it("disables button when no images are provided", () => {
    render(
      <DownloadAllImagesButton
        images={[]}
        propertyId="prop-empty"
        propertyTitle="No Images"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
  });

  it("opens dropdown format menu when triggered via keydown", async () => {
    const images = ["https://example.com/img1.jpg"];

    render(
      <DownloadAllImagesButton
        images={images}
        propertyId="prop-123"
        propertyTitle="Test Property"
      />
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "ArrowDown", code: "ArrowDown" });

    await waitFor(() => {
      expect(screen.getByText("JPG (.jpg)")).toBeDefined();
      expect(screen.getByText("PNG (.png)")).toBeDefined();
      expect(screen.getByText("WebP (.webp)")).toBeDefined();
      expect(screen.getByText("ไฟล์ต้นฉบับ (Original)")).toBeDefined();
      expect(screen.getByText(/สตูดิโอปรับแต่ง/)).toBeDefined();
    });
  });
});
