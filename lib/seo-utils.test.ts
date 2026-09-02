import { describe, it, expect } from "vitest";
import {
  generatePropertySlug,
  generateMetaTitle,
  generateMetaDescription,
  getSeoAlternates,
  generateStructuredData,
  generateBreadcrumbSchema,
  generateStationFAQSchema,
  generateAreaFAQSchema,
} from "./seo-utils";
import { siteConfig } from "./site-config";

describe("SEO Utilities", () => {
  const mockProperty: any = {
    title: "Luxury Condo",
    property_type: "CONDO",
    listing_type: "RENT",
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 85,
    rental_price: 55000,
    district: "Watthana",
    province: "Bangkok",
    near_transit: true,
    transit_station_name: "Thong Lo",
  };

  describe("generatePropertySlug", () => {
    it("should generate a slug containing title and basic info", () => {
      const slug = generatePropertySlug(mockProperty, "en");
      expect(slug).toContain("luxury");
      expect(slug).toContain("condo");
      expect(slug).toContain("2br");
      expect(slug).toContain("2ba");
      expect(slug).toContain("85sqm");
    });

    it("should transliterate and strip Thai characters to produce an English slug", () => {
      const thProperty = { ...mockProperty, title: "คอนโดหรูใกล้ BTS ทองหล่อ" };
      const slug = generatePropertySlug(thProperty, "th");
      expect(slug).toContain("condo");
      expect(slug).toContain("luxury");
      expect(slug).toContain("near");
      expect(slug).toContain("bts");
      expect(slug).not.toContain("ทองหล่อ");
    });

    it("should include SEO flags in slug", () => {
      const hotProperty = { ...mockProperty, is_hot_sale: true, is_pet_friendly: true };
      const slug = generatePropertySlug(hotProperty, "en");
      expect(slug).toContain("hot-deal");
      expect(slug).toContain("pet-friendly");
    });
  });

  describe("generateMetaTitle", () => {
    it("should generate a correctly formatted meta title", () => {
      const title = generateMetaTitle(mockProperty, "en");
      expect(title).toContain("Luxury Condo");
      expect(title).toContain("For Rent");
      expect(title).toContain("Watthana");
    });

    it("should truncate long titles", () => {
      const longProperty = {
        ...mockProperty,
        title:
          "A very very very very long property title that should definitely be truncated by the SEO utility",
      };
      const title = generateMetaTitle(longProperty, "en");
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).toContain("...");
    });
  });

  describe("generateMetaDescription", () => {
    it("should include price and key specs in description", () => {
      const desc = generateMetaDescription(mockProperty, "en");
      expect(desc).toContain("2 Bedrooms");
      expect(desc).toContain("2 Bathrooms");
      expect(desc).toContain("Size 85 sqm");
      expect(desc).toContain("Rent 55,000 THB/month");
    });

    it("should handle Sale price correctly", () => {
      const saleProperty = { ...mockProperty, listing_type: "SALE", price: 15000000 };
      const desc = generateMetaDescription(saleProperty, "en");
      expect(desc).toContain("Price 15,000,000 THB");
    });
  });

  describe("getSeoAlternates", () => {
    it("should generate proper canonical and ISO 639-1 language alternates", () => {
      const alternates = getSeoAlternates("/properties/pet-friendly-condo");

      expect(alternates.canonical).toBe(
        `${siteConfig.url}/properties/pet-friendly-condo`
      );
      expect(alternates.languages.th).toBe(
        `${siteConfig.url}/th/properties/pet-friendly-condo`
      );
      expect(alternates.languages.en).toBe(
        `${siteConfig.url}/en/properties/pet-friendly-condo`
      );
      expect(alternates.languages["zh-Hans"]).toBe(
        `${siteConfig.url}/cn/properties/pet-friendly-condo`
      );
      expect(alternates.languages.ru).toBe(
        `${siteConfig.url}/ru/properties/pet-friendly-condo`
      );
      expect(alternates.languages["x-default"]).toBe(
        `${siteConfig.url}/properties/pet-friendly-condo`
      );
    });

    it("should handle root path without double slashes", () => {
      const alternates = getSeoAlternates("/");

      expect(alternates.canonical).toBe(siteConfig.url);
      expect(alternates.languages.th).toBe(`${siteConfig.url}/th`);
      expect(alternates.languages.en).toBe(`${siteConfig.url}/en`);
      expect(alternates.languages["zh-Hans"]).toBe(`${siteConfig.url}/cn`);
      expect(alternates.languages.ru).toBe(`${siteConfig.url}/ru`);
      expect(alternates.languages["x-default"]).toBe(siteConfig.url);
    });
  });

  describe("generateStructuredData (Schema.org Conformance)", () => {
    it("should place offers inside mainEntity and NOT at root of RealEstateListing", () => {
      const mockData = {
        id: "prop-123",
        title: "Luxury Condo Thong Lo",
        slug: "luxury-condo-thong-lo",
        description: "Beautiful modern condo in Thong Lo",
        property_type: "CONDO" as const,
        listing_type: "SALE_AND_RENT" as const,
        price: 15000000,
        rental_price: 60000,
        bedrooms: 2,
        size_sqm: 85,
        address_line1: "Sukhumvit 55",
        district: "Watthana",
        province: "Bangkok",
        postal_code: "10110",
      };

      const schema = generateStructuredData(mockData);

      // Root must be RealEstateListing
      expect(schema["@type"]).toBe("RealEstateListing");
      // Root MUST NOT contain offers (avoids GSC <parent_node> error)
      expect(schema.offers).toBeUndefined();

      // mainEntity must be Apartment
      expect(schema.mainEntity).toBeDefined();
      expect(schema.mainEntity["@type"]).toBe("Apartment");
      expect(schema.mainEntity.numberOfRooms).toBe(2);
      expect(schema.mainEntity.floorSize.value).toBe(85);

      // offers must be inside mainEntity
      expect(schema.mainEntity.offers).toBeDefined();
      expect(Array.isArray(schema.mainEntity.offers)).toBe(true);
      expect(schema.mainEntity.offers).toHaveLength(2); // Sale + Rent

      const saleOffer = schema.mainEntity.offers.find(
        (o: any) => o.businessFunction === "http://purl.org/goodrelations/v1#Sell"
      );
      expect(saleOffer).toBeDefined();
      expect(saleOffer.price).toBe(15000000);

      const rentOffer = schema.mainEntity.offers.find(
        (o: any) => o.businessFunction === "http://purl.org/goodrelations/v1#LeaseOut"
      );
      expect(rentOffer).toBeDefined();
      expect(rentOffer.price).toBe(60000);
    });
  });

  describe("generatePropertyBreadcrumbSchema", () => {
    it("should generate 1-based sequential BreadcrumbList with encoded URLs", () => {
      const mockData = {
        title: "Modern Villa Sukhumvit",
        slug: "modern-villa-sukhumvit",
        listing_type: "SALE",
        property_type: "HOUSE",
        province: "Bangkok",
        district: "Watthana",
      };

      const breadcrumbs = generateBreadcrumbSchema(mockData as any, "th");

      expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
      expect(breadcrumbs.itemListElement.length).toBeGreaterThanOrEqual(4);

      // Verify sequential positions: 1, 2, 3, 4...
      breadcrumbs.itemListElement.forEach((el: any, index: number) => {
        expect(el.position).toBe(index + 1);
        expect(el.item).toBeDefined();
        expect(typeof el.item).toBe("string");
        expect(el.item.startsWith("http")).toBe(true);
        expect(el.item).not.toContain("//properties"); // no double slashes
      });
    });
  });

  describe("FAQ Schemas", () => {
    it("should generate valid FAQPage with Question and acceptedAnswer", () => {
      const stationFaq = generateStationFAQSchema("BTS Asok", "th") as {
        "@type": string;
        mainEntity: Array<{
          "@type": string;
          acceptedAnswer: { "@type": string; text: string };
        }>;
      };

      expect(stationFaq["@type"]).toBe("FAQPage");
      expect(stationFaq.mainEntity.length).toBeGreaterThan(0);
      expect(stationFaq.mainEntity[0]["@type"]).toBe("Question");
      expect(stationFaq.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
      expect(stationFaq.mainEntity[0].acceptedAnswer.text).toBeTruthy();

      const areaFaq = generateAreaFAQSchema("Thong Lo", "th") as {
        "@type": string;
        mainEntity: Array<{
          "@type": string;
          acceptedAnswer: { "@type": string; text: string };
        }>;
      };

      expect(areaFaq["@type"]).toBe("FAQPage");
      expect(areaFaq.mainEntity.length).toBeGreaterThan(0);
      expect(areaFaq.mainEntity[0]["@type"]).toBe("Question");
      expect(areaFaq.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    });
  });
});
