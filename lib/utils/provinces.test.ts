import { describe, it, expect } from "vitest";
import {
  getProvinceName,
  getDistrictName,
  getSubdistrictName,
  PROVINCES,
} from "./provinces";

describe("Provinces & Districts Localization (lib/utils/provinces)", () => {
  describe("getProvinceName", () => {
    it("should return English province name correctly", () => {
      expect(getProvinceName("ชลบุรี", "en")).toBe("Chon Buri");
      expect(getProvinceName("กรุงเทพมหานคร", "en")).toBe("Bangkok");
      expect(getProvinceName("ภูเก็ต", "en")).toBe("Phuket");
      expect(getProvinceName("เชียงใหม่", "en")).toBe("Chiang Mai");
    });

    it("should return Chinese and Russian province names", () => {
      expect(getProvinceName("ชลบุรี", "cn")).toBe("春武里府");
      expect(getProvinceName("ชลบุรี", "ru")).toBe("Чонбури");
      expect(getProvinceName("กรุงเทพมหานคร", "cn")).toBe("曼谷");
      expect(getProvinceName("กรุงเทพมหานคร", "ru")).toBe("Бангкок");
    });

    it("should handle 'จังหวัด' prefix", () => {
      expect(getProvinceName("จังหวัดชลบุรี", "en")).toBe("Chon Buri");
      expect(getProvinceName("จ.ภูเก็ต", "en")).toBe("Phuket");
    });

    it("should fallback to Thai when language is 'th' or unknown", () => {
      expect(getProvinceName("ชลบุรี", "th")).toBe("ชลบุรี");
      expect(getProvinceName("จังหวัดที่ไม่รู้จัก", "en")).toBe("จังหวัดที่ไม่รู้จัก");
    });
  });

  describe("getDistrictName", () => {
    it("should translate major Chonburi & Pattaya districts", () => {
      expect(getDistrictName("บางละมุง", "en")).toBe("Bang Lamung");
      expect(getDistrictName("อำเภอบางละมุง", "en")).toBe("Bang Lamung");
      expect(getDistrictName("บางละมุง", "cn")).toBe("挽腊茫");
      expect(getDistrictName("บางละมุง", "ru")).toBe("Бангламунг");
      expect(getDistrictName("ศรีราชา", "en")).toBe("Si Racha");
      expect(getDistrictName("พัทยา", "en")).toBe("Pattaya");
      expect(getDistrictName("จอมเทียน", "en")).toBe("Jomtien");
    });

    it("should translate Bangkok districts & popular areas", () => {
      expect(getDistrictName("เขตวัฒนา", "en")).toBe("Watthana");
      expect(getDistrictName("ทองหล่อ", "en")).toBe("Thong Lo");
      expect(getDistrictName("เอกมัย", "en")).toBe("Ekkamai");
      expect(getDistrictName("พระราม 9", "en")).toBe("Rama 9");
      expect(getDistrictName("อารีย์", "en")).toBe("Ari");
    });

    it("should translate Phuket & Chiang Mai districts", () => {
      expect(getDistrictName("กะทู้", "en")).toBe("Kathu");
      expect(getDistrictName("ถลาง", "en")).toBe("Thalang");
      expect(getDistrictName("นิมมาน", "en")).toBe("Nimman");
      expect(getDistrictName("หางดง", "en")).toBe("Hang Dong");
    });

    it("should return cleaned Thai name when language is 'th'", () => {
      expect(getDistrictName("เขตบางนา", "th")).toBe("เขตบางนา");
    });
  });

  describe("getSubdistrictName", () => {
    it("should strip 'ตำบล' or 'แขวง' prefix and translate known subdistricts", () => {
      expect(getSubdistrictName("ตำบลหนองปรือ", "en")).toBe("Nong Prue");
      expect(getSubdistrictName("แขวงคลองเตย", "en")).toBe("Khlong Toei");
    });
  });
});
