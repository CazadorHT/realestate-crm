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
  criteria: SearchCriteria,
): { score: number; reasons: string[]; scoreBreakdown: ScoreBreakdown[] } {
  let score = 0;
  const reasons: string[] = [];
  const scoreBreakdown: ScoreBreakdown[] = [];

  // 1. Price Matching (40%)
  let price =
    criteria.purpose === "RENT"
      ? property.rental_price || property.original_rental_price
      : property.price || property.original_price;

  // Fallback for offices if main price is missing
  if (!price && property.property_type === "OFFICE_BUILDING") {
    const sqmPrice =
      criteria.purpose === "RENT"
        ? property.rent_price_per_sqm
        : property.price_per_sqm;

    if (sqmPrice && property.size_sqm) {
      // Estimate total price: sqm_price * size
      price = sqmPrice * property.size_sqm;
    } else {
      // If we only have sqm price and no size, don't use it for budget matching
      // as it's not a total price and will cause false positives (e.g. 1,300 matching 15k-50k budget)
      price = 0;
    }
  }

  // Secondary fallback (Rent <-> Sale cross-check)
  if (!price) {
    price =
      criteria.purpose === "RENT"
        ? property.price || property.rental_price
        : property.rental_price || property.price;
  }

  const effectivePrice = price || 0;
  let pricePoints = 0;

  // Only award points if price is > 0
  if (effectivePrice > 0) {
    if (criteria.budgetMin && criteria.budgetMax) {
      if (
        effectivePrice >= criteria.budgetMin &&
        effectivePrice <= criteria.budgetMax
      ) {
        pricePoints = 40;
        reasons.push("งบไม่เกิน ราคาเหมาะสม");
      } else if (effectivePrice <= criteria.budgetMax * 1.15) {
        pricePoints = 30; // Close enough (within 15%)
        reasons.push("ราคาใกล้เคียงงบประมาณ");
      }
    } else if (criteria.budgetMax) {
      if (effectivePrice <= criteria.budgetMax) {
        pricePoints = 40;
        reasons.push("งบไม่เกิน ราคาเหมาะสม");
      } else if (effectivePrice <= criteria.budgetMax * 1.1) {
        pricePoints = 25;
        reasons.push("เกินงบเล็กน้อยแต่ทำเลดีเยี่ยม");
      }
    }
  }

  if (pricePoints > 0) {
    score += pricePoints;
    scoreBreakdown.push({ label: "งบประมาณ", points: pricePoints });
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
    reasons.push("เหมาะสำหรับการลงทุนระยะยาว");
  }
  if (purposePoints > 0) {
    score += purposePoints;
    scoreBreakdown.push({ label: "ประเภทการซื้อ/เช่า", points: purposePoints });
  }

  // 3. Area Match (30%)
  let areaPoints = 0;
  if (criteria.area) {
    const searchTerms = AREA_MAPPING[criteria.area] || [criteria.area];

    // Priority 1: Exact match in the designated Popular Area field
    if (property.popular_area === criteria.area) {
      areaPoints = 30;
      reasons.push(`อยู่ในย่าน ${criteria.area} ที่คุณระบุพอดี ✨`);
    } else {
      // Priority 2: Keyword match in multiple fields (District, Subdistrict, Title, Description)
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
        reasons.push(`อยู่ในย่าน ${criteria.area} หรือพื้นที่ใกล้เคียง`);
      } else {
        // Bonus: if it's in the same province but not exact area
        if (
          property.province?.includes("กรุงเทพ") ||
          property.province?.includes("Bangkok")
        ) {
          areaPoints = 10;
          reasons.push("ทำเลกรุงเทพฯ เดินทางสะดวกเข้าเมืองง่าย");
        }
      }
    }
  }
  if (areaPoints > 0) {
    score += areaPoints;
    scoreBreakdown.push({ label: "ทำเล/ย่าน", points: areaPoints });
  }

  // 4. Transit Match (10%)
  let transitPoints = 0;
  if (criteria.nearTransit) {
    if (property.near_transit) {
      transitPoints = 10;
      reasons.push("ใกล้สถานีรถไฟฟ้าตามที่คุณต้องการ ✨");
    }
  } else if (property.near_transit) {
    // Even if not requested, it's a bonus
    transitPoints = 5;
    reasons.push("เดินทางสะดวกใกล้ระบบขนส่งสาธารณะ");
  }
  if (transitPoints > 0) {
    score += transitPoints;
    scoreBreakdown.push({ label: "การเดินทาง", points: transitPoints });
  }

  // 5. Property Type Match (Bonus)
  let typePoints = 0;
  if (criteria.propertyType) {
    if (property.property_type === criteria.propertyType) {
      typePoints = 30;
      reasons.push(`เป็นประเภททรัพย์ที่กำลังมองหาพอดี ✨`);
    } else {
      // Small penalty or lower score if doesn't match requested type
      typePoints = -20;
    }
  }
  if (typePoints !== 0) {
    score += typePoints;
    scoreBreakdown.push({ label: "ประเภททรัพย์", points: typePoints });
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return { score, reasons, scoreBreakdown };
}
