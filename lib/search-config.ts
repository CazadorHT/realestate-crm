/**
 * [Diamond-Grade] Centralized Search Configuration
 * Shared between Server (Supabase/SQL) and Client (React Hooks).
 * Ensures consistency across multi-language search intents.
 */

export const SEARCH_SYNONYMS = {
  CATEGORIES: {
    OFFICE_BUILDING: ["ออฟฟิศ", "ออฟฟิส", "ออฟฟิต", "สำนักงาน", "office", "办公室", "辦公室", "офис", "workplace"],
    CONDO: ["คอนโด", "condo", "公寓", "квартира", "апартаменты"],
    HOUSE: ["บ้าน", "house", "房子", "дом", "коттедж", "особняк"],
    TOWNHOME: ["ทาวน์", "town", "联排", "聯排", "таун", "таунхаус"],
    VILLA: ["วิลล่า", "villa", "别墅", "別墅", "вилла"],
    LAND: ["ที่ดิน", "land", "土地", "земля"],
    COMMERCIAL_BUILDING: ["พาณิชย์", "ตึกแถว", "shophouse", "商铺", "商鋪", "коммерция"]
  },
  LISTING_TYPES: {
    SALE: ["ขาย", "sale", "出售", "продажа", "купить", "продам"],
    RENT: ["เช่า", "rent", "出租", "租房", "аренда", "снять"]
  },
  UNITS: {
    BEDROOMS: ["นอน", "bed", "卧室", "臥室", "室", "спальня", "спальни", "сп"],
    BATHROOMS: ["น้ำ", "bath", "浴室", "卫", "衛", "ванная", "санузел", "ванн"],
    SIZE: ["ตรม", "ตร.ม", "sqm", "平方米", "кв.ม", "квม"],
    LAND_SIZE: ["วา", "ตร.ว", "sqwah", "平方哇"]
  },
  FEATURES: {
    POOL: ["พูล", "pool", "游泳池", "бассейн"]
  }
};

/**
 * Utility to detect intent from tokens with strict consumption
 */
export function detectSearchIntent(tokens: string[]) {
  const targetCategories: string[] = [];
  const consumedIndices = new Set<number>();

  // 1. Match categories (Strict order: longer synonyms first could be better, but we use strict loop)
  tokens.forEach((token, index) => {
    const lowerToken = token.toLowerCase();
    for (const [cat, synonyms] of Object.entries(SEARCH_SYNONYMS.CATEGORIES)) {
      if (synonyms.some(s => lowerToken === s || (lowerToken.includes(s) && s.length > 2))) {
        if (!targetCategories.includes(cat)) targetCategories.push(cat);
        consumedIndices.add(index);
        break;
      }
    }
  });

  // 2. Match Listing Types (Consume ALL occurrences)
  let hasSale = false;
  let hasRent = false;
  tokens.forEach((t, i) => {
    const lowerT = t.toLowerCase();
    const isSale = SEARCH_SYNONYMS.LISTING_TYPES.SALE.some(s => lowerT.includes(s));
    const isRent = SEARCH_SYNONYMS.LISTING_TYPES.RENT.some(s => lowerT.includes(s));
    if (isSale) { hasSale = true; consumedIndices.add(i); }
    if (isRent) { hasRent = true; consumedIndices.add(i); }
  });

  let targetListing: "SALE" | "RENT" | "SALE_AND_RENT" | null = null;
  if (hasSale && hasRent) targetListing = "SALE_AND_RENT";
  else if (hasSale) targetListing = "SALE";
  else if (hasRent) targetListing = "RENT";

  // 3. Match Features (Consume ALL)
  const isSearchingPool = tokens.some((t, i) => {
    const match = SEARCH_SYNONYMS.FEATURES.POOL.some(s => t.toLowerCase().includes(s));
    if (match) consumedIndices.add(i);
    return match;
  });

  // 4. Match Numbers & Units (Context-aware consumption)
  let targetBeds: number | null = null;
  let targetBaths: number | null = null;
  let targetMinSize: number | null = null;
  let targetLandSize: number | null = null;

  tokens.forEach((token, index) => {
    const numMatch = token.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const prev = (tokens[index - 1] || "").toLowerCase();
      const curr = token.toLowerCase();
      const next = (tokens[index + 1] || "").toLowerCase();
      const context = prev + curr + next;
      
      // Bedroom detection
      if (SEARCH_SYNONYMS.UNITS.BEDROOMS.some(u => context.includes(u))) {
        targetBeds = num;
        consumedIndices.add(index);
        // Consume the unit word if it's a separate token
        if (next && SEARCH_SYNONYMS.UNITS.BEDROOMS.some(u => next.includes(u))) consumedIndices.add(index + 1);
        if (prev && SEARCH_SYNONYMS.UNITS.BEDROOMS.some(u => prev.includes(u))) consumedIndices.add(index - 1);
      } 
      // Bathroom detection
      else if (SEARCH_SYNONYMS.UNITS.BATHROOMS.some(u => context.includes(u))) {
        targetBaths = num;
        consumedIndices.add(index);
        if (next && SEARCH_SYNONYMS.UNITS.BATHROOMS.some(u => next.includes(u))) consumedIndices.add(index + 1);
        if (prev && SEARCH_SYNONYMS.UNITS.BATHROOMS.some(u => prev.includes(u))) consumedIndices.add(index - 1);
      } 
      // Size detection
      else if (SEARCH_SYNONYMS.UNITS.SIZE.some(u => context.includes(u))) {
        targetMinSize = num;
        consumedIndices.add(index);
        if (next && SEARCH_SYNONYMS.UNITS.SIZE.some(u => next.includes(u))) consumedIndices.add(index + 1);
      }
      // Land size detection
      else if (SEARCH_SYNONYMS.UNITS.LAND_SIZE.some(u => context.includes(u))) {
        targetLandSize = num;
        consumedIndices.add(index);
        if (next && SEARCH_SYNONYMS.UNITS.LAND_SIZE.some(u => next.includes(u))) consumedIndices.add(index + 1);
      }
    }
  });

  return {
    targetCategories,
    targetListing,
    targetBeds,
    targetBaths,
    targetMinSize,
    targetLandSize,
    isSearchingPool,
    remainingTokens: tokens.filter((_, i) => !consumedIndices.has(i))
  };
}
