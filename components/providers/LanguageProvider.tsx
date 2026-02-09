"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import th from "@/i18n/locales/th.json";
import en from "@/i18n/locales/en.json";
import cn from "@/i18n/locales/cn.json";

type Language = "th" | "en" | "cn";
type Translations = typeof th;

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-language") as Language;
    if (saved && ["th", "en", "cn"].includes(saved)) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
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
