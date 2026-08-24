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

const SUPPORTED_LANGS = ["th", "en", "cn", "ru"] as const;

/**
 * Server-side language detection.
 * Reads the `app-language` cookie set by LanguageProvider on the client.
 * Falls back to "th" for static pre-rendering or when no cookie is present.
 */
export async function getServerLanguage(explicitLocale?: string): Promise<Language> {
  if (explicitLocale && (SUPPORTED_LANGS as readonly string[]).includes(explicitLocale)) {
    return explicitLocale as Language;
  }

  // Try reading the cookie from the request (dynamic import to avoid breaking client bundles)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const crmLang = cookieStore.get("crm-language")?.value;
    if (crmLang && (SUPPORTED_LANGS as readonly string[]).includes(crmLang)) {
      return crmLang as Language;
    }
    const langCookie = cookieStore.get("app-language")?.value;
    if (langCookie && (SUPPORTED_LANGS as readonly string[]).includes(langCookie)) {
      return langCookie as Language;
    }
  } catch {
    // cookies() throws during static generation — that's fine, fall through
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
