import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";
import ru from "@/i18n/locales/ru.json";

export const dictionaries = { th, en, cn, ru };

export type Language = "th" | "en" | "cn" | "ru";

/**
 * Gets the localized field from a data object based on the language.
 * Fallback priority: target language field > default language field > base field.
 */
export function getLocalizedField<T>(
  data: any,
  field: string,
  language: string,
  defaultLang: string = "th",
): T {
  if (!data) return "" as any;

  // Check if we are trying to get a field that is itself a nested object containing regional translations 
  // (e.g., station.description where description is { th: "...", en: "...", ... })
  if (data[field] && typeof data[field] === "object" && !Array.isArray(data[field])) {
    const obj = data[field];
    return (obj[language] || obj[defaultLang] || "") as any;
  }

  // If language is default, return the base field
  if (language === defaultLang) {
    return data[field] || "";
  }

  // Try the language specific field (e.g., title_en, title_cn, title_ru)
  const langField = `${field}_${language}`;
  if (data[langField]) {
    return data[langField];
  }

  // Fallback to base field
  return data[field] || "";
}

/**
 * Server-side language detection.
 * Optimized for Static Generation / ISR (avoids dynamic opt-out unless explicitly needed).
 */
export async function getServerLanguage(explicitLocale?: string): Promise<Language> {
  if (explicitLocale && ["th", "en", "cn", "ru"].includes(explicitLocale)) {
    return explicitLocale as Language;
  }

  // Default fallback for SSG/ISR static pre-rendering
  return "th";
}

/**
 * Server-side translation utility.
 * Returns the appropriate translation function and language.
 */
export async function getServerTranslations(locale?: string) {
  const language = await getServerLanguage(locale);
  const dict = dictionaries[language];

  const t = (key: string, params?: Record<string, string | number>) => {
    let value =
      key.split(".").reduce((prev: any, curr: string) => prev?.[curr], dict as any) || key;

    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = (value as string).replace(`{${k}}`, String(v));
      });
    }

    return value as string;
  };

  return { t, language };
}
