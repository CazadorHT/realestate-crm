import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  PropertyDownloadStudioModal,
  normalizeImageItems,
  calculateResizeDimensions,
  generateSmartFileName,
  drawWatermark,
} from "./PropertyDownloadStudioModal";

// Mock LanguageProvider
vi.mock("@/components/providers/LanguageProvider", () => ({
  useLanguage: () => ({ language: "th" }),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PropertyDownloadStudio Utilities", () => {
  it("normalizeImageItems normalizes strings and objects properly", () => {
    const rawList = [
      "https://example.com/img1.jpg",
      { url: "https://example.com/img2.png", is_cover: true },
      { storage_path: "property-images/img3.webp" },
    ];

    const result = normalizeImageItems(rawList);
    expect(result).toHaveLength(3);
    expect(result[0].url).toBe("https://example.com/img1.jpg");
    expect(result[0].isCover).toBe(true); // first item defaults to cover
    expect(result[1].isCover).toBe(true);
    expect(result[2].url).toContain("/storage/v1/object/public/property-images/img3.webp");
  });

  it("calculateResizeDimensions preserves aspect ratio", () => {
    // Landscape 4000x3000 resized to 1080
    const landscape = calculateResizeDimensions(4000, 3000, 1080);
    expect(landscape.width).toBe(1080);
    expect(landscape.height).toBe(810);

    // Portrait 3000x4000 resized to 800
    const portrait = calculateResizeDimensions(3000, 4000, 800);
    expect(portrait.height).toBe(800);
    expect(portrait.width).toBe(600);

    // Small image below maxEdge stays unchanged
    const small = calculateResizeDimensions(500, 400, 1080);
    expect(small.width).toBe(500);
    expect(small.height).toBe(400);
  });

  it("generateSmartFileName formats filenames with ID, COVER, and title", () => {
    const nameWithCover = generateSmartFileName(
      "prop-99887766",
      "Life Asoke Hype",
      1,
      true,
      true,
      "jpg"
    );
    expect(nameWithCover).toBe("PROP-998_01_COVER_Life_Asoke_Hype.jpg");

    const regularName = generateSmartFileName(
      "prop-99887766",
      "Life Asoke Hype",
      2,
      false,
      true,
      "png"
    );
    expect(regularName).toBe("PROP-998_02_Life_Asoke_Hype.png");

    const nonSmart = generateSmartFileName(
      "prop-99887766",
      "Life Asoke Hype",
      3,
      false,
      false,
      "webp"
    );
    expect(nonSmart).toBe("image_03.webp");
  });

  it("drawWatermark draws on canvas context without throwing", () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      font: "",
      textBaseline: "",
      fillStyle: "",
      measureText: vi.fn(() => ({ width: 120 })),
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      roundRect: vi.fn(),
      rect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    drawWatermark(mockCtx, 1920, 1080, "VC CONNECT | 081-234-5678", "bottom-right");
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});

describe("PropertyDownloadStudioModal Component", () => {
  const images = [
    { url: "https://example.com/img1.jpg", is_cover: true },
    { url: "https://example.com/img2.png" },
    { url: "https://example.com/img3.webp" },
  ];

  it("renders modal when isOpen is true with preset options and image selection", () => {
    const onClose = vi.fn();
    render(
      <PropertyDownloadStudioModal
        isOpen={true}
        onClose={onClose}
        images={images}
        propertyId="prop-12345678"
        propertyTitle="Modern Loft"
        propertyCode="CS-101"
        agentInfo={{
          name: "John Agent",
          phone: "089-999-9999",
          company_name: "VC CONNECT",
        }}
      />
    );

    expect(screen.getByText("สตูดิโอดาวน์โหลดรูปภาพ")).toBeDefined();
    expect(screen.getByText("3 / 3 รูปที่เลือก")).toBeDefined();
    expect(screen.getByText("JPG")).toBeDefined();
    expect(screen.getByText("Social (1080p)")).toBeDefined();
    expect(screen.getByText("ใส่ลายน้ำป้องกันการคัดลอก (Watermark)")).toBeDefined();
  });

  it("toggles watermark options when switch is clicked", async () => {
    render(
      <PropertyDownloadStudioModal
        isOpen={true}
        onClose={vi.fn()}
        images={images}
        propertyId="prop-12345678"
        propertyTitle="Modern Loft"
        propertyCode="CS-101"
      />
    );

    const switchBtn = screen.getByLabelText("ใส่ลายน้ำป้องกันการคัดลอก (Watermark)");
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText(/ข้อความลายน้ำ/)).toBeDefined();
      expect(screen.getByText("ขวาล่าง")).toBeDefined();
    });
  });

  it("handles Select All, Deselect All, and Cover Only buttons", async () => {
    render(
      <PropertyDownloadStudioModal
        isOpen={true}
        onClose={vi.fn()}
        images={images}
        propertyId="prop-12345678"
        propertyTitle="Modern Loft"
      />
    );

    const deselectBtn = screen.getByText("ล้างการเลือก");
    fireEvent.click(deselectBtn);
    expect(screen.getByText("0 / 3 รูปที่เลือก")).toBeDefined();

    const selectAllBtn = screen.getByText("เลือกทั้งหมด");
    fireEvent.click(selectAllBtn);
    expect(screen.getByText("3 / 3 รูปที่เลือก")).toBeDefined();

    const coverOnlyBtn = screen.getByText("เฉพาะภาพปก");
    fireEvent.click(coverOnlyBtn);
    expect(screen.getByText("1 / 3 รูปที่เลือก")).toBeDefined();
  });
});
