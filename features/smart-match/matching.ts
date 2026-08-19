import { SearchCriteria, ScoreBreakdown } from "./types";
import { Database } from "@/lib/database.types.generated";

type PropertyRow = any;

// --- Constants & Config ---
const SCORE_WEIGHTS = {
  PRICE: 40,
  PURPOSE: 20,
  AREA: 30,
  TRANSIT: 10,
  TYPE_BONUS: 30,
  TYPE_PENALTY: -20,
};

const PRICE_BUFFERS = {
  NEAR_MATCH: 1.15, // 15% over budget is still a "near" match
  SLIGHTLY_OVER: 1.1, // 10% over budget
};

// Mapping of Popular Areas (ย่าน) to Database Keywords (Subdistricts/Districts)
const AREA_MAPPING: Record<string, string[]> = {
  อ่อนนุช: ["อ่อนนุช", "พระโขนงเหนือ", "สวนหลวง", "Phra Khanong"],
  บางนา: ["บางนา", "สรรพาวุธ", "ลาซาล", "แบริ่ง", "Bang Na"],
  ลาดพร้าว: ["ลาดพร้าว", "วังทองหลาง", "จตุจักร", "Lat Phrao"],
  "พระราม 9": ["ห้วยขวาง", "บางกะปิ", "ดินแดง", "พระราม 9", "Rama 9"],
  สุขุมวิท: ["คลองเตย", "วัฒนา", "พระโขนง", "Sukhumvit"],
  อารีย์: ["สามเสนใน", "พญาไท", "Ari", "Samsen Nai"],
  ทองหล่อ: ["คลองตันเหนือ", "วัฒนา", "Thong Lo", "Sukhumvit 55"],
  เอกมัย: ["คลองตันเหนือ", "พระโขนงเหนือ", "วัฒนา", "Ekkamai"],
  สยาม: ["ปทุมวัน", "รองเมือง", "Siam", "Pathum Wan"],
  รัชดา: ["ห้วยขวาง", "ดินแดง", "จตุจักร", "Ratchada"],
  ปิ่นเกล้า: ["บางพลัด", "อรุณอมรินทร์", "บางกอกน้อย", "Pinklao"],
  นนทบุรี: ["เมืองนนทบุรี", "ปากเกร็ด", "บางบัวทอง", "Nonthaburi"],
  รามอินทรา: ["คันนายาว", "สายไหม", "บางเขน", "Ram Intra"],
  สาทร: ["ทุ่งมหาเมฆ", "ยานนาวา", "สาทร", "Sathon"],
  สีลม: ["สุริยวงศ์", "สีลม", "บางรัก", "Silom"],
  พญาไท: ["พญาไท", "ราชเทวี", "Phaya Thai"],
  ราชเทวี: ["ทุ่งพญาไท", "ราชเทวี", "Ratchathewi"],
  สะพานควาย: ["สามเสนใน", "พญาไท", "จตุจักร", "Saphan Khwai"],
  พหลโยธิน: ["พหลโยธิน", "จตุจักร", "ลาดยาว", "Phahonyothin"],
  เจริญกรุง: ["บางคอแหลม", "ยานนาวา", "เจริญกรุง", "Charoen Krung"],
  พัฒนาการ: ["สวนหลวง", "ประเวศ", "Phatthanakan"],
  ศรีนครินทร์: ["หนองบอน", "ประเวศ", "บางนา", "Srinakarin"],
  เพชรบุรี: ["บางกะปิ", "ห้วยขวาง", "มักกะสัน", "Phetchaburi"],
  พร้อมพงษ์: ["คลองตัน", "คลองเตย", "Phrom Phong", "Sukhumvit 24"],
  นานา: ["คลองเตย", "วัฒนา", "Nana"],
  อโศก: ["คลองเตยเหนือ", "วัฒนา", "Asoke", "Sukhumvit 21"],
};

// --- Pure Helper Functions ---

/**
 * Resolves the final comparison price for a property based on criteria purpose.
 * Handles fallback between rental/sale prices and office building sqm logic.
 */
function resolvePropertyPrice(property: PropertyRow, purpose: string): number {
  let price = 0;
  const amenities = (property.amenities as any) || {};

  if (purpose === "RENT") {
    price = property.rental_price || property.original_rental_price || amenities.airbnb_monthly_price || property.price || 0;
  } else {
    // BUY or INVEST
    price = property.price || property.original_price || property.rental_price || 0;
  }

  // Office Building Special Case: Calculate total price if only per-sqm is available
  if (price === 0 && property.property_type === "OFFICE_BUILDING") {
    const sqmPrice = purpose === "RENT" ? property.rent_price_per_sqm : property.price_per_sqm;
    if (sqmPrice && property.size_sqm) {
      price = sqmPrice * property.size_sqm;
    }
  }

  return price;
}

/**
 * Calculates score based on budget criteria. Enforces logical boundaries.
 */
function calculatePriceScore(
  effectivePrice: number,
  criteria: SearchCriteria,
): { points: number; reason?: string } {
  if (effectivePrice <= 0) return { points: 0 };

  let { budgetMin, budgetMax } = criteria;

  // Hardening: Handle inverted ranges (min > max) by swapping
  if (budgetMin && budgetMax && budgetMin > budgetMax) {
    [budgetMin, budgetMax] = [budgetMax, budgetMin];
  }

  if (budgetMin && budgetMax) {
    if (effectivePrice >= budgetMin && effectivePrice <= budgetMax) {
      return { points: SCORE_WEIGHTS.PRICE, reason: "budget_ok" };
    }
    if (effectivePrice <= budgetMax * PRICE_BUFFERS.NEAR_MATCH) {
      return { points: SCORE_WEIGHTS.PRICE * 0.75, reason: "budget_near" };
    }
  } else if (budgetMax) {
    if (effectivePrice <= budgetMax) {
      return { points: SCORE_WEIGHTS.PRICE, reason: "budget_ok" };
    }
    if (effectivePrice <= budgetMax * PRICE_BUFFERS.SLIGHTLY_OVER) {
      return { points: SCORE_WEIGHTS.PRICE * 0.625, reason: "budget_slightly_over" };
    }
  }

  return { points: 0 };
}

