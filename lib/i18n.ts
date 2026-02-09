import { cookies } from "next/headers";
import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";

export const dictionaries = { th, en, cn };

export type Language = "th" | "en" | "cn";

/**
 * Server-side translation utility.
 * Reads the 'app-language' cookie and returns the appropriate translation function and language.
 */
export async function getServerTranslations() {
  const cookieStore = await cookies();
  const langValue = cookieStore.get("app-language")?.value as Language;

  const language: Language =
    langValue && ["th", "en", "cn"].includes(langValue) ? langValue : "th";

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
