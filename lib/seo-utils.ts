/**
 * SEO/AEO/GEO/AIO utilities
 * - Auto-generate SEO metadata
 * - Create slugs
 * - Generate structured data (Schema.org)
 */

import slugify from 'slugify';
import type { Database } from '@/lib/database.types';

type PropertyType = Database['public']['Enums']['property_type'];
type ListingType = Database['public']['Enums']['listing_type'];

export interface PropertySEOData {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  structuredData: any; // Schema.org JSON-LD
}

interface PropertyDataForSEO {
  title: string;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  price?: number;
  rental_price?: number;
  district?: string;
  province?: string;
  address_line1?: string;
  postal_code?: string;
  description?: string;
}

/**
 * Generate URL-friendly slug
 */
export function generatePropertySlug(data: PropertyDataForSEO): string {
  const parts = [
    data.bedrooms && `${data.bedrooms}-bedroom`,
    data.property_type?.toLowerCase(),
    data.district?.toLowerCase(),
    data.province?.toLowerCase(),
    data.price && `${Math.floor(data.price / 1000)}k`,
  ].filter(Boolean);

  const slug = slugify(parts.join('-'), {
    lower: true,
    strict: true,
    locale: 'th',
  });

  // Add random suffix to ensure uniqueness
  const suffix = Date.now().toString(36).slice(-4);
  return `${slug}-${suffix}`;
}

/**
 * Generate meta title (max 60 characters for SEO)
 */
export function generateMetaTitle(data: PropertyDataForSEO): string {
  const parts = [];

  if (data.bedrooms) parts.push(`${data.bedrooms} ห้องนอน`);
  if (data.property_type) parts.push(data.property_type);
  if (data.district) parts.push(data.district);

  const title = parts.join(' ');
  const suffix = ' | Real Estate CRM';

  // Truncate if too long
  if (title.length + suffix.length > 60) {
    return title.slice(0, 60 - suffix.length - 3) + '...' + suffix;
  }

  return title + suffix;
}

/**
 * Generate meta description (max 160 characters for SEO)
 */
export function generateMetaDescription(data: PropertyDataForSEO): string {
  const parts = [];

  if (data.property_type) parts.push(data.property_type);
  if (data.bedrooms) parts.push(`${data.bedrooms} ห้องนอน`);
  if (data.bathrooms) parts.push(`${data.bathrooms} ห้องน้ำ`);
  if (data.size_sqm) parts.push(`พื้นที่ ${data.size_sqm} ตร.ม.`);
  if (data.district && data.province) parts.push(`ที่ ${data.district} ${data.province}`);

  let description = parts.join(' ');

  // Add price
  if (data.price) {
    description += ` ราคา ${data.price.toLocaleString()} บาท`;
  } else if (data.rental_price) {
    description += ` ค่าเช่า ${data.rental_price.toLocaleString()} บาท/เดือน`;
  }

  // Truncate if too long
  if (description.length > 160) {
    description = description.slice(0, 157) + '...';
  }

  return description;
}

/**
 * Generate meta keywords
 */
export function generateMetaKeywords(data: PropertyDataForSEO): string[] {
  const keywords = new Set<string>();

  if (data.property_type) keywords.add(data.property_type);
  if (data.listing_type) keywords.add(data.listing_type);
  if (data.district) keywords.add(data.district);
  if (data.province) keywords.add(data.province);
  if (data.bedrooms) keywords.add(`${data.bedrooms} ห้องนอน`);

  // Add common keywords
  keywords.add('ขายบ้าน');
  keywords.add('เช่าบ้าน');
  keywords.add('อสังหาริมทรัพย์');
  keywords.add('บ้านมือสอง');

  return Array.from(keywords);
}

/**
 * Generate Schema.org structured data (JSON-LD)
 * For better SEO and rich snippets
 */
export function generateStructuredData(data: PropertyDataForSEO): any {
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: data.title,
  };

  // Address
  if (data.address_line1 || data.district || data.province) {
    structuredData.address = {
      '@type': 'PostalAddress',
      streetAddress: data.address_line1,
      addressLocality: data.district,
      addressRegion: data.province,
      postalCode: data.postal_code,
      addressCountry: 'TH',
    };
  }

  // Offer (price)
  if (data.price || data.rental_price) {
    structuredData.offers = {
      '@type': 'Offer',
      price: data.price || data.rental_price,
      priceCurrency: 'THB',
    };
  }

  // Property details
  if (data.bedrooms) {
    structuredData.numberOfRooms = data.bedrooms;
  }

  if (data.size_sqm) {
    structuredData.floorSize = {
      '@type': 'QuantitativeValue',
      value: data.size_sqm,
      unitCode: 'MTK', // Square meter
    };
  }

  if (data.description) {
    structuredData.description = data.description;
  }

  return structuredData;
}

/**
 * Generate all SEO data at once
 */
export function generatePropertySEO(data: PropertyDataForSEO): PropertySEOData {
  return {
    slug: generatePropertySlug(data),
    metaTitle: generateMetaTitle(data),
    metaDescription: generateMetaDescription(data),
    metaKeywords: generateMetaKeywords(data),
    structuredData: generateStructuredData(data),
  };
}