/**
 * Calculates area matching score using mappings and content search.
 */
function calculateAreaScore(property: PropertyRow, targetArea?: string): { points: number; reason?: string } {
  if (!targetArea) return { points: 0 };

  if (property.popular_area === targetArea) {
    return { points: SCORE_WEIGHTS.AREA, reason: "area_exact" };
  }

  const searchTerms = AREA_MAPPING[targetArea] || [targetArea];
  const propertyText = `${property.popular_area || ""} ${property.district || ""} ${
    property.subdistrict || ""
  } ${property.title} ${property.description}`.toLowerCase();

  const isMatch = searchTerms.some((term) => propertyText.includes(term.toLowerCase()));

  if (isMatch) {
    return { points: SCORE_WEIGHTS.AREA * 0.83, reason: "area_near" };
  }

  if (property.province?.includes("กรุงเทพ") || property.province?.includes("Bangkok")) {
    return { points: SCORE_WEIGHTS.AREA * 0.33, reason: "area_bkk" };
  }

  return { points: 0 };
}

// --- Main Engine ---

export function calculateMatchScore(
  property: PropertyRow,
  criteria: SearchCriteria,
): { score: number; reasons: string[]; scoreBreakdown: ScoreBreakdown[] } {
  let score = 0;
  const reasons: string[] = [];
  const scoreBreakdown: ScoreBreakdown[] = [];

  // 1. Price Matching (40%)
  const effectivePrice = resolvePropertyPrice(property, criteria.purpose);
  const priceResult = calculatePriceScore(effectivePrice, criteria);
  if (priceResult.points > 0) {
    score += priceResult.points;
    scoreBreakdown.push({ label: "budget", points: priceResult.points });
    if (priceResult.reason) reasons.push(priceResult.reason);
  }

  // 2. Purpose Match (20%)
  const listingType = property.listing_type;
  let purposePoints = 0;
  const isDirectMatch =
    (criteria.purpose === "BUY" && (listingType === "SALE" || listingType === "SALE_AND_RENT")) ||
    (criteria.purpose === "RENT" && (listingType === "RENT" || listingType === "SALE_AND_RENT")) ||
    (criteria.purpose === "INVEST" && (listingType === "SALE" || listingType === "SALE_AND_RENT"));

  if (isDirectMatch) {
    purposePoints = SCORE_WEIGHTS.PURPOSE;
    if (criteria.purpose === "INVEST") reasons.push("investment");
  }

  if (purposePoints > 0) {
    score += purposePoints;
    scoreBreakdown.push({ label: "purpose", points: purposePoints });
  }

  // 3. Area Match (30%)
  const areaResult = calculateAreaScore(property, criteria.area);
  if (areaResult.points > 0) {
    score += areaResult.points;
    scoreBreakdown.push({ label: "location", points: areaResult.points });
    if (areaResult.reason) reasons.push(areaResult.reason);
  }

  // 4. Transit Match (10%)
  let transitPoints = 0;
  if (criteria.nearTransit) {
    if (property.near_transit) {
      transitPoints = SCORE_WEIGHTS.TRANSIT;
      reasons.push("transit_requested");
    }
  } else if (property.near_transit) {
    transitPoints = SCORE_WEIGHTS.TRANSIT * 0.5;
    reasons.push("transit_bonus");
  }
  if (transitPoints > 0) {
    score += transitPoints;
    scoreBreakdown.push({ label: "transit", points: transitPoints });
  }

  // 5. Property Type Match (Bonus/Penalty)
  if (criteria.propertyType) {
    const isVillaMatch =
      criteria.propertyType === "VILLA" &&
      (property.property_type === "VILLA" ||
        property.property_type === "POOL_VILLA" ||
        (property.property_type === "HOUSE" &&
          ((property.price && property.price >= 8000000) ||
           (property.original_price && property.original_price >= 8000000) ||
           (property.rental_price && property.rental_price >= 60000) ||
           (property.original_rental_price && property.original_rental_price >= 60000))));

    const isMatch = property.property_type === criteria.propertyType || isVillaMatch;

    if (isMatch) {
      score += SCORE_WEIGHTS.TYPE_BONUS;
      scoreBreakdown.push({ label: "type", points: SCORE_WEIGHTS.TYPE_BONUS });
      reasons.push("type_match");
    } else {
      score += SCORE_WEIGHTS.TYPE_PENALTY;
      scoreBreakdown.push({ label: "type", points: SCORE_WEIGHTS.TYPE_PENALTY });
    }
  }

  // 6. Airbnb Compatibility Match (Bonus/Penalty)
  let airbnbPoints = 0;
  const propAllowAirbnb = !!(property.allow_airbnb || (property.amenities as any)?.allow_airbnb);

  if (criteria.allowAirbnb || criteria.purpose === "INVEST") {
    if (propAllowAirbnb) {
      airbnbPoints = 15;
      reasons.push("airbnb_friendly");
    } else if (criteria.allowAirbnb) {
      airbnbPoints = -15;
    }
  }

  if (airbnbPoints !== 0) {
    score += airbnbPoints;
    scoreBreakdown.push({ label: "airbnb", points: airbnbPoints });
  }

  // Final Normalization: Always [0, 100]
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, reasons: Array.from(new Set(reasons)), scoreBreakdown };
}
