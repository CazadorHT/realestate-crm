/**
 * Duplicate detection utilities
 * - Simple rule-based duplicate detection
 * - No AI required, just fuzzy matching
 */

import { distance } from 'fuzzball';

export interface DuplicateCheckData {
  address_line1?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
}

export interface DuplicateMatch {
  id: string;
  title: string;
  address: string;
  matchScore: number; // 0-100
  matchReasons: string[];
}

/**
 * Calculate similarity score between two addresses
 * Using fuzzy string matching (Levenshtein distance)
 */
function calculateAddressSimilarity(addr1: string, addr2: string): number {
  if (!addr1 || !addr2) return 0;

  // Normalize addresses
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '');

  const normalized1 = normalize(addr1);
  const normalized2 = normalize(addr2);

  // Use fuzzball (fuzzy string matching)
  return distance(normalized1, normalized2);
}

/**
 * Check if two properties are likely duplicates
 */
export function checkDuplicate(
  property1: DuplicateCheckData,
  property2: DuplicateCheckData
): {
  isDuplicate: boolean;
  matchScore: number;
  matchReasons: string[];
} {
  const matchReasons: string[] = [];
  let matchScore = 0;

  // 1. Address matching (most important - 40 points)
  if (property1.address_line1 && property2.address_line1) {
    const addressSimilarity = calculateAddressSimilarity(
      property1.address_line1,
      property2.address_line1
    );

    if (addressSimilarity >= 85) {
      matchScore += 40;
      matchReasons.push('ที่อยู่เหมือนกัน');
    } else if (addressSimilarity >= 70) {
      matchScore += 20;
      matchReasons.push('ที่อยู่คล้ายกัน');
    }
  }

  // 2. District + Province match (20 points)
  if (
    property1.district &&
    property2.district &&
    property1.province &&
    property2.province
  ) {
    const districtMatch =
      property1.district.toLowerCase() === property2.district.toLowerCase();
    const provinceMatch =
      property1.province.toLowerCase() === property2.province.toLowerCase();

    if (districtMatch && provinceMatch) {
      matchScore += 20;
      matchReasons.push('ตั้งอยู่ในเขตเดียวกัน');
    }
  }

  // 3. Price similarity (15 points)
  if (property1.price && property2.price) {
    const priceDiff = Math.abs(property1.price - property2.price);
    const avgPrice = (property1.price + property2.price) / 2;
    const priceVariance = (priceDiff / avgPrice) * 100;

    if (priceVariance < 5) {
      matchScore += 15;
      matchReasons.push('ราคาเท่ากัน');
    } else if (priceVariance < 10) {
      matchScore += 10;
      matchReasons.push('ราคาใกล้เคียง');
    }
  }

  // 4. Room count match (15 points)
  if (property1.bedrooms && property2.bedrooms) {
    if (property1.bedrooms === property2.bedrooms) {
      matchScore += 8;
      matchReasons.push('จำนวนห้องนอนเท่ากัน');
    }
  }

  if (property1.bathrooms && property2.bathrooms) {
    if (property1.bathrooms === property2.bathrooms) {
      matchScore += 7;
      matchReasons.push('จำนวนห้องน้ำเท่ากัน');
    }
  }

  // 5. Size similarity (10 points)
  if (property1.size_sqm && property2.size_sqm) {
    const sizeDiff = Math.abs(property1.size_sqm - property2.size_sqm);
    const avgSize = (property1.size_sqm + property2.size_sqm) / 2;
    const sizeVariance = (sizeDiff / avgSize) * 100;

    if (sizeVariance < 5) {
      matchScore += 10;
      matchReasons.push('ขนาดพื้นที่เท่ากัน');
    } else if (sizeVariance < 10) {
      matchScore += 5;
      matchReasons.push('ขนาดพื้นที่ใกล้เคียง');
    }
  }

  // Duplicate threshold: > 60 points
  const isDuplicate = matchScore >= 60;

  return {
    isDuplicate,
    matchScore,
    matchReasons,
  };
}

/**
 * Find similar properties from a list
 */
export function findSimilarProperties<T extends DuplicateCheckData & { id: string; title: string }>(
  targetProperty: DuplicateCheckData,
  existingProperties: T[],
  threshold: number = 60
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const existing of existingProperties) {
    const result = checkDuplicate(targetProperty, existing);

    if (result.matchScore >= threshold) {
      const fullAddress = [
        existing.address_line1,
        existing.district,
        existing.province,
      ]
        .filter(Boolean)
        .join(', ');

      matches.push({
        id: existing.id,
        title: existing.title,
        address: fullAddress,
        matchScore: result.matchScore,
        matchReasons: result.matchReasons,
      });
    }
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
