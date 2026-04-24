/**
 * Locale Utility Functions
 * Helpers for retrieving localized values from database objects (Properties, Areas, etc.)
 */

/**
 * Get localized value from an object with fallback to default (Thai)
 *
 * @param data The object containing fields like 'title', 'title_en', 'title_cn'
 * @param field The base field name (e.g., 'title')
 * @param locale The current user locale ('th', 'en', 'cn')
 * @returns The localized string or fallback to default
 */
export function getLocaleValue<T extends Record<string, any>>(
  data: T | null | undefined,
  field: string,
  locale: string,
): string {
  if (!data) return "";

  // Support for nested paths if needed (optional)
  const baseValue = data[field] || "";

  if (locale === "th") {
    return baseValue;
  }

  const localizedField = `${field}_${locale}`;
  const localizedValue = data[localizedField];

  // 1. Return localized value if it exists
  if (
    localizedValue &&
    typeof localizedValue === "string" &&
    localizedValue.trim() !== ""
  ) {
    return localizedValue;
  }

  // 2. Fallback to English if current locale is not English
  if (locale !== "en") {
    const englishField = `${field}_en`;
    const englishValue = data[englishField];
    if (
      englishValue &&
      typeof englishValue === "string" &&
      englishValue.trim() !== ""
    ) {
      return englishValue;
    }
  }

  // 3. Last resort: Return base value (Thai)
  return baseValue;
}
