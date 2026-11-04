import { describe, expect, it } from "vitest";
import {
  computeTransitTravelInfo,
  createGeoJSONCircle,
  getTransitTypeLabel,
  haversineDistanceMeters,
  getPinProjectOrPropertyHeadline,
  formatCompactPillAmount,
} from "../map-price-utils";
import type { SlimMapPin } from "@/lib/services/map-pins";

describe("map-price-utils", () => {
  it("translates raw transit enums to human-friendly Thai labels", () => {
    expect(getTransitTypeLabel("MRT_YELLOW")).toBe("MRT สายสีเหลือง");
    expect(getTransitTypeLabel("MRT_PURPLE")).toBe("MRT สายสีม่วง");
    expect(getTransitTypeLabel("MRT_PINK")).toBe("MRT สายสีชมพู");
    expect(getTransitTypeLabel("MRT_BLUE")).toBe("MRT สายสีน้ำเงิน");
    expect(getTransitTypeLabel("BTS_LIGHT_GREEN")).toBe("BTS สายสุขุมวิท");
    expect(getTransitTypeLabel("BTS_DARK_GREEN")).toBe("BTS สายสีลม");
    expect(getTransitTypeLabel("BTS_GOLD")).toBe("BTS สายสีทอง");
    expect(getTransitTypeLabel("ARL")).toBe("Airport Rail Link");
    expect(getTransitTypeLabel("SRT_RED")).toBe("รถไฟฟ้าสายสีแดง");
  });

  it("calculates accurate haversine distance between coordinates", () => {
    // Distance between Siam BTS (13.7456, 100.5342) and Chit Lom BTS (13.7441, 100.5431) is ~970m
    const dist = haversineDistanceMeters(13.7456, 100.5342, 13.7441, 100.5431);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(1050);
  });

  it("creates valid GeoJSON Polygon for station radar circles", () => {
    const circle = createGeoJSONCircle([100.5342, 13.7456], 1); // 1km radius at Siam
    expect(circle.type).toBe("Feature");
    expect(circle.geometry.type).toBe("Polygon");
    expect(circle.geometry.coordinates[0].length).toBe(65); // 64 segments + closing point
    // First and last coordinate must match to form closed polygon
    const coords = circle.geometry.coordinates[0];
    expect(coords[0][0]).toBeCloseTo(coords[coords.length - 1][0], 5);
    expect(coords[0][1]).toBeCloseTo(coords[coords.length - 1][1], 5);
  });

  describe("computeTransitTravelInfo (Real-world distance vs speed correlation)", () => {
    it("classifies fast travel (700m in 3 mins = 233m/min) as vehicle/motorbike taxi (isWalk = false)", () => {
      const res = computeTransitTravelInfo({
        distanceMeters: 700,
        explicitTime: "3",
      });
      expect(res.isWalk).toBe(false);
      expect(res.minutes).toBe(3);
      expect(res.timeLabel).toBe("3 นาที");
      expect(res.distLabel).toBe("700 ม.");
      expect(res.summaryLabel).toBe("3 นาที (700 ม.)");
      expect(res.modeLabel).toBe("รถ/วิน");
    });

    it("classifies realistic walking (700m in 8 mins = 87m/min) as walking (isWalk = true)", () => {
      const res = computeTransitTravelInfo({
        distanceMeters: 700,
        explicitTime: "8",
      });
      expect(res.isWalk).toBe(true);
      expect(res.minutes).toBe(8);
      expect(res.timeLabel).toBe("8 นาที");
      expect(res.distLabel).toBe("700 ม.");
      expect(res.summaryLabel).toBe("8 นาที (700 ม.)");
      expect(res.modeLabel).toBe("เดิน");
    });

    it("calculates realistic walking time (~10-12 mins / km) when no time is specified for short distances", () => {
      const res500 = computeTransitTravelInfo({ distanceMeters: 500 });
      expect(res500.isWalk).toBe(true);
      expect(res500.minutes).toBe(6); // 500 / 90 ~ 6 mins
      expect(res500.summaryLabel).toBe("6 นาที (500 ม.)");

      const res700 = computeTransitTravelInfo({ distanceMeters: 700 });
      expect(res700.isWalk).toBe(true);
      expect(res700.minutes).toBe(8); // 700 / 90 ~ 8 mins
      expect(res700.summaryLabel).toBe("8 นาที (700 ม.)");
    });

    it("respects explicit Thai text override (e.g. 'วิน 2 นาที' or 'เดิน 15 นาที')", () => {
      const bike = computeTransitTravelInfo({
        distanceMeters: 300,
        explicitTime: "วิน 2 นาที",
      });
      expect(bike.isWalk).toBe(false);
      expect(bike.minutes).toBe(2);

      const walk = computeTransitTravelInfo({
        distanceMeters: 1400,
        explicitTime: "เดิน 18 นาที",
      });
      expect(walk.isWalk).toBe(true);
      expect(walk.minutes).toBe(18);
    });
  });

  describe("getPinProjectOrPropertyHeadline", () => {
    it("returns authoritative project name when available", () => {
      const pin = {
        id: "p1",
        title: "ขายด่วน คอนโดหรูใจกลางเมือง",
        project_name: "Ashton Asoke",
        latitude: 13.74,
        longitude: 100.56,
      } as unknown as SlimMapPin;

      const res = getPinProjectOrPropertyHeadline(pin, "th");
      expect(res.isProjectHeadline).toBe(true);
      expect(res.primaryTitle).toBe("Ashton Asoke");
    });

    it("falls back to listing title when project name is missing", () => {
      const pin = {
        id: "p2",
        title: "บ้านเดี่ยว สุขุมวิท 26",
        project_name: null,
        popular_area: "พร้อมพงษ์",
        latitude: 13.73,
        longitude: 100.57,
      } as unknown as SlimMapPin;

      const res = getPinProjectOrPropertyHeadline(pin, "th");
      expect(res.isProjectHeadline).toBe(false);
      expect(res.primaryTitle).toBe("บ้านเดี่ยว สุขุมวิท 26");
    });
  });

  describe("formatCompactPillAmount", () => {
    it("formats rental amount with spaced currency and month suffix", () => {
      expect(formatCompactPillAmount(17000, "RENT", "th")).toBe("฿ 17K / ด.");
      expect(formatCompactPillAmount(88000, "RENT", "th")).toBe("฿ 88K / ด.");
      expect(formatCompactPillAmount(120000, "RENT", "th")).toBe("฿ 120K / ด.");
      expect(formatCompactPillAmount(17000, "RENT", "en")).toBe("฿ 17K / mo");
    });

    it("formats sale amount with spaced currency", () => {
      expect(formatCompactPillAmount(32500000, "SALE", "th")).toBe("฿ 32.5M");
      expect(formatCompactPillAmount(950000, "SALE", "th")).toBe("฿ 950K");
    });
  });
});
