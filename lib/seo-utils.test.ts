import { describe, it, expect } from 'vitest';
import { generatePropertySlug, generateMetaTitle, generateMetaDescription } from './seo-utils';

describe('SEO Utilities', () => {
  const mockProperty: any = {
    title: 'Luxury Condo',
    property_type: 'CONDO',
    listing_type: 'RENT',
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 85,
    rental_price: 55000,
    district: 'Watthana',
    province: 'Bangkok',
    near_transit: true,
    transit_station_name: 'Thong Lo',
  };

  describe('generatePropertySlug', () => {
    it('should generate a slug containing title and basic info', () => {
      const slug = generatePropertySlug(mockProperty, 'en');
      expect(slug).toContain('luxury');
      expect(slug).toContain('condo');
      expect(slug).toContain('2br');
      expect(slug).toContain('2ba');
      expect(slug).toContain('85sqm');
    });

    it('should transliterate and strip Thai characters to produce an English slug', () => {
      const thProperty = { ...mockProperty, title: 'คอนโดหรูใกล้ BTS ทองหล่อ' };
      const slug = generatePropertySlug(thProperty, 'th');
      expect(slug).toContain('condo');
      expect(slug).toContain('luxury');
      expect(slug).toContain('near');
      expect(slug).toContain('bts');
      expect(slug).not.toContain('ทองหล่อ');
    });

    it('should include SEO flags in slug', () => {
      const hotProperty = { ...mockProperty, is_hot_sale: true, is_pet_friendly: true };
      const slug = generatePropertySlug(hotProperty, 'en');
      expect(slug).toContain('cheap-hot-sale');
      expect(slug).toContain('pet-friendly');
    });
  });

  describe('generateMetaTitle', () => {
    it('should generate a correctly formatted meta title', () => {
      const title = generateMetaTitle(mockProperty, 'en');
      // "Luxury Condo | For Rent | Watthana | Bangkok - siteName"
      expect(title).toContain('Luxury Condo');
      expect(title).toContain('For Rent');
      expect(title).toContain('Watthana');
    });

    it('should truncate long titles', () => {
      const longProperty = { ...mockProperty, title: 'A very very very very long property title that should definitely be truncated by the SEO utility' };
      const title = generateMetaTitle(longProperty, 'en');
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).toContain('...');
    });
  });

  describe('generateMetaDescription', () => {
    it('should include price and key specs in description', () => {
      const desc = generateMetaDescription(mockProperty, 'en');
      expect(desc).toContain('2 Bedrooms');
      expect(desc).toContain('2 Bathrooms');
      expect(desc).toContain('Size 85 sqm');
      expect(desc).toContain('Rent 55,000 THB/month');
    });

    it('should handle Sale price correctly', () => {
      const saleProperty = { ...mockProperty, listing_type: 'SALE', price: 15000000 };
      const desc = generateMetaDescription(saleProperty, 'en');
      expect(desc).toContain('Price 15,000,000 THB');
    });
  });
});
