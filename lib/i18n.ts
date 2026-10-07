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

const SUPPORTED_LANGS = ["th", "en", "cn", "zh", "ru"] as const;

/**
 * Normalizes user/URL locale to internal dictionary/DB key.
 * ISO 'zh' (or 'zh-Hans') is mapped to 'cn' for internal dictionary/column lookup.
 */
export function normalizeLocale(locale?: string | null): Language {
  if (!locale) return "th";
  const lower = locale.toLowerCase();
  if (lower === "zh" || lower.startsWith("zh-")) return "cn";
  if (lower === "en") return "en";
  if (lower === "ru") return "ru";
  if (lower === "cn") return "cn";
  return "th";
}

export function getLangPrefix(lang?: string | null): string {
  if (!lang || lang === "th") return "";
  if (lang === "cn" || lang === "zh") return "/zh";
  if (lang === "ru") return "/ru";
  if (lang === "en") return "/en";
  return `/${lang}`;
}

/**
 * Server-side language detection.
 * When explicitLocale is provided (e.g. from URL params or static page),
 * it returns immediately WITHOUT calling cookies(), allowing 100% static ISR Edge caching.
 */
export async function getServerLanguage(explicitLocale?: string): Promise<Language> {
  if (explicitLocale) {
    return normalizeLocale(explicitLocale);
  }

  // 1. Check headers injected by proxy middleware
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const xLocale = headerList.get("x-locale");
    if (xLocale && ["th", "en", "cn", "zh", "ru"].includes(xLocale.toLowerCase())) {
      return normalizeLocale(xLocale);
    }
    const xPathname = headerList.get("x-pathname");
    if (xPathname) {
      const firstSegment = xPathname.split("/").filter(Boolean)[0]?.toLowerCase();
      if (["en", "cn", "zh", "ru"].includes(firstSegment)) {
        return normalizeLocale(firstSegment);
      }
    }
  } catch {
    // headers() throws during static generation — fall through
  }

  // 2. Try reading the cookie from the request for CRM or interactive routes
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const publicLang = cookieStore.get("public-language")?.value;
    if (publicLang) {
      return normalizeLocale(publicLang);
    }
    const crmLang = cookieStore.get("crm-language")?.value;
    if (crmLang) {
      return normalizeLocale(crmLang);
    }
    const langCookie = cookieStore.get("app-language")?.value;
    if (langCookie) {
      return normalizeLocale(langCookie);
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
