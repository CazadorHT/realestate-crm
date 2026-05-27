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
 * Reads the 'app-language' cookie.
 */
export async function getServerLanguage(): Promise<Language> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    
    // 1. Detect language from original URL pathname (via x-pathname header)
    const rawPathname = headersList.get("x-pathname") || "/";
    const pathParts = rawPathname.split("/");
    const firstPart = pathParts[1]?.toLowerCase();
    
    if (firstPart === "th") return "th";
    if (firstPart === "en") return "en";
    if (firstPart === "cn") return "cn";
    if (firstPart === "ru") return "ru";

    // 2. Force Thai language for crawlers/search bots on unlocalized default paths (SEO requirement)
    const ua = headersList.get("user-agent")?.toLowerCase() || "";
    const isCrawler = 
      ua.includes("googlebot") || 
      ua.includes("google-certificates-bridge") ||
      ua.includes("google-compliance-checking") ||
      ua.includes("bingbot") || 
      ua.includes("tiktokbot") || 
      ua.includes("facebookexternalhit") || 
      ua.includes("facebot") || 
      ua.includes("facebookplatform") || 
      ua.includes("linebot");

    if (isCrawler) {
      return "th";
    }

    // 3. Fallback to app-language cookie
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("app-language")?.value as Language;
    if (cookieLang && ["th", "en", "cn", "ru"].includes(cookieLang)) {
      return cookieLang;
    }

    // 4. [ELITE FALLBACK] If no cookie, detect via Headers (for the very first load)
    const acceptLang = headersList.get("accept-language")?.toLowerCase();
    const country = headersList.get("x-vercel-ip-country")?.toUpperCase();

    // Check Device Language (Smart Parsing for user preference)
    if (acceptLang) {
      const primaryLang = acceptLang.split(',')[0];
      if (primaryLang.startsWith("th")) return "th";
      if (primaryLang.startsWith("en")) return "en";
      if (primaryLang.startsWith("zh")) return "cn";
      if (primaryLang.startsWith("ru")) return "ru";

      if (acceptLang.includes("th")) return "th";
      if (acceptLang.includes("en")) return "en";
      if (acceptLang.includes("zh")) return "cn";
      if (acceptLang.includes("ru")) return "ru";
    }

    // Fallback to IP-based Location (For tourists/visitors)
    if (country === "CN" || country === "HK" || country === "TW") return "cn";
    if (country === "RU") return "ru";
    if (country && country !== "TH") return "en";

    return "th";
  } catch (error) {
    return "th";
  }
}

/**
 * Server-side translation utility.
 * Returns the appropriate translation function and language.
 */
export async function getServerTranslations() {
  const language = await getServerLanguage();
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
