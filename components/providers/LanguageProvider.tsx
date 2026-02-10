"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";

export type Language = "th" | "en" | "cn";

// Helper to access nested keys "nav.home"
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((prev, curr) => prev?.[curr], obj) || path;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const dictionaries = { th, en, cn };

export function LanguageProvider({
  children,
  initialLanguage = "th",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Recovery: If initialLanguage was somehow wrong but cookie says otherwise
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const cookieLang = getCookie("app-language") as Language;
    if (
      cookieLang &&
      ["th", "en", "cn"].includes(cookieLang) &&
      cookieLang !== language
    ) {
      setLanguageState(cookieLang);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    document.cookie = `app-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh to update server components (metadata, sidebars, etc)
    router.refresh();
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const dict = dictionaries[language];
    let value = getNestedValue(dict, key);

    if (params && typeof value === "string") {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback instead of crash to help debug
    console.warn(
      "useLanguage used outside of LanguageProvider. Providing fallback.",
    );
    return {
      language: "th" as Language,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        let value = key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            value = value.replace(`{${k}}`, String(v));
          });
        }
        return value;
      },
    };
  }
  return context;
}
