import { SearchCriteria, ScoreBreakdown } from "./types";
import { Database } from "@/lib/database.types";

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

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export function calculateMatchScore(
  property: PropertyRow,
  criteria: SearchCriteria & { language?: "en" | "th" | "cn" },
): { score: number; reasons: string[]; scoreBreakdown: ScoreBreakdown[] } {
  let score = 0;
  const reasons: string[] = [];
  const scoreBreakdown: ScoreBreakdown[] = [];
  const lang = criteria.language || "th";

  // Helper to get translated string (mock since we are on server)
  // In a real app we might use a server-side i18n lib,
  // but here we can just use the language to select the right string or key.
  // Note: These should match the keys in our JSON locale files.

  // 1. Price Matching (40%)
  // ... (price logic same)
  let price =
    criteria.purpose === "RENT"
      ? property.rental_price || property.original_rental_price
      : property.price || property.original_price;

  if (!price && property.property_type === "OFFICE_BUILDING") {
    const sqmPrice =
      criteria.purpose === "RENT"
        ? property.rent_price_per_sqm
        : property.price_per_sqm;

    if (sqmPrice && property.size_sqm) {
      price = sqmPrice * property.size_sqm;
    } else {
      price = 0;
    }
  }

  if (!price) {
    price =
      criteria.purpose === "RENT"
        ? property.price || property.rental_price
        : property.rental_price || property.price;
  }

  const effectivePrice = price || 0;
  let pricePoints = 0;

  if (effectivePrice > 0) {
    if (criteria.budgetMin && criteria.budgetMax) {
      if (
        effectivePrice >= criteria.budgetMin &&
        effectivePrice <= criteria.budgetMax
      ) {
        pricePoints = 40;
        reasons.push("budget_ok");
      } else if (effectivePrice <= criteria.budgetMax * 1.15) {
        pricePoints = 30;
        reasons.push("budget_near");
      }
    } else if (criteria.budgetMax) {
      if (effectivePrice <= criteria.budgetMax) {
        pricePoints = 40;
        reasons.push("budget_ok");
      } else if (effectivePrice <= criteria.budgetMax * 1.1) {
        pricePoints = 25;
        reasons.push("budget_slightly_over");
      }
    }
  }

  if (pricePoints > 0) {
    score += pricePoints;
    scoreBreakdown.push({ label: "budget", points: pricePoints });
  }

  // 2. Purpose Match (20%)
  const listingType = property.listing_type;
  let purposePoints = 0;
  if (
    criteria.purpose === "BUY" &&
    (listingType === "SALE" || listingType === "SALE_AND_RENT")
  ) {
    purposePoints = 20;
  } else if (
    criteria.purpose === "RENT" &&
    (listingType === "RENT" || listingType === "SALE_AND_RENT")
  ) {
    purposePoints = 20;
  } else if (
    criteria.purpose === "INVEST" &&
    (listingType === "SALE" || listingType === "SALE_AND_RENT")
  ) {
    purposePoints = 20;
    reasons.push("investment");
  }
  if (purposePoints > 0) {
    score += purposePoints;
    scoreBreakdown.push({ label: "purpose", points: purposePoints });
  }

  // 3. Area Match (30%)
  let areaPoints = 0;
  if (criteria.area) {
    const searchTerms = AREA_MAPPING[criteria.area] || [criteria.area];

    if (property.popular_area === criteria.area) {
      areaPoints = 30;
      reasons.push("area_exact");
    } else {
      const propertyText = `${property.popular_area || ""} ${
        property.district || ""
      } ${property.subdistrict || ""} ${property.title} ${
        property.description
      }`.toLowerCase();

      const isMatch = searchTerms.some((term) =>
        propertyText.includes(term.toLowerCase()),
      );

      if (isMatch) {
        areaPoints = 25;
        reasons.push("area_near");
      } else {
        if (
          property.province?.includes("กรุงเทพ") ||
          property.province?.includes("Bangkok")
        ) {
          areaPoints = 10;
          reasons.push("area_bkk");
        }
      }
    }
  }
  if (areaPoints > 0) {
    score += areaPoints;
    scoreBreakdown.push({ label: "location", points: areaPoints });
  }

  // 4. Transit Match (10%)
  let transitPoints = 0;
  if (criteria.nearTransit) {
    if (property.near_transit) {
      transitPoints = 10;
      reasons.push("transit_requested");
    }
  } else if (property.near_transit) {
    transitPoints = 5;
    reasons.push("transit_bonus");
  }
  if (transitPoints > 0) {
    score += transitPoints;
    scoreBreakdown.push({ label: "transit", points: transitPoints });
  }

  // 5. Property Type Match (Bonus)
  let typePoints = 0;
  if (criteria.propertyType) {
    if (property.property_type === criteria.propertyType) {
      typePoints = 30;
      reasons.push("type_match");
    } else {
      typePoints = -20;
    }
  }
  if (typePoints !== 0) {
    score += typePoints;
    scoreBreakdown.push({ label: "type", points: typePoints });
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return { score, reasons, scoreBreakdown };
}
