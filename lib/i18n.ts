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

  const normalizedLang = (language === "zh" || language?.startsWith("zh-")) ? "cn" : (language || defaultLang);

  // Check if we are trying to get a field that is itself a nested object containing regional translations 
  // (e.g., station.description where description is { th: "...", en: "...", ... })
  if (data[field] && typeof data[field] === "object" && !Array.isArray(data[field])) {
    const obj = data[field];
    if (normalizedLang === defaultLang || normalizedLang === "th") {
      return (obj.th || obj[defaultLang] || "") as any;
    }

    // 1. Try target language
    const exact = obj[normalizedLang] || (normalizedLang === "cn" ? obj.zh : undefined);
    if (exact && typeof exact === "string" && exact.trim() !== "") {
      return exact as any;
    }

    // 2. If zh/cn or ru has no data, fallback to English first
    if (normalizedLang !== "en") {
      const en = obj.en;
      if (en && typeof en === "string" && en.trim() !== "") {
        return en as any;
      }
    }

    // 3. Fallback to default (Thai)
    return (obj[defaultLang] || obj.th || "") as any;
  }

  // If language is default (Thai), return the base field directly
  if (normalizedLang === defaultLang || normalizedLang === "th") {
    return (data[field] || "") as any;
  }

  // 1. Try the language specific field (e.g., title_en, title_cn, title_ru)
  const langField = `${field}_${normalizedLang}`;
  const localizedVal = data[langField] || (normalizedLang === "cn" ? data[`${field}_zh`] : undefined);
  if (localizedVal && typeof localizedVal === "string" && localizedVal.trim() !== "") {
    return localizedVal as any;
  }

  // 2. If zh/cn or ru has no data, fallback to English first
  if (normalizedLang !== "en") {
    const enField = `${field}_en`;
    const enVal = data[enField];
    if (enVal && typeof enVal === "string" && enVal.trim() !== "") {
      return enVal as any;
    }
  }

  // 3. Fallback to base field (Thai)
  return (data[field] || "") as any;
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

  let xPathname: string | null = null;

  // 1. Check headers injected by proxy middleware
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const xLocale = headerList.get("x-locale");
    if (xLocale && ["th", "en", "cn", "zh", "ru"].includes(xLocale.toLowerCase())) {
      return normalizeLocale(xLocale);
    }
    xPathname = headerList.get("x-pathname");
    if (xPathname) {
      const firstSegment = xPathname.split("/").filter(Boolean)[0]?.toLowerCase();
      if (["en", "cn", "zh", "ru"].includes(firstSegment)) {
        return normalizeLocale(firstSegment);
      }
    }
  } catch {
    // headers() throws during static generation — fall through
  }

  // 2. ONLY read cookies for CRM/protected routes.
  // On public SEO routes (ISR), calling cookies() causes Next.js to throw:
  // "Page changed from static to dynamic at runtime, reason: cookies" which causes a 500 Server Error.
  const isProtectedOrCrm = xPathname
    ? (xPathname.startsWith("/protected") || xPathname.startsWith("/admin") || xPathname.startsWith("/auth"))
    : false;

  if (isProtectedOrCrm) {
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
