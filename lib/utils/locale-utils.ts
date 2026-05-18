/**
 * Locale Utility Functions
 * Helpers for retrieving localized values from database objects (Properties, Areas, etc.)
 */

/**
 * V3 Unified Localization Interface
 */
export interface LocalizedValueV3 {
  th?: string | null;
  en?: string | null;
  cn?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Get localized value from an object with fallback to default (Thai)
 * Optimized for V3 JSONB structure while maintaining legacy support.
 *
 * @param data The object containing fields (either JSONB or flat fields)
 * @param field The base field name (e.g., 'title')
 * @param locale The current user locale ('th', 'en', 'cn')
 * @returns The localized string or fallback to default
 */
export function getLocaleValue(
  data: object | null | undefined,
  field: string,
  locale: string,
): string {
  if (!data) return "";

  // Safe internal access for indexing
  const dataObj = data as Record<string, unknown>;
  const rawValue = dataObj[field];

  // --- V3: Hardened JSONB Structure Support ---
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const localizedObj = rawValue as LocalizedValueV3;
    
    // 1. Exact locale match (Elite Priority)
    const exactMatch = localizedObj[locale];
    if (typeof exactMatch === "string" && exactMatch.trim() !== "") {
      return exactMatch;
    }
    
    // 2. Fallback to English (Global Standard)
    if (locale !== "en") {
      const enMatch = localizedObj["en"];
      if (typeof enMatch === "string" && enMatch.trim() !== "") {
        return enMatch;
      }
    }
    
    // 3. Last resort: Thai (Core Default)
    const thMatch = localizedObj["th"];
    if (typeof thMatch === "string" && thMatch.trim() !== "") {
      return thMatch;
    }
    
    // If it's an object but no matching keys, find the first available non-empty string
    const firstString = Object.values(localizedObj).find(
      (v): v is string => typeof v === "string" && v.trim() !== ""
    );
    return firstString || "";
  }

  // --- Legacy: Flat Field Structure Support (title, title_en, title_cn) ---
  const baseValue = typeof rawValue === "string" ? rawValue : "";

  if (locale === "th") {
    return baseValue;
  }

  const localizedField = `${field}_${locale}`;
  const localizedValue = dataObj[localizedField];

  if (typeof localizedValue === "string" && localizedValue.trim() !== "") {
    return localizedValue;
  }

  // Fallback to English for flat fields
  if (locale !== "en") {
    const englishField = `${field}_en`;
    const englishValue = dataObj[englishField];
    if (typeof englishValue === "string" && englishValue.trim() !== "") {
      return englishValue;
    }
  }

  return baseValue;
}
