import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";

export const dictionaries = { th, en, cn };

export type Language = "th" | "en" | "cn";

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

  // Try the language specific field (e.g., title_en, title_cn)
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
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const langValue = cookieStore.get("app-language")?.value as Language;

    return langValue && ["th", "en", "cn"].includes(langValue)
      ? langValue
      : "th";
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
      key.split(".").reduce((prev, curr) => prev?.[curr], dict as any) || key;

    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = (value as string).replace(`{${k}}`, String(v));
      });
    }

    return value as string;
  };

  return { t, language };
}
